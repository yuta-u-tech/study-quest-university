import { describe, expect, it } from 'vitest'
import { createChallenge } from './romaji'

function typeAll(reading: string, input: string): { misses: number; done: boolean } {
  const challenge = createChallenge(reading)
  let misses = 0
  for (const char of input) {
    if (challenge.type(char) === 'miss') misses += 1
  }
  return { misses, done: challenge.isDone() }
}

describe('createChallenge', () => {
  it('ヘボン式で完走できる', () => {
    expect(typeAll('たいほうりつりょう', 'taihouritsuryou')).toEqual({ misses: 0, done: true })
  })

  it('訓令式ゆれも受け付ける', () => {
    expect(typeAll('たいほうりつりょう', 'taihourituryou')).toEqual({ misses: 0, done: true })
    expect(typeAll('しょうえん', 'syouenn')).toEqual({ misses: 0, done: true })
  })

  it('しょ=sho/syo 両対応', () => {
    expect(typeAll('しょうえん', 'shouenn')).toEqual({ misses: 0, done: true })
  })

  it('促音は子音重ねで打てる', () => {
    expect(typeAll('もっかん', 'mokkann')).toEqual({ misses: 0, done: true })
    expect(typeAll('ぶしだん', 'bushidann')).toEqual({ misses: 0, done: true })
  })

  it('ん は子音の前なら n 1つで確定できる', () => {
    expect(typeAll('はんでん', 'handenn')).toEqual({ misses: 0, done: true })
    expect(typeAll('げんじものがたり', 'genjimonogatari')).toEqual({ misses: 0, done: true })
  })

  it('語末の ん は n 1つでは確定しない', () => {
    const result = typeAll('しょうえん', 'shouen')
    expect(result.misses).toBe(0)
    expect(result.done).toBe(false)
  })

  it('母音の前の ん は nn が必要', () => {
    expect(typeAll('しんあん', 'shinnann')).toEqual({ misses: 0, done: true })
    // "shinan" と打つと「しなん」になるので ん では受け付けない
    const result = typeAll('しんあん', 'shina')
    expect(result.misses).toBeGreaterThan(0)
  })

  it('ミスタイプは進行せず miss を返す', () => {
    const challenge = createChallenge('こくし')
    expect(challenge.type('k')).toBe('ok')
    expect(challenge.type('x')).toBe('miss')
    expect(challenge.type('o')).toBe('ok')
    expect(challenge.typed()).toBe('ko')
  })

  it('remaining が入力見本を返す', () => {
    const challenge = createChallenge('こくし')
    expect(challenge.remaining()).toBe('kokushi')
    challenge.type('k')
    challenge.type('o')
    expect(challenge.remaining()).toBe('kushi')
  })
})
