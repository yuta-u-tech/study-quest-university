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

async function readGithubText(sourcePath) {
  const { stdout } = await execFileAsync('gh', [
    'api',
    `repos/${repository}/contents/${sourcePath}`,
  ], { maxBuffer: 10 * 1024 * 1024 })
  const payload = JSON.parse(stdout)
  return Buffer.from(payload.content.replaceAll('\n', ''), 'base64').toString('utf8')
}

const passages = []
const items = []
for (const [unit, filename] of files) {
  const sourcePath = `${sourceBase}/${unit.replace('（動画）', '')}/note/${filename}`
  const text = await readGithubText(sourcePath)
  const id = `modern-astronomy-${String(passages.length + 1).padStart(2, '0')}`
  const title = plainTitle(text, `${unit} 講義ノート`)
  passages.push({ id, title: `${unit}：${title}`, text })
}

// 公開元に用意されたクイズを優先して取り込み、ノートのタイトル当て問題は作らない。
for (let i = 1; i <= 6; i += 1) {
  const unit = `第${String(i).padStart(2, '0')}回`
  const passage = passages.find((entry) => entry.title.startsWith(`${unit}：`))
  const quizPath = `${sourceBase}/${unit}/study-materials/quiz.md`
  const quiz = JSON.parse(await readGithubText(quizPath))
  for (const [index, question] of quiz.questions.entries()) {
    const correct = question.answerOptions.find((option) => option.isCorrect)
    items.push({
      id: `modern-astronomy-${String(i).padStart(2, '0')}-q${index + 1}`,
      type: 'choice',
      unit,
      section: '講義内容の確認',
      number: index + 1,
      question: question.question,
      answer: correct.text,
      choices: question.answerOptions.map((option) => option.text),
      passageId: passage?.id,
      explanation: [correct.rationale, question.hint ? `ヒント: ${question.hint}` : ''].filter(Boolean).join(' '),
    })
  }
}

const laterQuestions = {
  7: [
    ['ケプラーの第1法則が示す惑星の軌道として正しいものはどれか。', '楕円軌道で、太陽はその焦点の一つにある', ['楕円軌道で、太陽はその焦点の一つにある', '完全な円軌道で、太陽は中心にある', '放物線軌道で、太陽は頂点にある', '直線軌道で、太陽は端点にある']],
    ['ケプラーの第2法則の内容はどれか。', '惑星と太陽を結ぶ線分は等しい時間に等しい面積を掃く', ['惑星と太陽を結ぶ線分は等しい時間に等しい面積を掃く', 'すべての惑星は同じ速さで公転する', '惑星の公転周期は質量に比例する', '惑星の軌道半径は時間とともに一定割合で増える']],
    ['ケプラーの第3法則で、公転周期をT、軌道長半径をaとしたときの関係はどれか。', '$T^2 \\propto a^3$', ['$T^2 \\propto a^3$', '$T \\propto a^2$', '$T^3 \\propto a^2$', '$T^2 \\propto a$']],
  ],
  8: [
    ['レビットが発見した、セファイド変光星に関する重要な関係はどれか。', '変光周期が長いほど絶対光度が大きい', ['変光周期が長いほど絶対光度が大きい', '変光周期が長いほど必ず色が赤くなる', '変光周期と光度には関係がない', 'すべての変光星の周期は同じである']],
    ['ハッブルの観測が示した、遠方銀河の後退速度と距離の関係はどれか。', '遠い銀河ほど大きな速度で遠ざかる', ['遠い銀河ほど大きな速度で遠ざかる', '遠い銀河ほど必ず近づいてくる', '距離によらず速度は常にゼロである', '銀河の距離と速度は反比例する']],
  ],
  9: [
    ['銀河の外側で観測される回転速度が予想より大きいことから、何の存在が示唆されたか。', 'ダークマター', ['ダークマター', '反物質だけでできた銀河', '太陽風', '宇宙背景輻射']],
    ['ダークエネルギーの説明として最も適切なものはどれか。', '宇宙の膨張を加速させる成分', ['宇宙の膨張を加速させる成分', '銀河を回転させる目に見えない物質', '恒星内部で核融合を起こす燃料', 'ブラックホールから放出される光']],
  ],
  10: [
    ['宇宙背景輻射（CMB）は、主に何の観測的証拠とされるか。', '初期の高温・高密度な宇宙の名残', ['初期の高温・高密度な宇宙の名残', '地球大気の温度変化', '銀河系内の恒星風', '太陽表面の黒点']],
    ['インフレーション理論が説明しようとする問題として適切なものはどれか。', '宇宙の地平線問題や平坦性問題', ['宇宙の地平線問題や平坦性問題', '惑星の季節変化', '恒星のスペクトル分類', '月の満ち欠け']],
    ['現在の宇宙について観測されている重要な特徴はどれか。', '膨張が加速している', ['膨張が加速している', '膨張が完全に止まっている', 'すべての銀河が同じ方向へ落下している', '宇宙の温度が時間とともに上昇している']],
  ],
}

for (const [round, questions] of Object.entries(laterQuestions)) {
  const unit = `第${String(round).padStart(2, '0')}回`
  const passage = passages.find((entry) => entry.title.startsWith(`${unit}：`))
  for (const [index, [question, answer, choices]] of questions.entries()) {
    items.push({
      id: `modern-astronomy-${String(round).padStart(2, '0')}-q${index + 1}`,
      type: 'choice',
      unit,
      section: '講義内容の確認',
      number: index + 1,
      question,
      answer,
      choices,
      passageId: passage?.id,
      explanation: '講義ノートの該当箇所を読み返して、用語の意味と関係を確認しましょう。',
    })
  }
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
