import type { Language } from '../i18n/translations'
import type { ItemMeta } from '../types/domain'

function sanitizeLabel(value: string): string {
  const withoutControl = Array.from(value)
    .map((char) => {
      const code = char.charCodeAt(0)
      return code < 32 || code === 127 ? ' ' : char
    })
    .join('')

  return withoutControl.replace(/\s+/g, ' ').trim()
}

export function getItemName(item: ItemMeta, language: Language): string {
  if (language === 'ko') {
    return sanitizeLabel(item.koName ?? item.name)
  }
  return sanitizeLabel(item.name)
}

export function getItemShortName(item: ItemMeta, language: Language): string {
  if (language === 'ko') {
    return sanitizeLabel(item.koShortName ?? item.shortName)
  }
  return sanitizeLabel(item.shortName)
}

export function itemMatchesQuery(item: ItemMeta, searchNeedle: string): boolean {
  if (!searchNeedle) {
    return true
  }

  const needle = searchNeedle.toLowerCase()
  const candidates = [item.name, item.shortName, item.koName, item.koShortName]
    .filter((value): value is string => Boolean(value))
    .map((value) => sanitizeLabel(value).toLowerCase())

  return candidates.some((value) => value.includes(needle))
}
