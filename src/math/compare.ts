/**
 * 数式・スペル解答の正誤判定。
 * MathLive の LaTeX 出力と、データ側の answer / acceptedAnswers を
 * 同じ正規形に落として比較する。数学的同値判定はしない
 * （表記ゆれは acceptedAnswers で列挙する方針）。
 */

// LaTeX の引数は {…} と 1文字省略形の両方がある（MathLive は \frac56 のような省略形を出力する）
const ARG = String.raw`(\{[^{}]*\}|[0-9a-zA-Z])`
const FRAC_PATTERN = new RegExp(String.raw`\\[dt]?frac\s*${ARG}\s*${ARG}`)
const SQRT_PATTERN = new RegExp(String.raw`\\sqrt\s*${ARG}`)

function stripBraces(arg: string): string {
  return arg.startsWith('{') ? arg.slice(1, -1) : arg
}

function normalizeFractions(input: string): string {
  let current = input
  for (let guard = 0; guard < 20; guard += 1) {
    const fraction = current.match(FRAC_PATTERN)
    if (fraction) {
      current = current.replace(
        FRAC_PATTERN,
        `(${stripBraces(fraction[1])})/(${stripBraces(fraction[2])})`,
      )
      continue
    }
    const root = current.match(SQRT_PATTERN)
    if (root) {
      current = current.replace(SQRT_PATTERN, `sqrt(${stripBraces(root[1])})`)
      continue
    }
    break
  }
  return current
}

export function normalizeMath(raw: string): string {
  const fractions = normalizeFractions(raw)
  return fractions
    .replace(/\\left|\\right/g, '')
    .replace(/\\cdot|\\times|×/g, '*')
    .replace(/\\div|÷/g, '/')
    .replace(/\\pi/g, 'π')
    .replace(/\\pm|±/g, '±')
    .replace(/[{}\s$]/g, '')
    .replace(/，|、/g, ',')
    .replace(/−/g, '-')
    .replace(/\(([a-z0-9.]+)\)/gi, '$1')
    .toLowerCase()
}

/** "3", "-1.5", "5/6" を数値化（それ以外は null） */
function numericValue(normalized: string): number | null {
  if (/^-?\d+(\.\d+)?$/.test(normalized)) return Number(normalized)
  const fraction = normalized.match(/^(-?\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)$/)
  if (fraction) {
    const denominator = Number(fraction[2])
    if (denominator !== 0) return Number(fraction[1]) / denominator
  }
  return null
}

export function isMathCorrect(
  input: string,
  answer: string,
  acceptedAnswers: string[] = [],
): boolean {
  const normalized = normalizeMath(input)
  if (normalized === '') return false

  const candidates = [answer, ...acceptedAnswers].map(normalizeMath)
  if (candidates.includes(normalized)) return true

  const inputValue = numericValue(normalized)
  if (inputValue === null) return false
  return candidates.some((c) => {
    const value = numericValue(c)
    return value !== null && Math.abs(value - inputValue) < 1e-9
  })
}

/** 英字入力（スペル等）の判定: 大文字小文字・前後空白を無視 */
export function isSpellingCorrect(
  input: string,
  answer: string,
  acceptedAnswers: string[] = [],
): boolean {
  const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ')
  const normalized = normalize(input)
  if (normalized === '') return false
  return [answer, ...acceptedAnswers].map(normalize).includes(normalized)
}

function optionalParentheticalVariants(raw: string): string[] {
  const match = raw.match(/^(.*?)[(（]([^)）]+)[)）](.*)$/)
  if (!match) return [raw]
  return [raw, `${match[1]}${match[2]}${match[3]}`, `${match[1]}${match[3]}`]
}

/** スラッシュ区切りや (light) bulb のような任意語を個別のスペル解として扱う。 */
export function spellingVariants(raw: string): string[] {
  const variants = raw.split(/\s*[/／]\s*/).flatMap(optionalParentheticalVariants)
  return [...new Set(variants.map((value) => value.trim()).filter(Boolean))]
}

function toHiragana(raw: string): string {
  return raw.replace(/[ァ-ヶ]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0x60))
}

/** 品詞を保ったまま、TOEIC語彙で頻出する日本語の動詞言い換えを共通形へ寄せる。 */
const SEMANTIC_VERB_GROUPS: Array<[string, string[]]> = [
  ['通知する', ['知らせる', '伝える', '通知する', '伝達する']],
  ['入手する', ['入手する', '手に入れる', '獲得する']],
  ['購入する', ['購入する', '買う']],
  ['開始する', ['開始する', '始める']],
  ['終了する', ['終了する', '終える']],
  ['選択する', ['選択する', '選ぶ']],
  ['確認する', ['確認する', '確かめる']],
  ['支援する', ['支援する', '援助する', '助ける']],
  ['修理する', ['修理する', '直す']],
  ['必要とする', ['必要とする', '要する']],
  ['許可する', ['許可する', '許す']],
  ['延期する', ['延期する', '先延ばしにする']],
  ['中止する', ['中止する', '取り消す']],
  ['参加する', ['参加する', '加わる']],
  ['改善する', ['改善する', '良くする']],
]

