import { describe, expect, it } from 'vitest'
import {
  isMathCorrect,
  isMeaningCorrect,
  isSpellingCorrect,
  normalizeMath,
  spellingVariants,
} from './compare'

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

describe('TOEIC入力', () => {
  it('スラッシュ区切りと任意語からスペル候補を作る', () => {
    expect(spellingVariants('bookcase / bookshelf')).toEqual(['bookcase', 'bookshelf'])
    expect(spellingVariants('(light) bulb')).toEqual(['(light) bulb', 'light bulb', 'bulb'])
  })

  it('日本語訳の区切りと表記ゆれを許容する', () => {
    expect(isMeaningCorrect('最近', '最近/この頃')).toBe(true)
    expect(isMeaningCorrect('この頃', '最近/この頃')).toBe(true)
    expect(isMeaningCorrect('役員会', '役員（会）')).toBe(true)
    expect(isMeaningCorrect('向く', '〜の方を向く')).toBe(true)
    expect(isMeaningCorrect('払う', '支払う')).toBe(true)
    expect(isMeaningCorrect('フォーマルな', '正式の/フォーマルな')).toBe(true)
    expect(isMeaningCorrect('入手できる', '利用できる/空いている/入手可能な')).toBe(true)
    expect(isMeaningCorrect('利用可能', '利用できる')).toBe(true)
    expect(isMeaningCorrect('利用することができる', '利用可能な')).toBe(true)
    expect(isMeaningCorrect('提出する必要がある', '提出しなければならない')).toBe(true)
  })

  it('長い日本語訳は1文字の入力差を許容するが、別の意味は不正解にする', () => {
    expect(isMeaningCorrect('論理的な', '論理的な')).toBe(true)
    expect(isMeaningCorrect('論理てきな', '論理的な')).toBe(true)
    expect(isMeaningCorrect('非公式な', '論理的な')).toBe(false)
    expect(isMeaningCorrect('公式な', '非公式な')).toBe(false)
    expect(isMeaningCorrect('利用可能', '利用できない')).toBe(false)
    expect(isMeaningCorrect('利用不可能', '利用できる')).toBe(false)
  })

  it('意味が近くても品詞の異なる語幹だけの回答は不正解にする', () => {
    expect(isMeaningCorrect('提供する', '申し出る/提供する')).toBe(true)
    expect(isMeaningCorrect('提供', '申し出る/提供する')).toBe(false)
    expect(isMeaningCorrect('申し出', '申し出る/提供する')).toBe(false)
    expect(isMeaningCorrect('支払', '支払う')).toBe(false)
    expect(isMeaningCorrect('入手できる', '入手可能な')).toBe(true)
  })

  it('品詞が同じ頻出動詞の言い換えを正解にする', () => {
    expect(isMeaningCorrect('伝える', '知らせる')).toBe(true)
    expect(isMeaningCorrect('伝達する', '知らせる')).toBe(true)
    expect(isMeaningCorrect('伝える', '助言する/知らせる')).toBe(true)
    expect(isMeaningCorrect('手に入れる', '入手する')).toBe(true)
    expect(isMeaningCorrect('買う', '購入する')).toBe(true)
    expect(isMeaningCorrect('始める', '開始する')).toBe(true)
    expect(isMeaningCorrect('確かめる', '確認する')).toBe(true)
    expect(isMeaningCorrect('伝える', '提供する')).toBe(false)
    expect(isMeaningCorrect('通知', '知らせる')).toBe(false)
  })
})
