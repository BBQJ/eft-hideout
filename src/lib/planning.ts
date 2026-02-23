export interface RequirementEntry {
  itemId: string
  count: number
}

export interface TargetUpgrade {
  id: string
  itemRequirements: RequirementEntry[]
}

export type RequirementTotals = Record<string, number>

export function aggregateRequirements(targets: TargetUpgrade[]): RequirementTotals {
  return targets.reduce<RequirementTotals>((totals, target) => {
    target.itemRequirements.forEach((entry) => {
      if (!entry.itemId || !Number.isFinite(entry.count) || entry.count <= 0) {
        return
      }
      totals[entry.itemId] = (totals[entry.itemId] ?? 0) + entry.count
    })
    return totals
  }, {})
}

export function computeMissing(
  requirements: RequirementTotals,
  inventory: Record<string, number>,
): RequirementTotals {
  const missing: RequirementTotals = {}

  Object.entries(requirements).forEach(([itemId, requiredAmount]) => {
    const ownedAmount = inventory[itemId] ?? 0
    const unresolvedAmount = Math.max(requiredAmount - ownedAmount, 0)
    if (unresolvedAmount > 0) {
      missing[itemId] = unresolvedAmount
    }
  })

  return missing
}

export function unlockableUpgrades(
  completed: ReadonlySet<string> | string[],
  prereqs: Record<string, string[]>,
): string[] {
  const completedSet = completed instanceof Set ? completed : new Set(completed)

  return Object.entries(prereqs)
    .filter(([upgradeId, dependencies]) => {
      if (completedSet.has(upgradeId)) {
        return false
      }
      return dependencies.every((dependencyId) => completedSet.has(dependencyId))
    })
    .map(([upgradeId]) => upgradeId)
    .sort((left, right) => left.localeCompare(right))
}
