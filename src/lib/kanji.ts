const DIGITS = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九']

/** 1〜99 を漢数字にする（セクション札「其の一」用） */
export function kanjiNumber(n: number): string {
  if (n <= 0 || n >= 100) return String(n)
  const tens = Math.floor(n / 10)
  const ones = n % 10
  const tensPart = tens === 0 ? '' : tens === 1 ? '十' : `${DIGITS[tens]}十`
  return `${tensPart}${DIGITS[ones]}` || String(n)
}
