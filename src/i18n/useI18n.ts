import { MESSAGES, type I18nKey, type Language } from './translations'
import { useUiStore } from '../store/uiStore'

interface InterpolateParams {
  [key: string]: string | number
}

function interpolate(template: string, params?: InterpolateParams): string {
  if (!params) {
    return template
  }
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const value = params[key]
    return value === undefined ? `{${key}}` : String(value)
  })
}

export function useI18n() {
  const language = useUiStore((state) => state.language)
  const setLanguage = useUiStore((state) => state.setLanguage)

  const t = (key: I18nKey, params?: InterpolateParams): string =>
    interpolate(MESSAGES[language][key], params)

  const locale = language === 'ko' ? 'ko-KR' : 'en-US'

  return {
    language,
    setLanguage: (next: Language) => setLanguage(next),
    t,
    locale,
  }
}
