import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import TopBar from '../components/TopBar'
import { useDeck } from '../data/hooks'
import type { DeckItem } from '../data/schema'
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

  const groups = useMemo(() => (deck ? groupByUnit(deck.items) : []), [deck])
  const weak = useMemo(() => weakItemIds(stats), [stats])

  const inScope = (item: DeckItem) =>
    (!scope.unit || item.unit === scope.unit) &&
    (!scope.section || item.section === scope.section)

  const inRange = deck ? deck.items.filter(inScope) : []
  const weakInRange = inRange.filter((i) => weak.has(i.id)).length
  const baseItems = weakOnly ? inRange.filter((i) => weak.has(i.id)) : inRange
  const typableCount = baseItems.filter((i) => Boolean(i.reading)).length

  const isScope = (unit: string | null, section: string | null) =>
    scope.unit === unit && scope.section === section

  const query = new URLSearchParams({
    ...(scope.unit ? { unit: scope.unit } : {}),
    ...(scope.section ? { section: scope.section } : {}),
    order,
    ...(weakOnly ? { weak: '1' } : {}),
  }).toString()

  const modes = [
    {
      id: 'flashcard',
      name: 'フラッシュカード',
      desc: 'カードをめくって、おぼえる',
      count: baseItems.length,
      extra: '',
    },
    {
      id: 'choice',
      name: '4択クイズ',
      desc: 'テンポよく、えらんで答える',
      count: baseItems.length,
      extra: '',
    },
    {
      id: 'test',
      name: 'テスト',
      desc: '制限時間つき・採点はさいごに',
      count: baseItems.length,
      extra: '',
    },
    {
      id: 'typing',
      name: 'タイピング道場',
      desc: '答えを見ながら、読みをすばやく打つ',
      count: typableCount,
      extra: '',
    },
    {
      id: 'typing-recall',
      name: 'タイピング実戦',
      desc: '問題文だけ見て、答えを思い出して打つ',
      count: typableCount,
      extra: '&style=recall',
    },
  ]

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
                      to={`/play/${deck.id}/${mode.id.split('-')[0]}?${query}${mode.extra}`}
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
