import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import TopBar from '../components/TopBar'
import { useDeck } from '../data/hooks'
import { kanjiNumber } from '../lib/kanji'
import { useProgress, weakItemIds } from '../store/progress'

const MODES = [
  { id: 'flashcard', name: 'フラッシュカード', desc: 'カードをめくって、おぼえる', ready: true },
  { id: 'choice', name: '4択クイズ', desc: 'テンポよく、えらんで答える', ready: true },
  { id: 'test', name: 'テスト', desc: '時間を計って本番さながらに', ready: false },
  { id: 'typing', name: 'タイピング道場', desc: '答えを打ちこむ速さで勝負', ready: false },
] as const

export default function DeckPage() {
  const { deckId = '' } = useParams()
  const { data: deck, error } = useDeck(deckId)
  const stats = useProgress((s) => s.itemStats[deckId])

  const [section, setSection] = useState<string>('all')
  const [order, setOrder] = useState<'seq' | 'random'>('seq')
  const [weakOnly, setWeakOnly] = useState(false)

  const sections = useMemo(() => {
    if (!deck) return []
    const names: string[] = []
    for (const item of deck.items) {
      if (!names.includes(item.section)) names.push(item.section)
    }
    return names
  }, [deck])

  const weak = useMemo(() => weakItemIds(stats), [stats])
  const inRange = deck
    ? deck.items.filter((i) => section === 'all' || i.section === section)
    : []
  const weakInRange = inRange.filter((i) => weak.has(i.id)).length
  const playCount = weakOnly ? weakInRange : inRange.length

  const query = new URLSearchParams({
    ...(section !== 'all' ? { section } : {}),
    order,
    ...(weakOnly ? { weak: '1' } : {}),
  }).toString()

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
                  className={`chip ${section === 'all' ? 'is-active' : ''}`}
                  onClick={() => setSection('all')}
                >
                  全はんい
                </button>
                {sections.map((name, i) => (
                  <button
                    key={name}
                    type="button"
                    className={`chip ${section === name ? 'is-active' : ''}`}
                    onClick={() => setSection(name)}
                  >
                    {kanjiNumber(i + 1)}. {name}
                  </button>
                ))}
              </div>
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
                {MODES.map((mode) =>
                  mode.ready && playCount > 0 ? (
                    <Link
                      key={mode.id}
                      to={`/play/${deck.id}/${mode.id}?${query}`}
                      className="mode-card"
                    >
                      <span className="mode-name">{mode.name}</span>
                      <span className="mode-desc">{mode.desc}</span>
                      <span className="mode-start">{playCount}問ではじめる →</span>
                    </Link>
                  ) : (
                    <div key={mode.id} className="mode-card is-locked">
                      <span className="mode-name">{mode.name}</span>
                      <span className="mode-desc">{mode.desc}</span>
                      <span className="mode-start">{mode.ready ? '出題できる問題がありません' : '準備中'}</span>
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
