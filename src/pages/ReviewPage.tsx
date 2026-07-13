import { Link } from 'react-router-dom'
import TopBar from '../components/TopBar'
import { useManifest } from '../data/hooks'
import { dueItemIds } from '../srs/sm2'
import { useProgress } from '../store/progress'

export default function ReviewPage() {
  const { data: manifest, error } = useManifest()
  const srs = useProgress((s) => s.srs)

  const rows = (manifest?.decks ?? [])
    .map((deck) => ({ deck, due: dueItemIds(srs[deck.id]).size }))
    .filter((row) => row.due > 0)

  return (
    <div className="page">
      <div className="page-body">
        <TopBar backTo="/" backLabel="ホーム" title="今日の復習" />
        {error ? <p className="notice-error">{error}</p> : null}
        {!manifest && !error ? <p className="notice-loading">よみこみ中…</p> : null}

        {manifest ? (
          rows.length > 0 ? (
            <>
              <p className="review-lead">
                わすれかけの問題が {rows.reduce((sum, r) => sum + r.due, 0)}問 たまっています。
              </p>
              <ul className="deck-list">
                {rows.map(({ deck, due }) => (
                  <li key={deck.id}>
                    <Link
                      to={`/play/${deck.id}/flashcard?due=1&order=random`}
                      className="deck-row"
                    >
                      <span className="deck-main">
                        <span className="deck-title">{deck.title}</span>
                        <span className="deck-count">要復習 {due}問</span>
                      </span>
                      <span className="mode-start">復習する →</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <div className="review-empty">
              <p className="review-empty-title">今日ぶんの復習はおわり！</p>
              <p className="review-empty-sub">
                あたらしい問題に挑戦すると、ここに復習予定がたまっていきます。
              </p>
              <Link to="/" className="btn btn-primary">
                学習領域を選ぶ
              </Link>
            </div>
          )
        ) : null}
      </div>
    </div>
  )
}
