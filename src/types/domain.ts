export interface ItemMeta {
  id: string
  name: string
  shortName: string
  koName?: string
  koShortName?: string
  iconLink: string | null
}

export interface ItemRequirement {
  itemId: string
  count: number
  foundInRaidRequired: boolean
}

export interface StationLevelRequirement {
  stationId: string
  stationName: string
  koStationName?: string
  level: number
  upgradeId: string
}

export interface TraderLevelRequirement {
  traderId: string
  traderName: string
  koTraderName?: string
  level: number
}

export interface HideoutUpgrade {
  id: string
  stationId: string
  stationName: string
  koStationName?: string
  level: number
  description: string
  koDescription?: string
  constructionTimeSeconds: number
  itemRequirements: ItemRequirement[]
  stationLevelRequirements: StationLevelRequirement[]
  traderLevelRequirements: TraderLevelRequirement[]
}

export interface HideoutStation {
  id: string
  name: string
  koName?: string
  imageLink: string | null
  upgrades: HideoutUpgrade[]
}

export interface HideoutIndexes {
  upgradesById: Record<string, HideoutUpgrade>
  itemsById: Record<string, ItemMeta>
  prereqGraph: Record<string, string[]>
}

export interface HideoutData extends HideoutIndexes {
  stations: HideoutStation[]
  fetchedAt: string
  source: 'network' | 'cache'
}

export interface UserSnapshot {
  completedUpgradeIds: string[]
  targetUpgradeIds: string[]
  inventoryByItemId: Record<string, number>
  traderLevelsByTraderId: Record<string, number>
}
