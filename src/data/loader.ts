import { deckSchema, manifestSchema } from './schema'
import type { Deck, Manifest } from './schema'

const dataUrl = (file: string) => `${import.meta.env.BASE_URL}data/${file}`

let manifestPromise: Promise<Manifest> | null = null
const deckCache = new Map<string, Promise<Deck>>()

async function fetchJson(file: string): Promise<unknown> {
  const res = await fetch(dataUrl(file))
  if (!res.ok) {
    throw new Error(`${file} の取得に失敗しました (HTTP ${res.status})`)
  }
  return res.json()
}

export function loadManifest(): Promise<Manifest> {
  if (!manifestPromise) {
    manifestPromise = fetchJson('manifest.json')
      .then((json) => manifestSchema.parse(json))
      .catch((error) => {
        manifestPromise = null
        console.error('manifest load failed:', error)
        throw new Error('教材一覧を読み込めませんでした。通信環境を確認してください。')
      })
  }
  return manifestPromise
}

export async function loadDeck(deckId: string): Promise<Deck> {
  const cached = deckCache.get(deckId)
  if (cached) return cached

  const promise = (async () => {
    const manifest = await loadManifest()
    const entry = manifest.decks.find((d) => d.id === deckId)
    if (!entry) throw new Error(`デッキが見つかりません: ${deckId}`)
    const json = await fetchJson(entry.file)
    return deckSchema.parse(json)
  })().catch((error) => {
    deckCache.delete(deckId)
    console.error('deck load failed:', error)
    throw new Error('問題データを読み込めませんでした。通信環境を確認してください。')
  })

  deckCache.set(deckId, promise)
  return promise
}
