#!/usr/bin/env node
/**
 * 問題登録スクリプト
 *
 * 手元の問題JSON（一問一答形式）を StudyQuest のデッキ形式に変換し、
 * public/data/decks/ に配置して manifest.json を更新する。
 *
 * 使い方:
 *   node scripts/register.mjs <source.json> \
 *     --id social-history-p32-38 --subject social --area history \
 *     --title "律令国家〜平安時代"
 *
 * - scripts/readings/<id>.json（answer→よみ のマップ）があれば reading を付与する
 * - scripts/units/<id>.json（page→単元名 のマップ）があれば unit（時代・単元）を付与する
 * - 問題文中の (N) を同一セクション内の問題番号への参照として検出し refs に記録する
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const ROOT = path.resolve(new URL('..', import.meta.url).pathname)
const DECKS_DIR = path.join(ROOT, 'public/data/decks')
const MANIFEST_PATH = path.join(ROOT, 'public/data/manifest.json')

function parseArgs(argv) {
  const [source, ...rest] = argv
  const opts = {}
  for (let i = 0; i < rest.length; i += 2) {
    const key = rest[i]?.replace(/^--/, '')
    const value = rest[i + 1]
    if (!key || value === undefined) throw new Error(`引数が不正です: ${rest[i]}`)
    opts[key] = value
  }
  for (const required of ['id', 'subject', 'title']) {
    if (!opts[required]) throw new Error(`--${required} は必須です`)
  }
  if (!source) throw new Error('変換元JSONのパスを指定してください')
  return { source, ...opts }
}

function detectRefs(item, siblings) {
  const refs = []
  for (const match of item.question.matchAll(/[(（](\d+)[)）]/g)) {
    const target = siblings.find((s) => s.number === Number(match[1]))
    if (target && target.id !== item.id) refs.push(target.id)
  }
  return [...new Set(refs)]
}

function convertItems(sourceItems, readings, units) {
  const missingReadings = []
  const items = sourceItems.map((raw) => {
    const reading = readings[raw.answer]
    if (!reading) missingReadings.push(raw.answer)
    const unit = units[String(raw.page)]
    return {
      id: raw.id,
      type: 'term',
      ...(unit ? { unit } : {}),
      section: raw.section_title,
      number: raw.number,
      question: raw.question,
      answer: raw.answer,
      ...(reading ? { reading } : {}),
    }
  })
  const withRefs = items.map((item) => {
    const siblings = items.filter((s) => s.section === item.section)
    const refs = detectRefs(item, siblings)
    return refs.length > 0 ? { ...item, refs } : item
  })
  return { items: withRefs, missingReadings }
}

function validateDeck(deck) {
  const ids = new Set()
  for (const item of deck.items) {
    if (ids.has(item.id)) throw new Error(`id重複: ${item.id}`)
    ids.add(item.id)
    if (!item.question || !item.answer) throw new Error(`question/answerが空: ${item.id}`)
    for (const ref of item.refs ?? []) {
      if (!deck.items.some((i) => i.id === ref)) throw new Error(`参照先が存在しません: ${item.id} -> ${ref}`)
    }
  }
}

async function main() {
  const opts = parseArgs(process.argv.slice(2))
  const source = JSON.parse(await readFile(opts.source, 'utf8'))

  const readingsPath = path.join(ROOT, 'scripts/readings', `${opts.id}.json`)
  const readings = existsSync(readingsPath) ? JSON.parse(await readFile(readingsPath, 'utf8')) : {}
  const unitsPath = path.join(ROOT, 'scripts/units', `${opts.id}.json`)
  const units = existsSync(unitsPath) ? JSON.parse(await readFile(unitsPath, 'utf8')) : {}

  const { items, missingReadings } = convertItems(source.items, readings, units)
  const deck = {
    schemaVersion: 1,
    id: opts.id,
    subject: opts.subject,
    ...(opts.area ? { area: opts.area } : {}),
    title: opts.title,
    ...(opts.description ? { description: opts.description } : {}),
    items,
  }
  validateDeck(deck)

  await mkdir(DECKS_DIR, { recursive: true })
  const deckFile = `decks/${opts.id}.json`
  await writeFile(path.join(DECKS_DIR, `${opts.id}.json`), `${JSON.stringify(deck, null, 2)}\n`)

  const manifest = JSON.parse(await readFile(MANIFEST_PATH, 'utf8'))
  const entry = {
    id: deck.id,
    subject: deck.subject,
    ...(deck.area ? { area: deck.area } : {}),
    title: deck.title,
    file: deckFile,
    itemCount: deck.items.length,
  }
  const updatedManifest = {
    ...manifest,
    decks: [...manifest.decks.filter((d) => d.id !== deck.id), entry],
  }
  await writeFile(MANIFEST_PATH, `${JSON.stringify(updatedManifest, null, 2)}\n`)

  const withRefs = items.filter((i) => (i.refs ?? []).length > 0).length
  console.log(`✔ ${deck.id}: ${items.length}問を登録しました（参照付き ${withRefs}問）`)
  if (missingReadings.length > 0) {
    console.log(`⚠ 読みが未登録の答え: ${[...new Set(missingReadings)].join(', ')}`)
  }
}

main().catch((error) => {
  console.error(`登録に失敗しました: ${error.message}`)
  process.exit(1)
})
