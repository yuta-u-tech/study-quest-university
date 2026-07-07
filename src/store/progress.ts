import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { review } from '../srs/sm2'
import type { SrsState } from '../srs/sm2'

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

export interface ProgressData {
  itemStats: Record<string, Record<string, ItemStat>>
  srs: Record<string, Record<string, SrsState>>
  sessions: SessionRecord[]
}

interface ProgressState extends ProgressData {
  recordAnswer: (deckId: string, itemId: string, grade: Grade) => void
  recordSession: (record: SessionRecord) => void
  importData: (data: ProgressData) => void
  resetAll: () => void
}

const EMPTY: ProgressData = { itemStats: {}, srs: {}, sessions: [] }

export const useProgress = create<ProgressState>()(
  persist(
    (set) => ({
      ...EMPTY,

      recordAnswer: (deckId, itemId, grade) =>
        set((state) => {
          const ok = grade === 'good'
          const deckStats = state.itemStats[deckId] ?? {}
          const prev = deckStats[itemId]
          const nextStat: ItemStat = {
            correct: (prev?.correct ?? 0) + (ok ? 1 : 0),
            wrong: (prev?.wrong ?? 0) + (ok ? 0 : 1),
            last: ok ? 'correct' : 'wrong',
            lastAt: new Date().toISOString(),
          }
          const deckSrs = state.srs[deckId] ?? {}
          return {
            itemStats: {
              ...state.itemStats,
              [deckId]: { ...deckStats, [itemId]: nextStat },
            },
            srs: {
              ...state.srs,
              [deckId]: { ...deckSrs, [itemId]: review(deckSrs[itemId], grade) },
            },
          }
        }),

      recordSession: (record) =>
        set((state) => ({ sessions: [...state.sessions, record] })),

      importData: (data) =>
        set({ itemStats: data.itemStats, srs: data.srs, sessions: data.sessions }),

      resetAll: () => set({ ...EMPTY }),
    }),
    { name: 'studyquest-progress-v1', version: 2 },
  ),
)

/** デッキ内で「直近正解」になっている問題数（習得数） */
export function masteredCount(stats: Record<string, ItemStat> | undefined): number {
  if (!stats) return 0
  return Object.values(stats).filter((s) => s.last === 'correct').length
}

/** 直近が不正解の問題id一覧（にがて） */
export function weakItemIds(stats: Record<string, ItemStat> | undefined): Set<string> {
  if (!stats) return new Set()
  return new Set(
    Object.entries(stats)
      .filter(([, s]) => s.last === 'wrong')
      .map(([id]) => id),
  )
}

/** 学習した日（YYYY-MM-DD, ローカル）の集合 */
export function studyDays(sessions: SessionRecord[]): Set<string> {
  return new Set(sessions.map((s) => toDayKey(new Date(s.at))))
}

export function toDayKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** 今日から連続何日学習しているか */
export function streakDays(sessions: SessionRecord[], now = new Date()): number {
  const days = studyDays(sessions)
  let streak = 0
  const cursor = new Date(now)
  while (days.has(toDayKey(cursor))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}
