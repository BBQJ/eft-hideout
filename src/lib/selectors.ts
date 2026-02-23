import type { HideoutData, HideoutUpgrade } from '../types/domain'

export function listAllUpgrades(data: HideoutData | null): HideoutUpgrade[] {
  if (!data) {
    return []
  }
  return data.stations.flatMap((station) => station.upgrades)
}
