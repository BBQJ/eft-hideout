export interface CacheConfig {
  key: string
  schemaVersion: number
  ttlMs: number
}

interface CacheEnvelope<TValue> {
  schemaVersion: number
  cachedAt: number
  value: TValue
}

function getLocalStorage(): Storage | null {
  if (typeof window === 'undefined') {
    return null
  }
  return window.localStorage
}

export function readCache<TValue>(config: CacheConfig): TValue | null {
  const storage = getLocalStorage()
  if (!storage) {
    return null
  }

  try {
    const raw = storage.getItem(config.key)
    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw) as CacheEnvelope<TValue>
    if (parsed.schemaVersion !== config.schemaVersion) {
      return null
    }

    if (!Number.isFinite(parsed.cachedAt)) {
      return null
    }

    const ageMs = Date.now() - parsed.cachedAt
    if (ageMs > config.ttlMs) {
      return null
    }

    return parsed.value
  } catch {
    return null
  }
}

export function writeCache<TValue>(config: CacheConfig, value: TValue): void {
  const storage = getLocalStorage()
  if (!storage) {
    return
  }

  const envelope: CacheEnvelope<TValue> = {
    schemaVersion: config.schemaVersion,
    cachedAt: Date.now(),
    value,
  }
  storage.setItem(config.key, JSON.stringify(envelope))
}

export function clearCache(config: CacheConfig): void {
  const storage = getLocalStorage()
  if (!storage) {
    return
  }
  storage.removeItem(config.key)
}
