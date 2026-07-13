import { describe, expect, it } from 'vitest'
import type { DeckItem } from './schema'
import {
  itemSupportsMode,
  modesForSubject,
  problemKindForItem,
  subjectUsesProblemKindTabs,
} from './learningModes'

const item = (type: DeckItem['type'], reading?: string): DeckItem => ({
  id: `${type}-item`,
  type,
  section: 'section',
  number: 1,
  question: 'question',
  answer: 'answer',
  reading,
})

describe('科目別モード', () => {
  it('数学はフラッシュカードと入力だけにする', () => {
    expect(modesForSubject('math')).toEqual(['flashcard', 'input'])
  })

  it('理科は数式入力を利用でき、タイピング道場は出さない', () => {
    expect(modesForSubject('science')).toEqual(['flashcard', 'choice', 'test', 'input'])
  })

  it('英語はスペル入力、国語は読みのタイピングに対応する', () => {
    expect(modesForSubject('english')).toContain('input')
    expect(modesForSubject('japanese')).toContain('typing')
  })

  it('現代天文学は用語の読みをタイピングで復習できる', () => {
    expect(modesForSubject('astronomy')).toContain('typing')
    expect(modesForSubject('astronomy')).toContain('typing-recall')
  })

  it('数学と理科だけ暗記・計算タブを使う', () => {
    expect(subjectUsesProblemKindTabs('math')).toBe(true)
    expect(subjectUsesProblemKindTabs('science')).toBe(true)
    expect(subjectUsesProblemKindTabs('english')).toBe(false)
  })
})

describe('問題タブ', () => {
  it('数式問題を計算、それ以外を暗記に分類する', () => {
    expect(problemKindForItem(item('math'))).toBe('calculation')
    expect(problemKindForItem(item('term'))).toBe('knowledge')
    expect(problemKindForItem(item('choice'))).toBe('knowledge')
  })
})

describe('問題形式別モード', () => {
  it('数式問題は入力だけに出題する', () => {
    const math = item('math')
    expect(itemSupportsMode(math, 'input')).toBe(true)
    expect(itemSupportsMode(math, 'flashcard')).toBe(false)
    expect(itemSupportsMode(math, 'choice')).toBe(false)
  })

  it('スペル問題は入力だけに出題する', () => {
    const spelling = item('spelling')
    expect(itemSupportsMode(spelling, 'input')).toBe(true)
    expect(itemSupportsMode(spelling, 'test')).toBe(false)
  })

  it('通常問題はカード・4択・テストに出題する', () => {
    const term = item('term')
    expect(itemSupportsMode(term, 'flashcard')).toBe(true)
    expect(itemSupportsMode(term, 'choice')).toBe(true)
    expect(itemSupportsMode(term, 'test')).toBe(true)
  })

  it('読みがある問題だけタイピングに出題する', () => {
    expect(itemSupportsMode(item('term', 'こたえ'), 'typing')).toBe(true)
    expect(itemSupportsMode(item('term'), 'typing')).toBe(false)
  })
})
