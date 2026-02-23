import type { HideoutUpgrade, ItemMeta } from '../types/domain'

interface UpgradeDetailPanelProps {
  upgrade: HideoutUpgrade | null
  itemsById: Record<string, ItemMeta>
  inventoryByItemId: Record<string, number>
  isCompleted: boolean
  isTarget: boolean
  onToggleCompleted: () => void
  onToggleTarget: () => void
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

export function UpgradeDetailPanel({
  upgrade,
  itemsById,
  inventoryByItemId,
  isCompleted,
  isTarget,
  onToggleCompleted,
  onToggleTarget,
}: UpgradeDetailPanelProps) {
  if (!upgrade) {
    return (
      <aside className="detail-panel">
        <h2>Upgrade Details</h2>
        <p>Select a station level to inspect requirements.</p>
      </aside>
    )
  }

  return (
    <aside className="detail-panel">
      <h2>
        {upgrade.stationName} L{upgrade.level}
      </h2>
      <p className="meta-text">
        Build time: {formatDuration(upgrade.constructionTimeSeconds)}
      </p>
      <p>{upgrade.description}</p>

      <div className="detail-actions">
        <button className="action-button" type="button" onClick={onToggleCompleted}>
          {isCompleted ? 'Mark Incomplete' : 'Mark Completed'}
        </button>
        <button className="action-button" type="button" onClick={onToggleTarget}>
          {isTarget ? 'Remove Target' : 'Add Target'}
        </button>
      </div>

      <section>
        <h3>Required Items</h3>
        {upgrade.itemRequirements.length === 0 ? (
          <p className="meta-text">No items needed.</p>
        ) : (
          <ul className="simple-list">
            {upgrade.itemRequirements.map((requirement) => {
              const item = itemsById[requirement.itemId]
              const owned = inventoryByItemId[requirement.itemId] ?? 0
              const missing = Math.max(requirement.count - owned, 0)

              return (
                <li key={requirement.itemId}>
                  <span>
                    {item?.name ?? requirement.itemId} x{requirement.count}
                  </span>
                  <strong>{missing > 0 ? `Missing ${missing}` : 'Ready'}</strong>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section>
        <h3>Prerequisites</h3>
        <ul className="simple-list">
          {upgrade.stationLevelRequirements.map((prerequisite) => (
            <li key={prerequisite.upgradeId}>
              <span>
                {prerequisite.stationName} L{prerequisite.level}
              </span>
            </li>
          ))}
          {upgrade.stationLevelRequirements.length === 0 ? (
            <li>
              <span>No prerequisites.</span>
            </li>
          ) : null}
        </ul>
      </section>
    </aside>
  )
}
