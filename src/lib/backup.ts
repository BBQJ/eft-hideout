import type { UserSnapshot } from '../types/domain'

export const BACKUP_SCHEMA_VERSION = 1

export interface BackupPayload {
  schemaVersion: number
  exportedAt: string
  user: UserSnapshot
}

export function createBackupPayload(user: UserSnapshot): BackupPayload {
  return {
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    user,
  }
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string')
}

function sanitizeInventory(raw: unknown): Record<string, number> {
  if (!raw || typeof raw !== 'object') {
    return {}
  }

  return Object.entries(raw).reduce<Record<string, number>>(
    (inventory, [itemId, quantity]) => {
      if (!itemId) {
        return inventory
      }

      const normalized =
        typeof quantity === 'number' && Number.isFinite(quantity) && quantity > 0
          ? Math.floor(quantity)
          : 0
      if (normalized > 0) {
        inventory[itemId] = normalized
      }
      return inventory
    },
    {},
  )
}

function sanitizeTraderLevels(raw: unknown): Record<string, number> {
  if (!raw || typeof raw !== 'object') {
    return {}
  }

  return Object.entries(raw).reduce<Record<string, number>>((levels, [traderId, value]) => {
    if (!traderId) {
      return levels
    }

    const normalized =
      typeof value === 'number' && Number.isFinite(value) && value > 0
        ? Math.floor(value)
        : 0
    if (normalized > 0) {
      levels[traderId] = normalized
    }
    return levels
  }, {})
}

export function parseBackupPayload(rawText: string): BackupPayload {
  const parsed = JSON.parse(rawText) as Partial<BackupPayload>
  if (parsed.schemaVersion !== BACKUP_SCHEMA_VERSION) {
    throw new Error(`Unsupported backup schema version: ${parsed.schemaVersion}`)
  }

  if (!parsed.user || typeof parsed.user !== 'object') {
    throw new Error('Backup is missing user payload')
  }

  const completed = isStringArray(parsed.user.completedUpgradeIds)
    ? parsed.user.completedUpgradeIds
    : []
  const targets = isStringArray(parsed.user.targetUpgradeIds)
    ? parsed.user.targetUpgradeIds
    : []

  return {
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt:
      typeof parsed.exportedAt === 'string'
        ? parsed.exportedAt
        : new Date().toISOString(),
    user: {
      completedUpgradeIds: completed,
      targetUpgradeIds: targets,
      inventoryByItemId: sanitizeInventory(parsed.user.inventoryByItemId),
      traderLevelsByTraderId: sanitizeTraderLevels(parsed.user.traderLevelsByTraderId),
    },
  }
}
