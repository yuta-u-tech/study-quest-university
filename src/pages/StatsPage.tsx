import { useEffect, useState } from 'react'
import TopBar from '../components/TopBar'
import { useManifest } from '../data/hooks'
import { loadDeck } from '../data/loader'
import type { Deck } from '../data/schema'
import { masteredCount, streakDays, studyDays, useProgress } from '../store/progress'
import type { ItemStat } from '../store/progress'

const MODE_NAMES: Record<string, string> = {
  flashcard: 'フラッシュカード',
  choice: '4択',
  test: 'テスト',
  typing: 'タイピング',
}

interface SectionAccuracy {
  label: string
  correct: number
  total: number
}

function sectionAccuracies(deck: Deck, stats: Record<string, ItemStat>): SectionAccuracy[] {
  const rows: SectionAccuracy[] = []
  for (const item of deck.items) {
    const stat = stats[item.id]
    if (!stat) continue
    const label = [item.unit, item.section].filter(Boolean).join('｜')
    const found = rows.find((r) => r.label === label)
    const row = found ?? { label, correct: 0, total: 0 }
    if (!found) rows.push(row)
    row.correct += stat.correct
    row.total += stat.correct + stat.wrong
  }
  return rows
}

export default function StatsPage() {
  const { data: manifest } = useManifest()
  const { itemStats, sessions } = useProgress()
  const [decks, setDecks] = useState<Deck[]>([])

  const studiedDeckIds = Object.keys(itemStats).filter(
    (id) => Object.keys(itemStats[id]).length > 0,
  )

  useEffect(() => {
    if (!manifest) return
    let active = true
    const ids = studiedDeckIds.filter((id) => manifest.decks.some((d) => d.id === id))
    Promise.all(ids.map((id) => loadDeck(id))).then(
      (loaded) => {
        if (active) setDecks(loaded)
      },
      (error) => console.error('stats deck load failed:', error),
    )
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manifest, studiedDeckIds.join(',')])

  const totalAnswered = sessions.reduce((sum, s) => sum + s.total, 0)
  const recent = [...sessions].slice(-10).reverse()

  return (
    <div className="page">
      <div className="page-body">
        <TopBar backTo="/" backLabel="ホーム" title="学習のきろく" />

        <div className="stats-summary">
          <div className="stat-tile">
            <span className="stat-value">{streakDays(sessions)}</span>
            <span className="stat-label">れんぞく学習日</span>
          </div>
          <div className="stat-tile">
            <span className="stat-value">{studyDays(sessions).size}</span>
            <span className="stat-label">学習した日</span>
          </div>
          <div className="stat-tile">
            <span className="stat-value">{totalAnswered}</span>
            <span className="stat-label">といた問題</span>
          </div>
        </div>

        {decks.map((deck) => {
          const stats = itemStats[deck.id] ?? {}
          const mastered = masteredCount(stats)
          return (
            <section key={deck.id} className="panel">
              <h2 className="panel-label">{deck.title}</h2>
              <p className="stats-deck-sub">
                習得 {mastered} / {deck.items.length}問
              </p>
              <ul className="accuracy-list">
                {sectionAccuracies(deck, stats).map((row) => {
                  const ratio = row.total > 0 ? row.correct / row.total : 0
                  return (
                    <li key={row.label} className="accuracy-row">
                      <span className="accuracy-label">{row.label}</span>
                      <span className="accuracy-bar">
                        <span
                          className={`accuracy-fill ${ratio < 0.6 ? 'is-low' : ''}`}
                          style={{ width: `${Math.round(ratio * 100)}%` }}
                        />
                      </span>
                      <span className="accuracy-num">{Math.round(ratio * 100)}%</span>
                    </li>
                  )
                })}
              </ul>
            </section>
          )
        })}

        {recent.length > 0 ? (
          <section className="panel">
            <h2 className="panel-label">さいきんのセッション</h2>
            <ul className="session-list">
              {recent.map((s, i) => (
                <li key={`${s.at}-${i}`} className="session-row">
                  <span className="session-date">
                    {new Date(s.at).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })}
                  </span>
                  <span className="session-mode">{MODE_NAMES[s.mode] ?? s.mode}</span>
                  <span className="session-score">
                    {s.correct} / {s.total}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : (
          <p className="notice-loading">まだ記録がありません。まずは1セッション解いてみよう！</p>
        )}
      </div>
    </div>
  )
}
