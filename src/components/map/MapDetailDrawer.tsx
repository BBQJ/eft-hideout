import { useMemo } from 'react'
import { useI18n } from '../../i18n/useI18n'
import { getItemName } from '../../lib/itemLabel'
import {
  getPrerequisiteStationName,
  getUpgradeDescription,
} from '../../lib/upgradeLabel'
import type { HideoutStation, ItemMeta } from '../../types/domain'
import type { HideoutNodeState } from './MapNode'

interface MapDetailDrawerProps {
  station: HideoutStation | null
  selectedUpgradeId: string | null
  nodeStateByUpgradeId: Record<string, HideoutNodeState>
  completedUpgradeIds: string[]
  itemsById: Record<string, ItemMeta>
  inventoryByItemId: Record<string, number>
  onSelectUpgrade: (upgradeId: string) => void
  onToggleCompleted: (upgradeId: string) => void
  onDestroy: (upgradeId: string) => void
  onClose?: () => void
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
}

export function MapDetailDrawer({
  station,
  selectedUpgradeId,
  nodeStateByUpgradeId,
  completedUpgradeIds,
  itemsById,
  inventoryByItemId,
  onSelectUpgrade,
  onToggleCompleted,
  onDestroy,
  onClose,
}: MapDetailDrawerProps) {
  const { language, t } = useI18n()

  const completedSet = useMemo(() => new Set(completedUpgradeIds), [completedUpgradeIds])

  if (!station) {
    return (
      <aside className="map-drawer">
        <h2>{t('drawer.title')}</h2>
        <p className="meta-text">{t('drawer.emptyDesc')}</p>
      </aside>
    )
  }

  const orderedUpgrades = [...station.upgrades].sort((left, right) => left.level - right.level)
  const highestCompletedUpgrade =
    [...orderedUpgrades]
      .filter((upgrade) => completedSet.has(upgrade.id))
      .sort((left, right) => right.level - left.level)[0] ?? null
  const expandedUpgradeId =
    (selectedUpgradeId &&
    orderedUpgrades.some((upgrade) => upgrade.id === selectedUpgradeId)
      ? selectedUpgradeId
      : null) ??
    highestCompletedUpgrade?.id ??
    orderedUpgrades[0]?.id ??
    null

  const stationLabel = language === 'ko' ? (station.koName ?? station.name) : station.name

  return (
    <aside className="map-drawer">
      <header className="map-drawer-head">
        <div>
          <h2>{stationLabel}</h2>
          <p className="meta-text">
            {t('common.level')}
            {highestCompletedUpgrade?.level ?? 0}
          </p>
        </div>
        <div className="map-drawer-head-actions">
          {onClose ? (
            <button
              className="icon-button"
              type="button"
              onClick={onClose}
              aria-label={t('common.close')}
              title={t('common.close')}
            >
              x
            </button>
          ) : null}
        </div>
      </header>

      <div className="drawer-level-list">
        {orderedUpgrades.map((upgrade) => {
          const isExpanded = upgrade.id === expandedUpgradeId
          const isCompleted = completedSet.has(upgrade.id)
          const nodeState = nodeStateByUpgradeId[upgrade.id] ?? 'locked'
          const traderPrerequisites = upgrade.traderLevelRequirements

          return (
            <section
              key={upgrade.id}
              className={`drawer-level-card ${isExpanded ? 'is-expanded' : ''}`}
            >
              <button
                type="button"
                className="drawer-level-summary"
                onClick={() => onSelectUpgrade(upgrade.id)}
              >
                <span className="drawer-level-summary-left">
                  <strong>
                    {t('common.level')}
                    {upgrade.level}
                  </strong>
                  <span className="meta-text">
                    {t('drawer.buildTime', {
                      time: formatDuration(upgrade.constructionTimeSeconds),
                    })}
                  </span>
                </span>
                <span className={`state-pill is-${nodeState}`}>{t(`state.${nodeState}`)}</span>
              </button>

              {isExpanded ? (
                <div className="drawer-level-body">
                  <p>{getUpgradeDescription(upgrade, language)}</p>

                  <div className="detail-actions">
                    <button
                      className="action-button"
                      type="button"
                      onClick={() => onToggleCompleted(upgrade.id)}
                    >
                      {isCompleted
                        ? t('drawer.markIncomplete')
                        : t('drawer.markCompleted')}
                    </button>
                    <button
                      className="action-button danger-button"
                      type="button"
                      onClick={() => onDestroy(upgrade.id)}
                      disabled={upgrade.level <= 1}
                    >
                      {t('drawer.destroy')}
                    </button>
                  </div>

                  <section>
                    <h3>{t('drawer.requirements')}</h3>
                    {upgrade.itemRequirements.length === 0 ? (
                      <p className="meta-text">{t('drawer.noItemsRequired')}</p>
                    ) : (
                      <ul className="simple-list">
                        {upgrade.itemRequirements.map((requirement) => {
                          const item = itemsById[requirement.itemId]
                          const owned = inventoryByItemId[requirement.itemId] ?? 0
                          const missing = Math.max(requirement.count - owned, 0)

                          return (
                            <li key={requirement.itemId}>
                              <span className="item-cell">
                                <span className="item-thumb-wrap">
                                  {item?.iconLink ? (
                                    <img
                                      className="item-thumb"
                                      src={item.iconLink}
                                      alt=""
                                      loading="lazy"
                                    />
                                  ) : (
                                    <span className="item-thumb is-empty" aria-hidden="true" />
                                  )}
                                  {requirement.foundInRaidRequired ? (
                                    <span
                                      className="item-thumb-badge"
                                      title={t('common.foundInRaid')}
                                      aria-label={t('common.foundInRaid')}
                                    >
                                      ??
                                    </span>
                                  ) : null}
                                </span>
                                <span className="item-label">
                                  {item ? getItemName(item, language) : requirement.itemId} x
                                  {requirement.count}
                                </span>
                              </span>
                              <strong>
                                {missing > 0
                                  ? t('drawer.missing', { count: missing })
                                  : t('drawer.ready')}
                              </strong>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </section>

                  <section>
                    <h3>{t('drawer.prerequisites')}</h3>
                    {upgrade.stationLevelRequirements.length === 0 &&
                    traderPrerequisites.length === 0 ? (
                      <p className="meta-text">{t('drawer.noStationPrerequisites')}</p>
                    ) : (
                      <>
                        {upgrade.stationLevelRequirements.length > 0 ? (
                          <ul className="simple-list">
                            {upgrade.stationLevelRequirements.map((prerequisite) => (
                              <li key={prerequisite.upgradeId}>
                                <span>
                                  {getPrerequisiteStationName(prerequisite, language)}{' '}
                                  {t('common.level')}
                                  {prerequisite.level}
                                </span>
                              </li>
                            ))}
                          </ul>
                        ) : null}

                        {traderPrerequisites.length > 0 ? (
                          <>
                            <h4 className="mini-section-title">
                              {t('drawer.traderPrerequisites')}
                            </h4>
                            <ul className="simple-list">
                              {traderPrerequisites.map((requirement) => (
                                <li key={`${requirement.traderId}:${requirement.level}`}>
                                  <span>
                                    {language === 'ko'
                                      ? (requirement.koTraderName ?? requirement.traderName)
                                      : requirement.traderName}{' '}
                                    {t('common.level')}
                                    {requirement.level}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </>
                        ) : null}
                      </>
                    )}
                  </section>
                </div>
              ) : null}
            </section>
          )
        })}
      </div>
    </aside>
  )
}
