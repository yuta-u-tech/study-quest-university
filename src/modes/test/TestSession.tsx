import { useEffect, useMemo, useState } from 'react'
import type { Deck, DeckItem } from '../../data/schema'
import { displayQuestion } from '../../data/refs'

interface TestSessionProps {
  deck: Deck
  queue: DeckItem[]
  optionsByItem: Map<string, string[]>
  index: number
  onAnswer: (item: DeckItem, ok: boolean) => void
  onExpire: () => void
}

const SECONDS_PER_QUESTION = 12

export default function TestSession({
  deck,
  queue,
  optionsByItem,
  index,
  onAnswer,
  onExpire,
}: TestSessionProps) {
  const deadline = useMemo(() => Date.now() + queue.length * SECONDS_PER_QUESTION * 1000, [queue])
  const total = queue.length * SECONDS_PER_QUESTION * 1000
  const [remaining, setRemaining] = useState(total)

  useEffect(() => {
    const timer = setInterval(() => {
      const left = deadline - Date.now()
      setRemaining(left)
      if (left <= 0) {
        clearInterval(timer)
        onExpire()
      }
    }, 250)
    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deadline])

  const item = queue[index]
  if (!item) return null
  const options = optionsByItem.get(item.id) ?? []
  const seconds = Math.max(0, Math.ceil(remaining / 1000))
  const urgent = remaining <= total * 0.15

  return (
    <div className="choice-stage">
      <div className={`test-timer ${urgent ? 'is-urgent' : ''}`}>
        <div className="test-timer-bar">
          <div
            className="test-timer-fill"
            style={{ width: `${Math.max(0, (remaining / total) * 100)}%` }}
          />
        </div>
        <span className="test-timer-count">
          のこり {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}
        </span>
      </div>

      <div className="choice-question-card">
        <span className="flashcard-section">
          {[item.unit, item.section].filter(Boolean).join('｜')}
        </span>
        <p className="choice-question">{displayQuestion(item, deck, true)}</p>
      </div>

      <div className="choice-options">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            className="choice-btn"
            onClick={() => onAnswer(item, option === item.answer)}
          >
            {option}
          </button>
        ))}
      </div>

      <p className="choice-feedback is-visible test-note">採点はさいごにまとめて</p>
    </div>
  )
}
