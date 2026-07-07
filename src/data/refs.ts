import type { Deck, DeckItem } from './schema'

/**
 * 「(6)の都は…」のようなセクション内参照を含む問題文を表示用に整形する。
 * 出題順がシャッフルされる文脈では参照先の答えをインライン展開し、
 * 順番どおりの出題ではそのまま返す。
 */
export function displayQuestion(item: DeckItem, deck: Deck, expandRefs: boolean): string {
  if (!expandRefs || !item.refs || item.refs.length === 0) return item.question

  return item.question.replace(/[(（](\d+)[)）]/g, (original, num: string) => {
    const target = deck.items.find(
      (i) => i.section === item.section && i.number === Number(num),
    )
    return target ? `「${target.answer}」` : original
  })
}
