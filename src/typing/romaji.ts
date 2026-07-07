/**
 * ひらがなの読みをローマ字入力で判定するエンジン。
 * 「し=shi/si」「ちょ=cho/tyo/cyo」「っ=子音重ね/xtu」「ん=nn/n/xn」等の
 * 一般的な入力ゆれを受け付ける。
 */

const KANA_OPTIONS: Record<string, string[]> = {
  あ: ['a'], い: ['i', 'yi'], う: ['u', 'wu'], え: ['e'], お: ['o'],
  か: ['ka', 'ca'], き: ['ki'], く: ['ku', 'cu', 'qu'], け: ['ke'], こ: ['ko', 'co'],
  さ: ['sa'], し: ['shi', 'si', 'ci'], す: ['su'], せ: ['se', 'ce'], そ: ['so'],
  た: ['ta'], ち: ['chi', 'ti'], つ: ['tsu', 'tu'], て: ['te'], と: ['to'],
  な: ['na'], に: ['ni'], ぬ: ['nu'], ね: ['ne'], の: ['no'],
  は: ['ha'], ひ: ['hi'], ふ: ['fu', 'hu'], へ: ['he'], ほ: ['ho'],
  ま: ['ma'], み: ['mi'], む: ['mu'], め: ['me'], も: ['mo'],
  や: ['ya'], ゆ: ['yu'], よ: ['yo'],
  ら: ['ra'], り: ['ri'], る: ['ru'], れ: ['re'], ろ: ['ro'],
  わ: ['wa'], ゐ: ['wi'], ゑ: ['we'], を: ['wo'],
  が: ['ga'], ぎ: ['gi'], ぐ: ['gu'], げ: ['ge'], ご: ['go'],
  ざ: ['za'], じ: ['ji', 'zi'], ず: ['zu'], ぜ: ['ze'], ぞ: ['zo'],
  だ: ['da'], ぢ: ['di'], づ: ['du'], で: ['de'], ど: ['do'],
  ば: ['ba'], び: ['bi'], ぶ: ['bu'], べ: ['be'], ぼ: ['bo'],
  ぱ: ['pa'], ぴ: ['pi'], ぷ: ['pu'], ぺ: ['pe'], ぽ: ['po'],
  ぁ: ['xa', 'la'], ぃ: ['xi', 'li'], ぅ: ['xu', 'lu'], ぇ: ['xe', 'le'], ぉ: ['xo', 'lo'],
  ゃ: ['xya', 'lya'], ゅ: ['xyu', 'lyu'], ょ: ['xyo', 'lyo'],
  ー: ['-'],
}

const YOUON_OPTIONS: Record<string, Record<string, string[]>> = {
  き: { ゃ: ['kya'], ゅ: ['kyu'], ょ: ['kyo'] },
  し: { ゃ: ['sha', 'sya'], ゅ: ['shu', 'syu'], ょ: ['sho', 'syo'] },
  ち: { ゃ: ['cha', 'tya', 'cya'], ゅ: ['chu', 'tyu', 'cyu'], ょ: ['cho', 'tyo', 'cyo'] },
  に: { ゃ: ['nya'], ゅ: ['nyu'], ょ: ['nyo'] },
  ひ: { ゃ: ['hya'], ゅ: ['hyu'], ょ: ['hyo'] },
  み: { ゃ: ['mya'], ゅ: ['myu'], ょ: ['myo'] },
  り: { ゃ: ['rya'], ゅ: ['ryu'], ょ: ['ryo'] },
  ぎ: { ゃ: ['gya'], ゅ: ['gyu'], ょ: ['gyo'] },
  じ: { ゃ: ['ja', 'zya', 'jya'], ゅ: ['ju', 'zyu', 'jyu'], ょ: ['jo', 'zyo', 'jyo'] },
  ぢ: { ゃ: ['dya'], ゅ: ['dyu'], ょ: ['dyo'] },
  び: { ゃ: ['bya'], ゅ: ['byu'], ょ: ['byo'] },
  ぴ: { ゃ: ['pya'], ゅ: ['pyu'], ょ: ['pyo'] },
  ふ: { ゃ: ['fya'], ゅ: ['fyu'], ょ: ['fyo'] },
}

