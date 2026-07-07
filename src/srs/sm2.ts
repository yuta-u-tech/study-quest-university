import type { Grade } from '../store/progress'

/** SM-2 を簡略化した間隔反復の状態（interval は日数） */
export interface SrsState {
  reps: number
  interval: number
  ease: number
  due: string
}

const DAY_MS = 24 * 60 * 60 * 1000
const MIN_EASE = 1.3
const MAX_EASE = 2.8
const INITIAL_EASE = 2.3

function dueAfter(days: number, now: Date): string {
  return new Date(now.getTime() + days * DAY_MS).toISOString()
}

/** 解答評価を受けて次の復習予定を計算する */
export function review(prev: SrsState | undefined, grade: Grade, now = new Date()): SrsState {
  const ease = prev?.ease ?? INITIAL_EASE
  const interval = prev?.interval ?? 0
  const reps = prev?.reps ?? 0

  if (grade === 'again') {
    return {
      reps: 0,
      interval: 0,
      ease: Math.max(MIN_EASE, ease - 0.2),
      due: now.toISOString(),
    }
  }

  if (grade === 'hard') {
    const nextInterval = Math.max(1, Math.round(interval * 1.2)) || 1
    return {
      reps: reps + 1,
      interval: nextInterval,
      ease: Math.max(MIN_EASE, ease - 0.05),
      due: dueAfter(nextInterval, now),
    }
  }

  const nextInterval = reps === 0 ? 1 : reps === 1 ? 3 : Math.round(interval * ease)
  return {
    reps: reps + 1,
    interval: nextInterval,
    ease: Math.min(MAX_EASE, ease + 0.03),
    due: dueAfter(nextInterval, now),
  }
}

/** 復習期限が来ているか（未学習 undefined は対象外） */
export function isDue(state: SrsState | undefined, now = new Date()): boolean {
  if (!state) return false
  return new Date(state.due).getTime() <= now.getTime()
}

/** デッキ内の要復習問題id一覧 */
export function dueItemIds(
  deckSrs: Record<string, SrsState> | undefined,
  now = new Date(),
): Set<string> {
  if (!deckSrs) return new Set()
  return new Set(
    Object.entries(deckSrs)
      .filter(([, state]) => isDue(state, now))
      .map(([id]) => id),
  )
}
