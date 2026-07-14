import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import TopBar from '../components/TopBar'
import { useDeck } from '../data/hooks'
import type { DeckItem } from '../data/schema'
import {
  itemSupportsMode,
  modesForSubject,
  problemKindForItem,
  subjectUsesProblemKindTabs,
  type ProblemKind,
} from '../data/learningModes'
import { kanjiNumber } from '../lib/kanji'
import { useProgress, weakItemIds } from '../store/progress'

interface UnitGroup {
  unit: string | null
  sections: string[]
}

interface Scope {
  unit: string | null
  section: string | null
}

const ALL: Scope = { unit: null, section: null }

function groupByUnit(items: DeckItem[]): UnitGroup[] {
  const groups: UnitGroup[] = []
  for (const item of items) {
    const unit = item.unit ?? null
    const found = groups.find((g) => g.unit === unit)
    const group = found ?? { unit, sections: [] }
    if (!found) groups.push(group)
    if (!group.sections.includes(item.section)) group.sections.push(item.section)
  }
  return groups
}

export default function DeckPage() {
  const { deckId = '' } = useParams()
  const { data: deck, error } = useDeck(deckId)
  const stats = useProgress((s) => s.itemStats[deckId])

  const [scope, setScope] = useState<Scope>(ALL)
  const [order, setOrder] = useState<'seq' | 'random'>('seq')
  const [weakOnly, setWeakOnly] = useState(false)
  const [problemKind, setProblemKind] = useState<ProblemKind>('knowledge')

  const groups = useMemo(() => (deck ? groupByUnit(deck.items) : []), [deck])
  const weak = useMemo(() => weakItemIds(stats), [stats])

  const inScope = (item: DeckItem) =>
    (!scope.unit || item.unit === scope.unit) &&
    (!scope.section || item.section === scope.section)

  const usesProblemTabs = deck ? subjectUsesProblemKindTabs(deck.subject) : false
  const kindCounts = {
    knowledge: deck?.items.filter((item) => problemKindForItem(item) === 'knowledge').length ?? 0,
    calculation: deck?.items.filter((item) => problemKindForItem(item) === 'calculation').length ?? 0,
  }
  const showProblemTabs = usesProblemTabs && kindCounts.knowledge > 0 && kindCounts.calculation > 0
  const inRange = deck
    ? deck.items
        .filter(inScope)
        .filter((item) => !showProblemTabs || problemKindForItem(item) === problemKind)
    : []
  const weakInRange = inRange.filter((i) => weak.has(i.id)).length
  const baseItems = weakOnly ? inRange.filter((i) => weak.has(i.id)) : inRange
  const countForMode = (mode: string, inputStyle?: string) =>
    baseItems.filter((item) => itemSupportsMode(item, mode, inputStyle)).length

  const isScope = (unit: string | null, section: string | null) =>
    scope.unit === unit && scope.section === section

  const query = new URLSearchParams({
    ...(scope.unit ? { unit: scope.unit } : {}),
    ...(scope.section ? { section: scope.section } : {}),
    order,
    ...(weakOnly ? { weak: '1' } : {}),
    ...(showProblemTabs ? { kind: problemKind } : {}),
  }).toString()

  const subjectModes = deck ? modesForSubject(deck.subject) : []

  const modes = [
    {
      id: 'flashcard',
      route: 'flashcard',
      name: 'フラッシュカード',
      desc: 'カードをめくって、おぼえる',
      count: countForMode('flashcard'),
      extra: '',
      available: subjectModes.includes('flashcard'),
    },
    {
      id: 'choice',
      route: 'choice',
      name: '4択クイズ',
      desc: 'テンポよく、えらんで答える',
      count: countForMode('choice'),
      extra: '',
      available: subjectModes.includes('choice'),
    },
    {
      id: 'test',
      route: 'test',
      name: 'テスト',
      desc: '制限時間つき・採点はさいごに',
      count: countForMode('test'),
      extra: '',
      available: subjectModes.includes('test'),
    },
    {
      id: 'typing',
      route: 'typing',
      name: 'タイピング道場',
      desc: '答えを見ながら、読みをすばやく打つ',
      count: countForMode('typing'),
      extra: '',
      available: subjectModes.includes('typing'),
    },
    {
      id: 'typing-recall',
      route: 'typing',
      name: 'タイピング実戦',
      desc: '問題文だけ見て、答えを思い出して打つ',
      count: countForMode('typing-recall'),
      extra: '&style=recall',
      available: subjectModes.includes('typing-recall'),
    },
    {
      id: 'input',
      route: 'input',
      name: 'キーボード解答',
      desc: '答えを入力して自動判定（数式・英単語）',
      count: countForMode('input'),
      extra: '',
      available: subjectModes.includes('input') && countForMode('input') > 0,
    },
    {
      id: 'input-spelling',
      route: 'input',
      name: 'スペル入力',
      desc: '日本語と頭文字から、英語を入力',
      count: countForMode('input', 'spelling'),
      extra: '&style=spelling',
      available: deck?.subject === 'english',
    },
    {
      id: 'input-meaning',
      route: 'input',
      name: '意味入力',
      desc: '英語を見て、日本語の意味を入力',
      count: countForMode('input', 'meaning'),
      extra: '&style=meaning',
      available: deck?.subject === 'english',
    },
  ].filter((m) => m.available && (!showProblemTabs || m.count > 0))

  return (
    <div className="page" data-theme={deck?.subject}>
      <div className="page-body">
        <TopBar backTo={deck ? `/subject/${deck.subject}` : '/'} backLabel="教材一覧" />
        {error ? <p className="notice-error">{error}</p> : null}
        {!deck && !error ? <p className="notice-loading">よみこみ中…</p> : null}

        {deck ? (
          <>
            <header className="deck-header">
              <h1 className="deck-page-title">{deck.title}</h1>
              <p className="deck-page-sub">
                全{deck.items.length}問{weak.size > 0 ? ` ・ にがて ${weak.size}問` : ''}
              </p>
            </header>

            {showProblemTabs ? (
              <section className="problem-kind-panel" aria-label="問題タイプ">
                <div className="problem-kind-tabs" role="tablist">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={problemKind === 'knowledge'}
                    className={`problem-kind-tab ${problemKind === 'knowledge' ? 'is-active' : ''}`}
                    onClick={() => setProblemKind('knowledge')}
                  >
                    <span>暗記問題</span>
                    <small>{kindCounts.knowledge}問</small>
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={problemKind === 'calculation'}
                    className={`problem-kind-tab ${problemKind === 'calculation' ? 'is-active' : ''}`}
                    onClick={() => setProblemKind('calculation')}
                  >
                    <span>計算問題</span>
                    <small>{kindCounts.calculation}問</small>
                  </button>
                </div>
              </section>
            ) : null}

            <section className="panel">
              <h2 className="panel-label">出題はんい</h2>
              <div className="chip-row">
                <button
                  type="button"
                  className={`chip ${isScope(null, null) ? 'is-active' : ''}`}
                  onClick={() => setScope(ALL)}
                >
                  全はんい
                </button>
              </div>
              {groups.map((group, gi) => (
                <div key={group.unit ?? gi} className="unit-group">
                  {group.unit ? (
                    <button
                      type="button"
                      className={`unit-head ${isScope(group.unit, null) ? 'is-active' : ''}`}
                      onClick={() => setScope({ unit: group.unit, section: null })}
                    >
                      <span className="unit-name">{group.unit}</span>
                      <span className="unit-all">まるごと</span>
                    </button>
                  ) : null}
                  <div className="chip-row unit-sections">
                    {group.sections.map((section, si) => (
                      <button
                        key={section}
                        type="button"
                        className={`chip ${isScope(group.unit, section) ? 'is-active' : ''}`}
                        onClick={() => setScope({ unit: group.unit, section })}
                      >
                        {kanjiNumber(si + 1)}. {section}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </section>

            <section className="panel">
              <h2 className="panel-label">出題のしかた</h2>
              <div className="chip-row">
                <button
                  type="button"
                  className={`chip ${order === 'seq' ? 'is-active' : ''}`}
                  onClick={() => setOrder('seq')}
                >
                  順番どおり
                </button>
                <button
                  type="button"
                  className={`chip ${order === 'random' ? 'is-active' : ''}`}
                  onClick={() => setOrder('random')}
                >
                  シャッフル
                </button>
                <button
                  type="button"
                  className={`chip chip-weak ${weakOnly ? 'is-active' : ''}`}
                  disabled={weakInRange === 0}
                  onClick={() => setWeakOnly((v) => !v)}
                >
                  にがてだけ（{weakInRange}問）
                </button>
              </div>
            </section>

            <section className="panel">
              <h2 className="panel-label">モードをえらぶ</h2>
              <div className="mode-grid">
                {modes.map((mode) =>
                  mode.count > 0 ? (
                    <Link
                      key={mode.id}
                      to={`/play/${deck.id}/${mode.route}?${query}${mode.extra}`}
                      className="mode-card"
                    >
                      <span className="mode-name">{mode.name}</span>
                      <span className="mode-desc">{mode.desc}</span>
                      <span className="mode-start">{mode.count}問ではじめる →</span>
                    </Link>
                  ) : (
                    <div key={mode.id} className="mode-card is-locked">
                      <span className="mode-name">{mode.name}</span>
                      <span className="mode-desc">{mode.desc}</span>
                      <span className="mode-start">出題できる問題がありません</span>
                    </div>
                  ),
                )}
              </div>
            </section>
          </>
        ) : null}
      </div>
    </div>
  )
}