const SMALL_Y = new Set(['ゃ', 'ゅ', 'ょ'])
const VOWELS = new Set(['a', 'i', 'u', 'e', 'o'])

interface Unit {
  kana: string
  options: string[]
}

/** 読みを入力単位（拗音は1単位）に分割し、っ/ん の入力ゆれを展開する */
export function buildUnits(reading: string): Unit[] {
  const rawUnits: Unit[] = []
  for (let i = 0; i < reading.length; i += 1) {
    const char = reading[i]
    const next = reading[i + 1]
    if (next && SMALL_Y.has(next) && YOUON_OPTIONS[char]?.[next]) {
      rawUnits.push({ kana: char + next, options: [...YOUON_OPTIONS[char][next]] })
      i += 1
      continue
    }
    if (char === 'っ' || char === 'ん') {
      rawUnits.push({ kana: char, options: [] })
      continue
    }
    const options = KANA_OPTIONS[char]
    if (!options) throw new Error(`ローマ字化できない文字: ${char}`)
    rawUnits.push({ kana: char, options: [...options] })
  }

  return rawUnits.map((unit, i) => {
    const nextOptions = rawUnits[i + 1]?.options ?? []
    if (unit.kana === 'っ') {
      const doubled = [
        ...new Set(nextOptions.map((o) => o[0]).filter((c) => c && !VOWELS.has(c) && c !== 'n')),
      ]
      return { ...unit, options: [...doubled, 'xtu', 'ltu', 'ltsu'] }
    }
    if (unit.kana === 'ん') {
      const canSingleN =
        nextOptions.length > 0 &&
        nextOptions.every((o) => !VOWELS.has(o[0]) && o[0] !== 'n' && o[0] !== 'y')
      return { ...unit, options: [...(canSingleN ? ['n'] : []), 'nn', 'xn'] }
    }
    return unit
  })
}

export type TypeResult = 'ok' | 'miss' | 'done'

export interface TypingChallenge {
  reading: string
  type: (char: string) => TypeResult
  /** 確定済みのローマ字（表示用） */
  typed: () => string
  /** 残りのローマ字の見本（表示用） */
  remaining: () => string
  isDone: () => boolean
}

export function createChallenge(reading: string): TypingChallenge {
  const units = buildUnits(reading)
  let unitIndex = 0
  let buffer = ''
  let confirmed = ''

  const advance = (used: string) => {
    confirmed += used
    unitIndex += 1
    buffer = ''
  }

  const typeChar = (char: string): TypeResult => {
    if (unitIndex >= units.length) return 'done'
    const options = units[unitIndex].options
    const attempt = buffer + char

    if (options.some((o) => o.startsWith(attempt))) {
      const exact = options.includes(attempt)
      const extendable = options.some((o) => o.length > attempt.length && o.startsWith(attempt))
      if (exact && !extendable) {
        advance(attempt)
      } else {
        buffer = attempt
      }
      return unitIndex >= units.length ? 'done' : 'ok'
    }

    // 「n」で確定できる状態から次の文字が来たケース（ん→次の子音）
    if (options.includes(buffer)) {
      advance(buffer)
      return typeChar(char)
    }
    return 'miss'
  }

  const currentSample = (): string => {
    if (unitIndex >= units.length) return ''
    const options = units[unitIndex].options
    const candidates = options.filter((o) => o.startsWith(buffer))
    const best = [...candidates].sort((a, b) => a.length - b.length)[0] ?? options[0]
    return best.slice(buffer.length)
  }

  return {
    reading,
    type: typeChar,
    typed: () => confirmed + buffer,
    remaining: () =>
      currentSample() + units.slice(unitIndex + 1).map((u) => u.options[0]).join(''),
    isDone: () => unitIndex >= units.length,
  }
}
