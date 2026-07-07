import { describe, expect, it } from 'vitest'
import { isMathCorrect, isSpellingCorrect, normalizeMath } from './compare'

describe('normalizeMath', () => {
  it('MathLive の frac 出力をスラッシュ形式に落とす', () => {
    expect(normalizeMath('\\frac{5}{6}')).toBe('5/6')
    expect(normalizeMath('$\\frac{5}{6}$')).toBe('5/6')
  })

  it('MathLive の省略形 \\frac56 / \\sqrt2 も受け付ける', () => {
    expect(normalizeMath('\\frac56')).toBe('5/6')
    expect(normalizeMath('\\dfrac56')).toBe('5/6')
    expect(normalizeMath('\\frac5{12}')).toBe('5/12')
    // 単純な引数の括弧は最終段で除去されるため sqrt2 が正規形
    // （入力側・正解側とも同じ正規化を通るので判定は一致する）
    expect(normalizeMath('\\sqrt2')).toBe('sqrt2')
    expect(normalizeMath('\\sqrt{2}')).toBe('sqrt2')
    expect(isMathCorrect('\\sqrt2', '$\\sqrt{2}$', [])).toBe(true)
  })

  it('省略形の分数入力が正解判定される', () => {
    expect(isMathCorrect('\\frac56', '$\\dfrac{5}{6}$', ['5/6'])).toBe(true)
  })

  it('指数の中かっこ・空白を除去する', () => {
    expect(normalizeMath('x^{2}+5x+6')).toBe('x^2+5x+6')
    expect(normalizeMath('x^2 + 5x + 6')).toBe('x^2+5x+6')
  })

  it('乗算・除算記号のゆれを吸収する', () => {
    expect(normalizeMath('2\\cdot3')).toBe('2*3')
    expect(normalizeMath('2×3')).toBe('2*3')
  })
})

describe('isMathCorrect', () => {
  const item = { answer: '$x=4$', accepted: ['x=4', '4'] }

  it('LaTeX入力と表記ゆれ一致', () => {
    expect(isMathCorrect('x=4', item.answer, item.accepted)).toBe(true)
    expect(isMathCorrect('4', item.answer, item.accepted)).toBe(true)
    expect(isMathCorrect('x=5', item.answer, item.accepted)).toBe(false)
  })

  it('分数と小数の数値同値を認める', () => {
    expect(isMathCorrect('0.5', '$\\frac{1}{2}$', ['1/2'])).toBe(true)
    expect(isMathCorrect('\\frac{1}{2}', '0.5', [])).toBe(true)
  })

  it('解の順序ゆれは acceptedAnswers で吸収する', () => {
    expect(isMathCorrect('x=3,2', '$x=2,3$', ['x=3,2', '2,3', '3,2'])).toBe(true)
  })

  it('空入力は不正解', () => {
    expect(isMathCorrect('', '$4$', [])).toBe(false)
  })
})

describe('isSpellingCorrect', () => {
  it('大文字小文字と前後空白を無視する', () => {
    expect(isSpellingCorrect(' Library ', 'library', [])).toBe(true)
    expect(isSpellingCorrect('librery', 'library', [])).toBe(false)
  })

  it('複数解を認める', () => {
    expect(isSpellingCorrect('movie', 'film', ['movie'])).toBe(true)
  })
})