function normalizeSemanticVerbs(raw: string): string {
  let normalized = raw
  for (const [canonical, variants] of SEMANTIC_VERB_GROUPS) {
    for (const variant of variants) normalized = normalized.replaceAll(variant, canonical)
  }
  return normalized
}

function normalizeMeaning(raw: string): string {
  const normalized = toHiragana(raw.normalize('NFKC').toLowerCase())
    .replace(/[\s〜~・,，、。.!！?？「」『』【】［］()（）]/g, '')
    .replaceAll('[', '')
    .replaceAll(']', '')
  const grammatical = normalized
    .replace(/することが(?:できない|不可能(?:である|な)?)/g, '不可能')
    .replace(/ことが(?:できない|不可能(?:である|な)?)/g, '不可能')
    .replace(/できない|不可能(?:である|な)/g, '不可能')
    .replace(/することが(?:できる|可能(?:である|な)?)/g, '可能')
    .replace(/ことが(?:できる|可能(?:である|な)?)/g, '可能')
    .replace(/できる|可能(?:である|な)/g, '可能')
    .replace(/しなければならない|する必要がある/g, '必要')
    .replace(/が必要(?:である|な)?/g, '必要')
    .replace(/必要(?:である|な)/g, '必要')
  return normalizeSemanticVerbs(grammatical)
}

function meaningVariants(raw: string): string[] {
  const split = raw.split(/[/／,，、;]/)
  const optional = [raw, ...split].flatMap(optionalParentheticalVariants)
  const shortened = optional.flatMap((value) => {
    const withoutDirection = value.replace(/^\s*[〜~]?の?方を/, '')
    return withoutDirection === value ? [value] : [value, withoutDirection]
  })
  const kanaVariants = shortened.flatMap((value) => [
    value,
    value.replaceAll('的', 'てき').replaceAll('頃', 'ころ').replaceAll('方', 'ほう'),
  ])
  return [...new Set(kanaVariants.map(normalizeMeaning).filter(Boolean))]
}

function editDistance(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, index) => index)
  for (let i = 1; i <= a.length; i += 1) {
    let previous = row[0]
    row[0] = i
    for (let j = 1; j <= b.length; j += 1) {
      const current = row[j]
      row[j] = Math.min(
        row[j] + 1,
        row[j - 1] + 1,
        previous + (a[i - 1] === b[j - 1] ? 0 : 1),
      )
      previous = current
    }
  }
  return row[b.length]
}

function isContainedMeaningVariant(candidate: string, input: string): boolean {
  const generic = new Set(['する', 'ある', 'いる', 'なる', 'もの', 'こと'])
  if (candidate.length < 2 || input.length < 2 || generic.has(candidate) || generic.has(input)) return false
  if (Math.abs(candidate.length - input.length) > 2) return false
  if (!hasSameNegation(candidate, input)) return false
  if (isBareGrammaticalStem(candidate, input) || isBareGrammaticalStem(input, candidate)) return false
  return candidate.includes(input) || input.includes(candidate)
}

/** 「提供」を「提供する」のような別品詞の省略形として正解にしない。 */
function isBareGrammaticalStem(word: string, possibleStem: string): boolean {
  const endings = ['する', 'る', 'う', 'く', 'ぐ', 'す', 'つ', 'ぬ', 'ぶ', 'む', 'な', 'に', 'の']
  return endings.some((ending) => word.endsWith(ending) && word.slice(0, -ending.length) === possibleStem)
}

function hasSameNegation(a: string, b: string): boolean {
  const hasNegation = (value: string) => /[非不無未]|ない|ません/.test(value)
  return hasNegation(a) === hasNegation(b)
}

/** 日本語訳の区切り・全半角・カナ表記・長めの語の1文字差を許容する。 */
export function isMeaningCorrect(input: string, answer: string): boolean {
  const normalized = normalizeMeaning(input)
  if (normalized === '') return false
  return meaningVariants(answer).some((candidate) =>
    candidate === normalized ||
    isContainedMeaningVariant(candidate, normalized) ||
    (hasSameNegation(candidate, normalized) &&
      candidate.length >= 4 &&
      normalized.length >= 4 &&
      editDistance(candidate, normalized) <= 1),
  )
}
