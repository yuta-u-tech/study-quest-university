/** Fisher–Yates シャッフル（元配列は変更しない） */
export function shuffled<T>(source: readonly T[]): T[] {
  const result = [...source]
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

/** 配列から重複を除いて最大 count 件を無作為に選ぶ */
export function sampled<T>(source: readonly T[], count: number): T[] {
  return shuffled(source).slice(0, count)
}
