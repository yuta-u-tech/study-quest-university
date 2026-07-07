import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Grade = 'again' | 'hard' | 'good'

export interface ItemStat {
  correct: number
  wrong: number
  last: 'correct' | 'wrong'
  lastAt: string
}

export interface SessionRecord {
  deckId: string
  mode: string
  at: string
  total: number
  correct: number
}

interface ProgressState {
  /** deckId -> itemId -> 成績 */
  itemStats: Record<string, Record<string, ItemStat>>
  sessions: SessionRecord[]
  recordAnswer: (deckId: string, itemId: string, ok: boolean) => void
  recordSession: (record: SessionRecord) => void
  resetAll: () => void
}

export const useProgress = create<ProgressState>()(
  persist(
    (set) => ({
      itemStats: {},
      sessions: [],

      recordAnswer: (deckId, itemId, ok) =>
        set((state) => {
          const deckStats = state.itemStats[deckId] ?? {}
          const prev = deckStats[itemId]
          const next: ItemStat = {
            correct: (prev?.correct ?? 0) + (ok ? 1 : 0),
            wrong: (prev?.wrong ?? 0) + (ok ? 0 : 1),
            last: ok ? 'correct' : 'wrong',
            lastAt: new Date().toISOString(),
          }
          return {
            itemStats: {
              ...state.itemStats,
              [deckId]: { ...deckStats, [itemId]: next },
            },
          }
        }),

      recordSession: (record) =>
        set((state) => ({ sessions: [...state.sessions, record] })),

      resetAll: () => set({ itemStats: {}, sessions: [] }),
    }),
    { name: 'studyquest-progress-v1' },
  ),
)

/** デッキ内で「直近正解」になっている問題数（習得数） */
export function masteredCount(stats: Record<string, ItemStat> | undefined): number {
  if (!stats) return 0
  return Object.values(stats).filter((s) => s.last === 'correct').length
}

/** 直近が不正解の問題id一覧（弱点） */
export function weakItemIds(stats: Record<string, ItemStat> | undefined): Set<string> {
  if (!stats) return new Set()
  return new Set(
    Object.entries(stats)
      .filter(([, s]) => s.last === 'wrong')
      .map(([id]) => id),
  )
}
