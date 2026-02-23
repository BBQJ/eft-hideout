import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Language } from '../i18n/translations'

interface UiState {
  language: Language
  setLanguage: (language: Language) => void
}

function detectInitialLanguage(): Language {
  if (typeof navigator !== 'undefined' && navigator.language.toLowerCase().startsWith('ko')) {
    return 'ko'
  }
  return 'en'
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      language: detectInitialLanguage(),
      setLanguage: (language) => set({ language }),
    }),
    {
      name: 'eft-hideout-ui-v1',
      partialize: (state) => ({
        language: state.language,
      }),
    },
  ),
)
