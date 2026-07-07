import { describe, expect, it } from 'vitest'
import { dueItemIds, isDue, review } from './sm2'

const NOW = new Date('2026-07-07T09:00:00Z')
const DAY_MS = 24 * 60 * 60 * 1000

describe('review', () => {
  it('初回 good は翌日、2回目は3日後', () => {
    const first = review(undefined, 'good', NOW)
    expect(first.interval).toBe(1)
    expect(new Date(first.due).getTime()).toBe(NOW.getTime() + DAY_MS)

    const second = review(first, 'good', NOW)
    expect(second.interval).toBe(3)
  })

  it('3回目以降は ease 倍で伸びる', () => {
    let state = review(undefined, 'good', NOW)
    state = review(state, 'good', NOW)
    const third = review(state, 'good', NOW)
    expect(third.interval).toBeGreaterThanOrEqual(6)
  })

  it('again で即時復習に戻り ease が下がる', () => {
    let state = review(undefined, 'good', NOW)
    state = review(state, 'good', NOW)
    const failed = review(state, 'again', NOW)
    expect(failed.interval).toBe(0)
    expect(failed.reps).toBe(0)
    expect(failed.ease).toBeLessThan(state.ease)
    expect(isDue(failed, NOW)).toBe(true)
  })

  it('ease は下限 1.3 を割らない', () => {
    let state = review(undefined, 'again', NOW)
    for (let i = 0; i < 20; i += 1) state = review(state, 'again', NOW)
    expect(state.ease).toBeGreaterThanOrEqual(1.3)
  })
})

describe('dueItemIds', () => {
  it('期限が来た問題だけを返す', () => {
    const due = review(undefined, 'again', NOW)
    const future = review(undefined, 'good', NOW)
    const ids = dueItemIds({ a: due, b: future }, NOW)
    expect(ids.has('a')).toBe(true)
    expect(ids.has('b')).toBe(false)
  })

  it('未学習は対象外', () => {
    expect(dueItemIds(undefined, NOW).size).toBe(0)
  })
})
