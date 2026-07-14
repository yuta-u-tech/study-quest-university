import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const root = path.resolve(new URL('..', import.meta.url).pathname)
const sourceRoot = path.resolve(process.argv[2] ?? path.join(root, '../quiz-app'))
const sourceData = path.join(sourceRoot, 'data')
const outputDir = path.join(root, 'public/data/decks')
const manifestPath = path.join(root, 'public/data/manifest.json')

const sources = [
  ['words1-400', 'TOEIC 金のフレーズ 1–400', '600点レベル（見出し語 1–400）'],
  ['words401-700', 'TOEIC 金のフレーズ 401–700', '730点レベル（見出し語 401–700）'],
  ['words701-900', 'TOEIC 金のフレーズ 701–900', '860点レベル（見出し語 701–900）'],
  ['words901-1000', 'TOEIC 金のフレーズ 901–1000', '990点レベル（見出し語 901–1000）'],
  ['supplement1', 'TOEIC Supplement 1', 'Supplement 1'],
  ['supplement2', 'TOEIC Supplement 2', 'Supplement 2'],
  ['supplement3', 'TOEIC Supplement 3', 'Supplement 3'],
]

const sourceIndex = JSON.parse(await readFile(path.join(sourceData, 'index.json'), 'utf8'))
const sourceDescriptions = new Map(
  sourceIndex.subjects.map((subject) => [subject.id, subject.description]),
)

await mkdir(outputDir, { recursive: true })

const entries = []
for (const [sourceId, title, chapter] of sources) {
  const source = JSON.parse(await readFile(path.join(sourceData, `${sourceId}.json`), 'utf8'))
  const items = source.terms.map((term, index) => {
    const setIndex = Math.floor(index / 100) + 1
    return {
      id: `toeic-${sourceId}-${index + 1}`,
      type: 'term',
      unit: chapter,
      section: `復習セット ${setIndex}`,
      number: (index % 100) + 1,
      question: term.term,
      answer: term.definition,
      ...(term.example
        ? { explanation: `${term.example}\n出典: ${term.source}` }
        : { explanation: `出典: ${term.source}` }),
    }
  })

  const deckId = `toeic-${sourceId}`
  const deck = {
    schemaVersion: 1,
    id: deckId,
    subject: 'english',
    area: 'toeic',
    title,
    description: `${sourceDescriptions.get(sourceId) ?? `${title}の語彙カード。`}${sourceId.startsWith('words') ? ' 見出し語に付随する派生語・関連語も収録。' : ''}`,
    items,
  }
  await writeFile(path.join(outputDir, `${deckId}.json`), `${JSON.stringify(deck, null, 2)}\n`)
  entries.push({
    id: deckId,
    subject: 'english',
    area: 'toeic',
    title,
    file: `decks/${deckId}.json`,
    itemCount: items.length,
  })
}

const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
const importedIds = new Set(entries.map((entry) => entry.id))
manifest.decks = [...manifest.decks.filter((deck) => !importedIds.has(deck.id)), ...entries]
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)

console.log(`Imported ${entries.length} TOEIC decks (${entries.reduce((sum, entry) => sum + entry.itemCount, 0)} cards) from ${sourceRoot}`)
