import type { Language } from '../i18n/translations'
import type { HideoutUpgrade, StationLevelRequirement } from '../types/domain'

export function getUpgradeStationName(
  upgrade: HideoutUpgrade,
  language: Language,
): string {
  if (language === 'ko') {
    return upgrade.koStationName ?? upgrade.stationName
  }
  return upgrade.stationName
}

export function getUpgradeDescription(
  upgrade: HideoutUpgrade,
  language: Language,
): string {
  if (language === 'ko') {
    return upgrade.koDescription ?? upgrade.description
  }
  return upgrade.description
}

export function getPrerequisiteStationName(
  requirement: StationLevelRequirement,
  language: Language,
): string {
  if (language === 'ko') {
    return requirement.koStationName ?? requirement.stationName
  }
  return requirement.stationName
}
