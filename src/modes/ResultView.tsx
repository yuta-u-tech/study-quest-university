import { Link } from 'react-router-dom'
import { displayQuestion } from '../data/refs'
import type { Deck } from '../data/schema'
import type { AnswerResult } from '../pages/SessionPage'

interface ResultViewProps {
  deck: Deck
  results: AnswerResult[]
  expandRefs: boolean
  onRetry: () => void
}

function praise(ratio: number): string {
  if (ratio === 1) return '全問正解！お見事！'
  if (ratio >= 0.8) return 'あと少しで完璧！'
  if (ratio >= 0.5) return 'いい調子。にがてをつぶそう'
  return 'くり返せば必ずおぼえられる'
}

export default function ResultView({ deck, results, expandRefs, onRetry }: ResultViewProps) {
  const correct = results.filter((r) => r.ok).length
  const ratio = results.length > 0 ? correct / results.length : 0
  const wrong = results.filter((r) => !r.ok)

  return (
    <div className="result">
      {ratio === 1 ? (
        <div className="confetti" aria-hidden="true">
          {Array.from({ length: 16 }, (_, i) => (
            <span key={i} className="confetti-piece" style={{ ['--i' as string]: i }} />
          ))}
        </div>
      ) : null}
      <p className="result-kicker">けっか</p>
      <p className="result-score">
        <span className="result-correct">{correct}</span>
        <span className="result-total"> / {results.length} 問</span>
      </p>
      <p className="result-praise">{praise(ratio)}</p>

      {wrong.length > 0 ? (
        <section className="result-wrong">
          <h2 className="panel-label">まちがえた問題（にがてに登録済み）</h2>
          <ul className="result-wrong-list">
            {wrong.map(({ item }) => (
              <li key={item.id} className="result-wrong-row">
                <p className="result-wrong-q">{displayQuestion(item, deck, expandRefs)}</p>
                <p className="result-wrong-a">
                  {item.answer}
                  {item.reading ? <span className="result-wrong-reading">（{item.reading}）</span> : null}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="result-actions">
        <button type="button" className="btn btn-primary" onClick={onRetry}>
          もう一度
        </button>
        <Link to={`/deck/${deck.id}`} className="btn">
          はんい・モードをえらびなおす
        </Link>
      </div>
    </div>
  )
}
