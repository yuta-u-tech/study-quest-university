import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const root = path.resolve(new URL('..', import.meta.url).pathname)
const execFileAsync = promisify(execFile)
const repository = 'takumayellow/tus-cs-materials'
const sourceBase = 'subjects/一般教養/C科目/現代天文学/2026'
const files = [
  ['第01回', '現代天文学_第01回.md'],
  ['第02回', '現代天文学_第02回.md'],
  ['第03回', '現代天文学_第03回.md'],
  ['第04回', '現代天文学_第04回.md'],
  ['第05回', '現代天文学_第05回.md'],
  ['第05回（動画）', '現代天文学_第05回_動画(コペルニクス).md'],
  ['第06回', '現代天文学_第06回.md'],
  ['第07回（動画）', '現代天文学_第07回_動画(ケプラー).md'],
  ['第08回', '現代天文学_第08回.md'],
  ['第09回', '現代天文学_第09回.md'],
  ['第10回', '現代天文学_第10回.md'],
]

const plainTitle = (text, fallback) => {
  const heading = text.match(/^#\s+(.+)$/m)?.[1]?.trim()
  return heading?.replace(/[*_`]/g, '') || fallback
}

const passages = []
const items = []
for (const [unit, filename] of files) {
  const sourcePath = `${sourceBase}/${unit.replace('（動画）', '')}/note/${filename}`
  const { stdout } = await execFileAsync('gh', [
    'api',
    `repos/${repository}/contents/${sourcePath}`,
  ], { maxBuffer: 10 * 1024 * 1024 })
  const payload = JSON.parse(stdout)
  const text = Buffer.from(payload.content.replaceAll('\n', ''), 'base64').toString('utf8')
  const id = `modern-astronomy-${String(passages.length + 1).padStart(2, '0')}`
  const title = plainTitle(text, `${unit} 講義ノート`)
  passages.push({ id, title: `${unit}：${title}`, text })
  items.push({
    id: `${id}-check`,
    type: 'term',
    unit,
    section: '講義ノート',
    number: 1,
    question: `${unit}の講義ノートのタイトルを答えなさい。`,
    answer: title,
    passageId: id,
    explanation: 'カード下部の講義ノートを開いて、内容を確認しながら復習できます。',
  })
}

const deck = {
  schemaVersion: 1,
  id: 'modern-astronomy-2026',
  subject: 'astronomy',
  area: 'general-education',
  title: '現代天文学 2026 講義ノート',
  description: 'TUS CS Materials Portalで公開されている第01回〜第10回の講義ノートを、各回の読み物として収録。',
  passages,
  items,
}

const output = path.join(root, 'public/data/decks/modern-astronomy-2026.json')
await mkdir(path.dirname(output), { recursive: true })
await writeFile(output, `${JSON.stringify(deck, null, 2)}\n`)
console.log(`Imported ${passages.length} notes into ${output}`)
