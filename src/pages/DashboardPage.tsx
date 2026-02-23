import { useMemo } from 'react'
import { useI18n } from '../i18n/useI18n'
import { getItemName } from '../lib/itemLabel'
import { aggregateRequirements, computeMissing } from '../lib/planning'
import { getUpgradeStationName } from '../lib/upgradeLabel'
import { useHideoutDataStore } from '../store/hideoutDataStore'
import { useUserStore } from '../store/userStore'

export function DashboardPage() {
  const { language, t } = useI18n()
  const data = useHideoutDataStore((state) => state.data)
  const targetUpgradeIds = useUserStore((state) => state.targetUpgradeIds)
  const inventoryByItemId = useUserStore((state) => state.inventoryByItemId)
  const setTarget = useUserStore((state) => state.setTarget)

  const targetUpgrades = useMemo(() => {
    if (!data) {
      return []
    }
    return targetUpgradeIds
      .map((upgradeId) => data.upgradesById[upgradeId])
      .filter((upgrade) => Boolean(upgrade))
  }, [data, targetUpgradeIds])

  const requirementTotals = useMemo(
    () => aggregateRequirements(targetUpgrades),
    [targetUpgrades],
  )
  const missingTotals = useMemo(
    () => computeMissing(requirementTotals, inventoryByItemId),
    [requirementTotals, inventoryByItemId],
  )

  const rows = useMemo(() => {
    if (!data) {
      return []
    }
    const foundInRaidByItemId = targetUpgrades.reduce<Record<string, boolean>>((map, upgrade) => {
      upgrade.itemRequirements.forEach((requirement) => {
        if (requirement.foundInRaidRequired) {
          map[requirement.itemId] = true
        }
      })
      return map
    }, {})

    return Object.entries(requirementTotals)
      .map(([itemId, required]) => {
        const owned = inventoryByItemId[itemId] ?? 0
        const missing = missingTotals[itemId] ?? 0
        return {
          itemId,
          name: data.itemsById[itemId]
            ? getItemName(data.itemsById[itemId], language)
            : itemId,
          iconLink: data.itemsById[itemId]?.iconLink ?? null,
          foundInRaidRequired: foundInRaidByItemId[itemId] ?? false,
          required,
          owned,
          missing,
        }
      })
      .sort((left, right) => right.missing - left.missing || left.name.localeCompare(right.name))
  }, [data, language, targetUpgrades, requirementTotals, inventoryByItemId, missingTotals])

  if (!data) {
    return <p>{t('common.loadingDashboard')}</p>
  }

  return (
    <section>
      <h2>{t('dashboard.title')}</h2>
      <p className="meta-text">{t('dashboard.desc')}</p>

      <section className="target-list-panel">
        <h3>{t('dashboard.targets', { count: targetUpgrades.length })}</h3>
        {targetUpgrades.length === 0 ? (
          <p className="meta-text">{t('dashboard.noTargets')}</p>
        ) : (
          <ul className="simple-list">
            {targetUpgrades.map((upgrade) => (
              <li key={upgrade.id}>
                <span>
                  {getUpgradeStationName(upgrade, language)} {t('common.level')}
                  {upgrade.level}
                </span>
                <button
                  className="inline-button"
                  type="button"
                  onClick={() => setTarget(upgrade.id, false)}
                >
                  {t('common.remove')}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{t('common.item')}</th>
              <th>{t('common.required')}</th>
              <th>{t('common.owned')}</th>
              <th>{t('common.missing')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.itemId}>
                <td>
                  <div className="item-cell">
                    <span className="item-thumb-wrap">
                      {row.iconLink ? (
                        <img className="item-thumb" src={row.iconLink} alt="" loading="lazy" />
                      ) : (
                        <span className="item-thumb is-empty" aria-hidden="true" />
                      )}
                      {row.foundInRaidRequired ? (
                        <span
                          className="item-thumb-badge"
                          title={t('common.foundInRaid')}
                          aria-label={t('common.foundInRaid')}
                        >
                          ✓
                        </span>
                      ) : null}
                    </span>
                    <span className="item-label">{row.name}</span>
                  </div>
                </td>
                <td>{row.required}</td>
                <td>{row.owned}</td>
                <td className={row.missing > 0 ? 'missing-cell' : 'ok-cell'}>
                  {row.missing}
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="meta-text">
                  {t('dashboard.addTargetHint')}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  )
}
