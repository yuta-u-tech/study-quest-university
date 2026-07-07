import { useState } from 'react'
import type { DeckItem } from '../../data/schema'
import type { Grade } from '../../store/progress'

interface FlashcardSessionProps {
  item: DeckItem
  questionText: string
  sectionLabel: string
  onGrade: (grade: Grade) => void
}

const GRADES: { grade: Grade; label: string; hint: string }[] = [
  { grade: 'again', label: 'できなかった', hint: 'もう一度' },
  { grade: 'hard', label: 'びみょう', hint: 'あやしい' },
  { grade: 'good', label: 'できた！', hint: 'かんぺき' },
]

export default function FlashcardSession({
  item,
  questionText,
  sectionLabel,
  onGrade,
}: FlashcardSessionProps) {
  const [flipped, setFlipped] = useState(false)

  return (
    <div className="flashcard-stage">
      <button
        type="button"
        className={`flashcard ${flipped ? 'is-flipped' : ''}`}
        onClick={() => setFlipped(true)}
        disabled={flipped}
        aria-label={flipped ? '答えを表示中' : 'タップして答えを見る'}
      >
        <span className="flashcard-inner">
          <span className="flashcard-face flashcard-front">
            <span className="flashcard-section">{sectionLabel}</span>
            <span className="flashcard-question">{questionText}</span>
            <span className="flashcard-hint">タップして答えを見る</span>
          </span>
          <span className="flashcard-face flashcard-back">
            <span className="flashcard-section">答え</span>
            <span className="flashcard-answer">{item.answer}</span>
            {item.reading ? <span className="flashcard-reading">{item.reading}</span> : null}
          </span>
        </span>
      </button>

      <div className={`grade-row ${flipped ? 'is-visible' : ''}`}>
        {GRADES.map(({ grade, label, hint }) => (
          <button
            key={grade}
            type="button"
            className={`grade-btn grade-${grade}`}
            disabled={!flipped}
            onClick={() => onGrade(grade)}
          >
            <span className="grade-label">{label}</span>
            <span className="grade-hint">{hint}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
