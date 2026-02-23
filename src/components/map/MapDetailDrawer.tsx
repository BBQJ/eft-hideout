import { useI18n } from '../../i18n/useI18n'
import { getItemName } from '../../lib/itemLabel'
import {
  getPrerequisiteStationName,
  getUpgradeDescription,
  getUpgradeStationName,
} from '../../lib/upgradeLabel'
import type { HideoutUpgrade, ItemMeta } from '../../types/domain'
import type { HideoutNodeState } from './MapNode'

interface MapDetailDrawerProps {
  upgrade: HideoutUpgrade | null
  nodeState: HideoutNodeState | null
  itemsById: Record<string, ItemMeta>
  inventoryByItemId: Record<string, number>
  isCompleted: boolean
  onToggleCompleted: () => void
  onDestroy?: () => void
  onClose?: () => void
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
}

export function MapDetailDrawer({
  upgrade,
  nodeState,
  itemsById,
  inventoryByItemId,
  isCompleted,
  onToggleCompleted,
  onDestroy,
  onClose,
}: MapDetailDrawerProps) {
  const { language, t } = useI18n()

  if (!upgrade) {
    return (
      <aside className="map-drawer">
        <h2>{t('drawer.title')}</h2>
        <p className="meta-text">{t('drawer.emptyDesc')}</p>
      </aside>
    )
  }

  const traderPrerequisites = upgrade.traderLevelRequirements

  return (
    <aside className="map-drawer">
      <header className="map-drawer-head">
        <h2>
          {getUpgradeStationName(upgrade, language)} {t('common.level')}
          {upgrade.level}
        </h2>
        <div className="map-drawer-head-actions">
          <span className={`state-pill is-${nodeState ?? 'locked'}`}>
            {t(`state.${nodeState ?? 'locked'}`)}
          </span>
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

      <p className="meta-text">
        {t('drawer.buildTime', { time: formatDuration(upgrade.constructionTimeSeconds) })}
      </p>
      <p>{getUpgradeDescription(upgrade, language)}</p>

      <div className="detail-actions">
        <button className="action-button" type="button" onClick={onToggleCompleted}>
          {isCompleted ? t('drawer.markIncomplete') : t('drawer.markCompleted')}
        </button>
        <button
          className="action-button danger-button"
          type="button"
          onClick={onDestroy}
          disabled={!onDestroy}
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
                        <img className="item-thumb" src={item.iconLink} alt="" loading="lazy" />
                      ) : (
                        <span className="item-thumb is-empty" aria-hidden="true" />
                      )}
                      {requirement.foundInRaidRequired ? (
                        <span
                          className="item-thumb-badge"
                          title={t('common.foundInRaid')}
                          aria-label={t('common.foundInRaid')}
                        >
                          ✓
                        </span>
                      ) : null}
                    </span>
                    <span className="item-label">
                      {item ? getItemName(item, language) : requirement.itemId} x
                      {requirement.count}
                    </span>
                  </span>
                  <strong>
                    {missing > 0 ? t('drawer.missing', { count: missing }) : t('drawer.ready')}
                  </strong>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section>
        <h3>{t('drawer.prerequisites')}</h3>
        {upgrade.stationLevelRequirements.length === 0 && traderPrerequisites.length === 0 ? (
          <p className="meta-text">{t('drawer.noStationPrerequisites')}</p>
        ) : (
          <>
            {upgrade.stationLevelRequirements.length > 0 ? (
              <ul className="simple-list">
                {upgrade.stationLevelRequirements.map((prerequisite) => (
                  <li key={prerequisite.upgradeId}>
                    <span>
                      {getPrerequisiteStationName(prerequisite, language)} {t('common.level')}
                      {prerequisite.level}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}

            {traderPrerequisites.length > 0 ? (
              <>
                <h4 className="mini-section-title">{t('drawer.traderPrerequisites')}</h4>
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
    </aside>
  )
}
