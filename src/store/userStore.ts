import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserSnapshot } from '../types/domain'

interface UserState extends UserSnapshot {
  toggleCompleted: (upgradeId: string) => void
  setCompleted: (upgradeId: string, completed: boolean) => void
  toggleTarget: (upgradeId: string) => void
  setTarget: (upgradeId: string, target: boolean) => void
  ensureTargets: (upgradeIds: string[]) => void
  syncTargets: (upgradeIds: string[]) => void
  setInventory: (itemId: string, amount: number) => void
  setTraderLevel: (traderId: string, level: number) => void
  replaceFromSnapshot: (snapshot: UserSnapshot) => void
  resetUserState: () => void
}

const initialState: UserSnapshot = {
  completedUpgradeIds: [],
  targetUpgradeIds: [],
  inventoryByItemId: {},
  traderLevelsByTraderId: {},
}

function upsertString(list: string[], value: string, include: boolean): string[] {
  const existing = list.includes(value)
  if (include && !existing) {
    return [...list, value]
  }
  if (!include && existing) {
    return list.filter((entry) => entry !== value)
  }
  return list
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      ...initialState,
      toggleCompleted: (upgradeId: string) => {
        set((state) => ({
          completedUpgradeIds: upsertString(
            state.completedUpgradeIds,
            upgradeId,
            !state.completedUpgradeIds.includes(upgradeId),
          ),
        }))
      },
      setCompleted: (upgradeId: string, completed: boolean) => {
        set((state) => ({
          completedUpgradeIds: upsertString(
            state.completedUpgradeIds,
            upgradeId,
            completed,
          ),
        }))
      },
      toggleTarget: (upgradeId: string) => {
        set((state) => ({
          targetUpgradeIds: upsertString(
            state.targetUpgradeIds,
            upgradeId,
            !state.targetUpgradeIds.includes(upgradeId),
          ),
        }))
      },
      setTarget: (upgradeId: string, target: boolean) => {
        set((state) => ({
          targetUpgradeIds: upsertString(state.targetUpgradeIds, upgradeId, target),
        }))
      },
      ensureTargets: (upgradeIds: string[]) => {
        set((state) => {
          const addSet = new Set(upgradeIds)
          const next = [...state.targetUpgradeIds]
          addSet.forEach((id) => {
            if (!next.includes(id)) {
              next.push(id)
            }
          })
          return {
            targetUpgradeIds: next,
          }
        })
      },
      syncTargets: (upgradeIds: string[]) => {
        set(() => ({
          targetUpgradeIds: Array.from(new Set(upgradeIds)),
        }))
      },
      setInventory: (itemId: string, amount: number) => {
        set((state) => {
          const nextInventory = { ...state.inventoryByItemId }
          const normalized = Number.isFinite(amount) ? Math.max(Math.floor(amount), 0) : 0

          if (normalized === 0) {
            delete nextInventory[itemId]
          } else {
            nextInventory[itemId] = normalized
          }

          return {
            inventoryByItemId: nextInventory,
          }
        })
      },
      setTraderLevel: (traderId: string, level: number) => {
        set((state) => {
          const next = { ...state.traderLevelsByTraderId }
          const normalized = Number.isFinite(level) ? Math.max(Math.floor(level), 0) : 0
          if (!traderId) {
            return { traderLevelsByTraderId: next }
          }
          if (normalized <= 0) {
            delete next[traderId]
          } else {
            next[traderId] = normalized
          }
          return {
            traderLevelsByTraderId: next,
          }
        })
      },
      replaceFromSnapshot: (snapshot: UserSnapshot) => {
        set({
          completedUpgradeIds: snapshot.completedUpgradeIds,
          targetUpgradeIds: snapshot.targetUpgradeIds,
          inventoryByItemId: snapshot.inventoryByItemId,
          traderLevelsByTraderId: snapshot.traderLevelsByTraderId,
        })
      },
      resetUserState: () => set(initialState),
    }),
    {
      name: 'eft-hideout-user-v1',
      partialize: (state) => ({
        completedUpgradeIds: state.completedUpgradeIds,
        targetUpgradeIds: state.targetUpgradeIds,
        inventoryByItemId: state.inventoryByItemId,
        traderLevelsByTraderId: state.traderLevelsByTraderId,
      }),
    },
  ),
)
