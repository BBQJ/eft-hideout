import { readCache, writeCache } from './cache'
import { HIDEOUT_PROGRESSION_QUERY } from './queries'
import type {
  HideoutData,
  HideoutStation,
  HideoutUpgrade,
  ItemMeta,
} from '../types/domain'
import type {
  GraphQLResponse,
  HideoutProgressionQueryData,
  HideoutProgressionQueryVariables,
} from '../types/graphql'

const TARKOV_GRAPHQL_ENDPOINT = 'https://api.tarkov.dev/graphql'
const HIDEOUT_CACHE_CONFIG = {
  key: 'eft-hideout:progression:v5',
  schemaVersion: 5,
  ttlMs: 24 * 60 * 60 * 1000,
} as const

export function makeUpgradeId(stationId: string, level: number): string {
  return `${stationId}:${level}`
}

export async function fetchGraphQL<
  TData,
  TVariables extends Record<string, unknown> = Record<string, never>,
>(
  query: string,
  variables?: TVariables,
): Promise<TData> {
  const response = await fetch(TARKOV_GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables: variables ?? {},
    }),
  })

  if (!response.ok) {
    throw new Error(`GraphQL request failed: ${response.status}`)
  }

  const payload = (await response.json()) as GraphQLResponse<TData>
  if (payload.errors && payload.errors.length > 0) {
    throw new Error(payload.errors.map((entry) => entry.message).join(', '))
  }
  if (!payload.data) {
    throw new Error('GraphQL response contained no data')
  }

  return payload.data
}

function normalizeResponse(
  response: HideoutProgressionQueryData,
): Omit<HideoutData, 'source'> {
  const itemsById: Record<string, ItemMeta> = {}
  const upgradesById: Record<string, HideoutUpgrade> = {}
  const prereqGraph: Record<string, string[]> = {}
  const koStationById = response.koStations.reduce<
    Record<
      string,
      {
        name: string
        descriptionsByLevel: Record<number, string>
        traderRequirementsByLevel: Record<
          number,
          Array<{
            traderId: string
            traderName: string
            value: number | null
          }>
        >
      }
    >
  >((map, station) => {
    map[station.id] = {
      name: station.name,
      descriptionsByLevel: station.levels.reduce<Record<number, string>>(
        (levelMap, level) => {
          levelMap[level.level] = level.description
          return levelMap
        },
        {},
      ),
      traderRequirementsByLevel: station.levels.reduce(
        (levelMap, level) => {
          levelMap[level.level] = level.traderRequirements.map((entry) => ({
            traderId: entry.trader.id,
            traderName: entry.trader.name,
            value: entry.value,
          }))
          return levelMap
        },
        {} as Record<number, Array<{ traderId: string; traderName: string; value: number | null }>>,
      ),
    }
    return map
  }, {})
  const koItemLabelsById = response.koStations.reduce<
    Record<string, { name: string | null; shortName: string | null }>
  >((map, station) => {
    station.levels.forEach((level) => {
      level.itemRequirements.forEach((entry) => {
        if (!entry.item?.id) {
          return
        }
        map[entry.item.id] = {
          name: entry.item.name,
          shortName: entry.item.shortName,
        }
      })
    })
    return map
  }, {})

  const stations: HideoutStation[] = response.enStations.map((station) => {
    const upgrades = [...station.levels]
      .sort((left, right) => left.level - right.level)
      .map((level) => {
        const id = makeUpgradeId(station.id, level.level)
        const koStation = koStationById[station.id]
        const itemRequirements = level.itemRequirements
          .filter((entry) => Boolean(entry.item?.id))
          .map((entry) => {
            const itemId = entry.item.id
            const koLabel = koItemLabelsById[itemId]
            const foundInRaidRequired = entry.attributes.some(
              (attribute) =>
                attribute.name === 'foundInRaid' &&
                typeof attribute.value === 'string' &&
                attribute.value.toLowerCase() === 'true',
            )
            itemsById[itemId] = {
              id: itemId,
              name: entry.item.name ?? entry.item.shortName ?? 'Unknown Item',
              shortName: entry.item.shortName ?? entry.item.name ?? 'Unknown',
              koName: koLabel?.name ?? undefined,
              koShortName: koLabel?.shortName ?? undefined,
              iconLink: entry.item.iconLink,
            }
            return {
              itemId,
              count: entry.count,
              foundInRaidRequired,
            }
          })

        const upgrade: HideoutUpgrade = {
          id,
          stationId: station.id,
          stationName: station.name,
          koStationName: koStation?.name,
          level: level.level,
          description: level.description,
          koDescription: koStation?.descriptionsByLevel[level.level],
          constructionTimeSeconds: level.constructionTime,
          itemRequirements,
          stationLevelRequirements: level.stationLevelRequirements.map((entry) => ({
            stationId: entry.station.id,
            stationName: entry.station.name,
            koStationName: koStationById[entry.station.id]?.name,
            level: entry.level,
            upgradeId: makeUpgradeId(entry.station.id, entry.level),
          })),
          traderLevelRequirements: level.traderRequirements
            .filter((entry) => Boolean(entry.trader?.id) && typeof entry.value === 'number')
            .map((entry) => {
              const koTrader = koStation?.traderRequirementsByLevel[level.level]?.find(
                (candidate) => candidate.traderId === entry.trader.id,
              )
              return {
                traderId: entry.trader.id,
                traderName: entry.trader.name,
                koTraderName: koTrader?.traderName,
                level: entry.value ?? 0,
              }
            }),
        }

        upgradesById[id] = upgrade
        prereqGraph[id] = upgrade.stationLevelRequirements.map((entry) => entry.upgradeId)
        return upgrade
      })

    return {
      id: station.id,
      name: station.name,
      koName: koStationById[station.id]?.name,
      imageLink: station.imageLink,
      upgrades,
    }
  })

  return {
    stations,
    upgradesById,
    itemsById,
    prereqGraph,
    fetchedAt: new Date().toISOString(),
  }
}

export async function fetchHideoutData(forceRefresh = false): Promise<HideoutData> {
  if (!forceRefresh) {
    const cached = readCache<Omit<HideoutData, 'source'>>(HIDEOUT_CACHE_CONFIG)
    if (cached) {
      return {
        ...cached,
        source: 'cache',
      }
    }
  }

  const response = await fetchGraphQL<
    HideoutProgressionQueryData,
    HideoutProgressionQueryVariables
  >(
    HIDEOUT_PROGRESSION_QUERY.query,
    HIDEOUT_PROGRESSION_QUERY.defaultVariables,
  )
  const normalized = normalizeResponse(response)
  writeCache(HIDEOUT_CACHE_CONFIG, normalized)

  return {
    ...normalized,
    source: 'network',
  }
}
