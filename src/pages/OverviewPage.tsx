import { useEffect, useMemo, useRef, useState } from 'react'
import { HideoutMapCanvas } from '../components/map/HideoutMapCanvas'
import { MapDetailDrawer } from '../components/map/MapDetailDrawer'
import { StationLevelsPanel } from '../components/map/StationLevelsPanel'
import { TraderLevelsPanel } from '../components/map/TraderLevelsPanel'
import { TargetRequirementsPanel } from '../components/map/TargetRequirementsPanel'
import { useI18n } from '../i18n/useI18n'
import { getItemName, itemMatchesQuery } from '../lib/itemLabel'
import { aggregateRequirements, computeMissing, unlockableUpgrades } from '../lib/planning'
import { getUpgradeStationName } from '../lib/upgradeLabel'
import type { HideoutNodeState } from '../components/map/MapNode'
import { listAllUpgrades } from '../lib/selectors'
import { useHideoutDataStore } from '../store/hideoutDataStore'
import { useUserStore } from '../store/userStore'

export function OverviewPage() {
  const { language, t } = useI18n()
  const data = useHideoutDataStore((state) => state.data)
  const completedUpgradeIds = useUserStore((state) => state.completedUpgradeIds)
  const targetUpgradeIds = useUserStore((state) => state.targetUpgradeIds)
  const inventoryByItemId = useUserStore((state) => state.inventoryByItemId)
  const traderLevelsByTraderId = useUserStore((state) => state.traderLevelsByTraderId)
  const setInventory = useUserStore((state) => state.setInventory)
  const setTraderLevel = useUserStore((state) => state.setTraderLevel)
  const setCompleted = useUserStore((state) => state.setCompleted)
  const syncTargets = useUserStore((state) => state.syncTargets)
  const replaceFromSnapshot = useUserStore((state) => state.replaceFromSnapshot)

  const [searchTerm, setSearchTerm] = useState('')
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false)
  const [selectedUpgradeId, setSelectedUpgradeId] = useState<string | null>(null)
  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const popupRef = useRef<HTMLDivElement | null>(null)
  const allUpgrades = useMemo(() => listAllUpgrades(data), [data])
  const prerequisiteMap = useMemo(() => data?.prereqGraph ?? {}, [data])
  const unlockableSet = useMemo(
    () => new Set(unlockableUpgrades(completedUpgradeIds, prerequisiteMap)),
    [completedUpgradeIds, prerequisiteMap],
  )
  const prereqSatisfiedSet = useMemo(
    () =>
      new Set(
        allUpgrades
          .filter((upgrade) => {
            if (!unlockableSet.has(upgrade.id)) {
              return false
            }

            return upgrade.traderLevelRequirements.every(
              (requirement) =>
                (traderLevelsByTraderId[requirement.traderId] ?? 0) >= requirement.level,
            )
          })
          .map((upgrade) => upgrade.id),
      ),
    [allUpgrades, traderLevelsByTraderId, unlockableSet],
  )
  const completedSet = useMemo(() => new Set(completedUpgradeIds), [completedUpgradeIds])
  const targetedSet = useMemo(() => new Set(targetUpgradeIds), [targetUpgradeIds])

  const searchNeedle = searchTerm.trim().toLowerCase()

  const nodeStateByUpgradeId = useMemo(() => {
    return allUpgrades.reduce<Record<string, HideoutNodeState>>((map, upgrade) => {
      if (completedSet.has(upgrade.id)) {
        map[upgrade.id] = 'completed'
      } else if (targetedSet.has(upgrade.id)) {
        map[upgrade.id] = 'targeted'
      } else if (prereqSatisfiedSet.has(upgrade.id)) {
        map[upgrade.id] = 'available'
      } else {
        map[upgrade.id] = 'locked'
      }
      return map
    }, {})
  }, [allUpgrades, completedSet, prereqSatisfiedSet, targetedSet])

  const visibleUpgradeIds = useMemo(() => {
    if (!data) {
      return new Set<string>()
    }

    return allUpgrades.reduce<Set<string>>((visible, upgrade) => {
      const isAvailable =
        prereqSatisfiedSet.has(upgrade.id) && !completedSet.has(upgrade.id)

      if (showOnlyAvailable && !isAvailable) {
        return visible
      }

      if (searchNeedle) {
        const stationHit =
          getUpgradeStationName(upgrade, language).toLowerCase().includes(searchNeedle) ||
          upgrade.stationName.toLowerCase().includes(searchNeedle) ||
          (upgrade.koStationName?.toLowerCase().includes(searchNeedle) ?? false)
        const itemHit = upgrade.itemRequirements.some((requirement) => {
          const item = data.itemsById[requirement.itemId]
          if (!item) {
            return false
          }
          return itemMatchesQuery(item, searchNeedle)
        })
        if (!stationHit && !itemHit) {
          return visible
        }
      }

      visible.add(upgrade.id)
      return visible
    }, new Set<string>())
  }, [
    allUpgrades,
    data,
    completedSet,
    language,
    searchNeedle,
    showOnlyAvailable,
    prereqSatisfiedSet,
  ])
  const visibleStationCount = useMemo(() => {
    if (!data) {
      return 0
    }
    return data.stations.filter((station) =>
      station.upgrades.some((upgrade) => visibleUpgradeIds.has(upgrade.id)),
    ).length
  }, [data, visibleUpgradeIds])

  const derivedSelectedUpgradeId = useMemo(() => {
    if (!data) {
      return null
    }
    if (selectedUpgradeId && data.upgradesById[selectedUpgradeId]) {
      return selectedUpgradeId
    }
    return null
  }, [data, selectedUpgradeId])

  const selectedUpgrade = useMemo(() => {
    if (!data || !derivedSelectedUpgradeId) {
      return null
    }
    return data.upgradesById[derivedSelectedUpgradeId] ?? null
  }, [data, derivedSelectedUpgradeId])

  const selectedStation = useMemo(() => {
    if (!data || !selectedUpgrade) {
      return null
    }
    return data.stations.find((station) => station.id === selectedUpgrade.stationId) ?? null
  }, [data, selectedUpgrade])

  const desiredAutoTargetIds = useMemo(
    () =>
      Array.from(prereqSatisfiedSet)
        .filter((upgradeId) => !completedSet.has(upgradeId))
        .sort((left, right) => left.localeCompare(right)),
    [completedSet, prereqSatisfiedSet],
  )

  useEffect(() => {
    const current = [...targetUpgradeIds].sort((left, right) => left.localeCompare(right))
    const isSameLength = current.length === desiredAutoTargetIds.length
    const isSame =
      isSameLength &&
      current.every((upgradeId, index) => upgradeId === desiredAutoTargetIds[index])

    if (!isSame) {
      syncTargets(desiredAutoTargetIds)
    }
  }, [desiredAutoTargetIds, syncTargets, targetUpgradeIds])

  useEffect(() => {
    if (!selectedStation || !isPopupOpen) {
      return
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof Node)) {
        return
      }
      if (popupRef.current?.contains(target)) {
        return
      }
      setIsPopupOpen(false)
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsPopupOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isPopupOpen, selectedStation])

  const targetUpgrades = useMemo(
    () => {
      if (!data) {
        return []
      }
      return targetUpgradeIds
        .map((upgradeId) => data.upgradesById[upgradeId])
        .filter(
          (upgrade): upgrade is (typeof data.upgradesById)[string] =>
            Boolean(upgrade) && !completedSet.has(upgrade.id),
        )
    },
    [completedSet, data, targetUpgradeIds],
  )

  const targetRequirementTotals = useMemo(
    () => aggregateRequirements(targetUpgrades),
    [targetUpgrades],
  )
  const targetMissingTotals = useMemo(
    () => computeMissing(targetRequirementTotals, inventoryByItemId),
    [inventoryByItemId, targetRequirementTotals],
  )

  const targetRequirementRows = useMemo(
    () => {
      const foundInRaidByItemId = targetUpgrades.reduce<Record<string, boolean>>((map, upgrade) => {
        upgrade.itemRequirements.forEach((requirement) => {
          if (requirement.foundInRaidRequired) {
            map[requirement.itemId] = true
          }
        })
        return map
      }, {})

      return Object.entries(targetRequirementTotals)
        .map(([itemId, required]) => {
          const owned = inventoryByItemId[itemId] ?? 0
          const missing = targetMissingTotals[itemId] ?? 0
          return {
            itemId,
            name:
              data?.itemsById[itemId] !== undefined
                ? getItemName(data.itemsById[itemId], language)
                : itemId,
            iconLink: data?.itemsById[itemId]?.iconLink ?? null,
            foundInRaidRequired: foundInRaidByItemId[itemId] ?? false,
            required,
            owned,
            missing,
          }
        })
        .sort((left, right) => right.missing - left.missing || left.name.localeCompare(right.name))
    },
    [
      data,
      language,
      inventoryByItemId,
      targetMissingTotals,
      targetRequirementTotals,
      targetUpgrades,
    ],
  )

  const traderLevelRows = useMemo(() => {
    if (!data) {
      return []
    }

    const byId = new Map<
      string,
      { traderId: string; name: string; koName?: string; maxRequiredLevel: number }
    >()

    Object.values(data.upgradesById).forEach((upgrade) => {
      upgrade.traderLevelRequirements.forEach((requirement) => {
        const existing = byId.get(requirement.traderId)
        if (!existing) {
          byId.set(requirement.traderId, {
            traderId: requirement.traderId,
            name: requirement.traderName,
            koName: requirement.koTraderName,
            maxRequiredLevel: requirement.level,
          })
          return
        }

        existing.maxRequiredLevel = Math.max(existing.maxRequiredLevel, requirement.level)
        if (!existing.koName && requirement.koTraderName) {
          existing.koName = requirement.koTraderName
        }
      })
    })

    return Array.from(byId.values())
      .map((row) => ({
        traderId: row.traderId,
        name: language === 'ko' ? (row.koName ?? row.name) : row.name,
        currentLevel: traderLevelsByTraderId[row.traderId] ?? 0,
        maxRequiredLevel: row.maxRequiredLevel,
      }))
      .sort(
        (left, right) =>
          left.name.localeCompare(right.name) || left.maxRequiredLevel - right.maxRequiredLevel,
      )
  }, [data, language, traderLevelsByTraderId])

  const stationLevelRows = useMemo(() => {
    if (!data) {
      return []
    }

    return [...data.stations]
      .map((station) => {
        const currentLevel = station.upgrades.reduce((maxLevel, upgrade) => {
          if (completedSet.has(upgrade.id)) {
            return Math.max(maxLevel, upgrade.level)
          }
          return maxLevel
        }, 0)

        const maxLevel = station.upgrades.reduce(
          (max, upgrade) => Math.max(max, upgrade.level),
          0,
        )

        return {
          stationId: station.id,
          name: language === 'ko' ? (station.koName ?? station.name) : station.name,
          iconLink: station.imageLink,
          currentLevel,
          maxLevel,
        }
      })
      .sort((left, right) => left.name.localeCompare(right.name))
  }, [completedSet, data, language])

  if (!data) {
    return <p>{t('common.loadingHideoutData')}</p>
  }

  return (
    <div className="map-page">
      <section className="map-toolbar">
        <label className="search-label map-search">
          {t('overview.searchLabel')}
          <input
            className="text-input"
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder={t('overview.searchPlaceholder')}
          />
        </label>
        <label className="toggle-chip">
          <input
            type="checkbox"
            checked={showOnlyAvailable}
            onChange={(event) => setShowOnlyAvailable(event.target.checked)}
          />
          {t('overview.onlyAvailable')}
        </label>
        <button
          className="action-button"
          type="button"
          onClick={() => {
            if (!window.confirm(t('overview.resetConfirm'))) {
              return
            }
            replaceFromSnapshot({
              completedUpgradeIds: [],
              targetUpgradeIds: [],
              inventoryByItemId,
              traderLevelsByTraderId,
            })
            setSelectedUpgradeId(null)
            setIsPopupOpen(false)
          }}
        >
          {t('overview.resetToLevelOne')}
        </button>
        <span className="meta-text">
          {t('overview.visibleNodes', { count: visibleStationCount })}
        </span>
      </section>

      <div className="map-layout">
        <div className="map-main-column">
          <div className="map-canvas-stack">
            <HideoutMapCanvas
              stations={data.stations}
              prereqGraph={data.prereqGraph}
              nodeStateByUpgradeId={nodeStateByUpgradeId}
              visibleUpgradeIds={visibleUpgradeIds}
              selectedUpgradeId={derivedSelectedUpgradeId}
              onSelectUpgrade={(upgradeId) => {
                setSelectedUpgradeId(upgradeId)
                setIsPopupOpen(true)
              }}
            />
            {selectedStation && isPopupOpen ? (
              <div className="map-popup" ref={popupRef}>
                <MapDetailDrawer
                  station={selectedStation}
                  selectedUpgradeId={derivedSelectedUpgradeId}
                  nodeStateByUpgradeId={nodeStateByUpgradeId}
                  completedUpgradeIds={completedUpgradeIds}
                  itemsById={data.itemsById}
                  inventoryByItemId={inventoryByItemId}
                  onClose={() => setIsPopupOpen(false)}
                  onSelectUpgrade={(upgradeId) => {
                    setSelectedUpgradeId(upgradeId)
                    setIsPopupOpen(true)
                  }}
                  onToggleCompleted={(upgradeId) => {
                    const upgrade = data.upgradesById[upgradeId]
                    if (!upgrade) {
                      return
                    }

                    const currentlyCompleted = completedUpgradeIds.includes(upgradeId)
                    const nextCompleted = !currentlyCompleted
                    setCompleted(upgradeId, nextCompleted)

                    const station = data.stations.find((entry) => entry.id === upgrade.stationId)
                    if (!station) {
                      return
                    }

                    if (nextCompleted) {
                      const nextUpgrade = [...station.upgrades]
                        .sort((left, right) => left.level - right.level)
                        .find((entry) => entry.level > upgrade.level)
                      if (nextUpgrade) {
                        setSelectedUpgradeId(nextUpgrade.id)
                        setIsPopupOpen(true)
                        return
                      }
                    }

                    if (!nextCompleted && upgrade.level > 1) {
                      const previousUpgrade =
                        [...station.upgrades]
                          .filter((entry) => entry.level < upgrade.level)
                          .sort((left, right) => right.level - left.level)[0] ?? null
                      if (previousUpgrade) {
                        setSelectedUpgradeId(previousUpgrade.id)
                        setIsPopupOpen(true)
                        return
                      }
                    }

                    setSelectedUpgradeId(upgrade.id)
                    setIsPopupOpen(true)
                  }}
                  onDestroy={(upgradeId) => {
                    const upgrade = data.upgradesById[upgradeId]
                    if (!upgrade || upgrade.level <= 1) {
                      return
                    }

                    const station = data.stations.find((entry) => entry.id === upgrade.stationId)
                    if (!station) {
                      return
                    }

                    const nextCompletedUpgradeIds = completedUpgradeIds.filter((id) => {
                      const candidate = data.upgradesById[id]
                      if (!candidate) {
                        return false
                      }
                      if (candidate.stationId !== upgrade.stationId) {
                        return true
                      }
                      return candidate.level < upgrade.level
                    })

                    const nextTargetUpgradeIds = targetUpgradeIds.filter((id) => {
                      const candidate = data.upgradesById[id]
                      if (!candidate) {
                        return false
                      }
                      if (candidate.stationId !== upgrade.stationId) {
                        return true
                      }
                      return candidate.level < upgrade.level
                    })

                    replaceFromSnapshot({
                      completedUpgradeIds: nextCompletedUpgradeIds,
                      targetUpgradeIds: nextTargetUpgradeIds,
                      inventoryByItemId,
                      traderLevelsByTraderId,
                    })

                    const previousUpgrade =
                      [...station.upgrades]
                        .filter((entry) => entry.level < upgrade.level)
                        .sort((left, right) => right.level - left.level)[0] ?? null

                    setSelectedUpgradeId(previousUpgrade?.id ?? station.upgrades[0]?.id ?? null)
                    setIsPopupOpen(true)
                  }}
                />
              </div>
            ) : null}
          </div>

          <StationLevelsPanel
            rows={stationLevelRows}
            onSetStationLevel={(stationId, level) => {
              const station = data.stations.find((entry) => entry.id === stationId)
              if (!station) {
                return
              }

              const boundedLevel = Math.max(
                0,
                Math.min(
                  level,
                  station.upgrades.reduce(
                    (max, upgrade) => Math.max(max, upgrade.level),
                    0,
                  ),
                ),
              )

              const nextCompletedSet = new Set(completedUpgradeIds)
              station.upgrades.forEach((upgrade) => {
                if (upgrade.level <= boundedLevel && boundedLevel > 0) {
                  nextCompletedSet.add(upgrade.id)
                } else {
                  nextCompletedSet.delete(upgrade.id)
                }
              })

              replaceFromSnapshot({
                completedUpgradeIds: Array.from(nextCompletedSet),
                targetUpgradeIds,
                inventoryByItemId,
                traderLevelsByTraderId,
              })

              if (selectedUpgrade?.stationId === stationId) {
                const focusLevel = Math.max(1, boundedLevel)
                const focusUpgrade =
                  station.upgrades.find((upgrade) => upgrade.level === focusLevel) ??
                  station.upgrades[0]
                if (focusUpgrade) {
                  setSelectedUpgradeId(focusUpgrade.id)
                }
              }
            }}
          />
        </div>

        <div className="map-side-column">
          <TraderLevelsPanel
            rows={traderLevelRows}
            onSetTraderLevel={setTraderLevel}
            onSetAllMaxLevels={() => {
              const nextTraderLevelsByTraderId = { ...traderLevelsByTraderId }

              traderLevelRows.forEach((row) => {
                nextTraderLevelsByTraderId[row.traderId] = 4
              })

              replaceFromSnapshot({
                completedUpgradeIds,
                targetUpgradeIds,
                inventoryByItemId,
                traderLevelsByTraderId: nextTraderLevelsByTraderId,
              })
            }}
          />
          <TargetRequirementsPanel
            rows={targetRequirementRows}
            onSetOwned={setInventory}
          />
        </div>
      </div>
    </div>
  )
}
