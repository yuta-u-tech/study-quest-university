import { Link, useParams } from 'react-router-dom'
import ProgressRing from '../components/ProgressRing'
import TopBar from '../components/TopBar'
import { useManifest } from '../data/hooks'
import { kanjiNumber } from '../lib/kanji'
import { masteredCount, useProgress } from '../store/progress'

export default function SubjectPage() {
  const { subjectId } = useParams()
  const { data: manifest, error } = useManifest()
  const itemStats = useProgress((s) => s.itemStats)

  const subject = manifest?.subjects.find((s) => s.id === subjectId)
  const decks = manifest?.decks.filter((d) => d.subject === subjectId) ?? []

  return (
    <div className="page" data-theme={subjectId}>
      <header className="subject-header">
        <div className="subject-header-inner">
          <span className="cartouche">{subject?.name ?? ''}</span>
          <div>
            <p className="subject-kicker">StudyQuest</p>
            <h1 className="subject-title">{subject ? `${subject.name}の間` : ''}</h1>
            <p className="subject-tagline">{subject?.tagline}</p>
          </div>
        </div>
        <div className="subject-sea" aria-hidden="true" />
      </header>

      <div className="page-body">
        <TopBar backTo="/" backLabel="世界をえらぶ" />
        {error ? <p className="notice-error">{error}</p> : null}
        {!manifest && !error ? <p className="notice-loading">よみこみ中…</p> : null}
        {manifest && !subject ? <p className="notice-error">この科目は見つかりませんでした。</p> : null}

        <ul className="deck-list">
          {decks.map((deck, i) => {
            const mastered = masteredCount(itemStats[deck.id])
            return (
              <li key={deck.id}>
                <Link to={`/deck/${deck.id}`} className="deck-row">
                  <span className="deck-no">其の{kanjiNumber(i + 1)}</span>
                  <span className="deck-main">
                    <span className="deck-title">{deck.title}</span>
                    <span className="deck-count">
                      全{deck.itemCount}問 ・ 習得{mastered}問
                    </span>
                  </span>
                  <ProgressRing ratio={deck.itemCount > 0 ? mastered / deck.itemCount : 0} />
                </Link>
              </li>
            )
          })}
        </ul>
        {manifest && subject && decks.length === 0 ? (
          <p className="notice-loading">この科目の教材はまだ登録されていません。</p>
        ) : null}
      </div>
    </div>
  )
}
