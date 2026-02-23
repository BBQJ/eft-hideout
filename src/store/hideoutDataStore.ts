import { create } from 'zustand'
import { fetchHideoutData } from '../data/tarkovApi'
import type { HideoutData } from '../types/domain'

interface HideoutDataState {
  data: HideoutData | null
  isLoading: boolean
  error: string | null
  loadData: (forceRefresh: boolean) => Promise<void>
}

export const useHideoutDataStore = create<HideoutDataState>((set) => ({
  data: null,
  isLoading: false,
  error: null,
  loadData: async (forceRefresh: boolean) => {
    set({ isLoading: true, error: null })
    try {
      const data = await fetchHideoutData(forceRefresh)
      set({ data, isLoading: false })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load data'
      set({ error: message, isLoading: false })
    }
  },
}))
