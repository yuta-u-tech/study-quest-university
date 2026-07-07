import { useEffect, useState } from 'react'
import type { DeckItem } from '../../data/schema'

interface ChoiceSessionProps {
  item: DeckItem
  questionText: string
  sectionLabel: string
  options: string[]
  combo: number
  onAnswer: (ok: boolean) => void
}

const ADVANCE_DELAY_MS = 950

export default function ChoiceSession({
  item,
  questionText,
  sectionLabel,
  options,
  combo,
  onAnswer,
}: ChoiceSessionProps) {
  const [selected, setSelected] = useState<string | null>(null)

  useEffect(() => {
    if (selected === null) return
    const timer = setTimeout(() => onAnswer(selected === item.answer), ADVANCE_DELAY_MS)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected])

  return (
    <div className="choice-stage">
      {combo >= 2 ? <div className="combo-badge">{combo} れんぞく正解中！</div> : null}

      <div className="choice-question-card">
        <span className="flashcard-section">{sectionLabel}</span>
        <p className="choice-question">{questionText}</p>
      </div>

      <div className="choice-options">
        {options.map((option) => {
          const state =
            selected === null
              ? ''
              : option === item.answer
                ? 'is-correct'
                : option === selected
                  ? 'is-wrong'
                  : 'is-dimmed'
          return (
            <button
              key={option}
              type="button"
              className={`choice-btn ${state}`}
              disabled={selected !== null}
              onClick={() => setSelected(option)}
            >
              {option}
            </button>
          )
        })}
      </div>

      <p className={`choice-feedback ${selected !== null ? 'is-visible' : ''}`}>
        {selected === null ? ' ' : selected === item.answer ? '正解！' : `正解は「${item.answer}」`}
      </p>
    </div>
  )
}
