import { useEffect, useRef, useState } from 'react'
import RichText from '../../components/RichText'
import type { DeckItem } from '../../data/schema'
import {
  isMathCorrect,
  isMeaningCorrect,
  isSpellingCorrect,
  spellingVariants,
} from '../../math/compare'
import MathField from './MathField'

interface InputSessionProps {
  item: DeckItem
  questionText: string
  sectionLabel: string
  combo: number
  style?: 'spelling' | 'meaning' | null
  onAnswer: (ok: boolean) => void
}

const ADVANCE_OK_MS = 1300
const ADVANCE_NG_MS = 2600

export default function InputSession({
  item,
  questionText,
  sectionLabel,
  combo,
  style,
  onAnswer,
}: InputSessionProps) {
  const [value, setValue] = useState('')
  const [outcome, setOutcome] = useState<'ok' | 'ng' | null>(null)
  const valueRef = useRef('')
  const isMath = item.type === 'math'
  const targetAnswer = style === 'spelling' ? item.question : item.answer
  const prompt = style === 'spelling'
    ? `「${item.answer}」に当たる英語を入力してください。\n頭文字: ${item.question.match(/[A-Za-z]/)?.[0]?.toUpperCase() ?? '—'}`
    : style === 'meaning'
      ? `${item.question}\n日本語の意味を入力してください。`
      : questionText

  const submit = () => {
    if (outcome !== null) return
    const input = valueRef.current
    const accepted = item.acceptedAnswers ?? []
    const ok = style === 'spelling'
      ? spellingVariants(targetAnswer).some((answer) => isSpellingCorrect(input, answer))
      : style === 'meaning'
        ? isMeaningCorrect(input, targetAnswer)
        : isMath
          ? isMathCorrect(input, targetAnswer, accepted)
          : isSpellingCorrect(input, targetAnswer, accepted)
    setOutcome(ok ? 'ok' : 'ng')
  }

  useEffect(() => {
    if (outcome === null) return
    const timer = setTimeout(() => onAnswer(outcome === 'ok'), outcome === 'ok' ? ADVANCE_OK_MS : ADVANCE_NG_MS)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outcome])

  return (
    <div className="input-stage">
      {combo >= 2 ? <div className="combo-badge">{combo} れんぞく正解中！</div> : null}

      <div className="choice-question-card">
        <span className="flashcard-section">{sectionLabel}</span>
        <p className="choice-question">
          <RichText text={prompt} />
        </p>
      </div>

      <div className={`input-answer-card ${outcome === 'ok' ? 'is-correct' : outcome === 'ng' ? 'is-wrong' : ''}`}>
        {isMath ? (
          <MathField
            onChange={(latex) => {
              valueRef.current = latex
              setValue(latex)
            }}
            onSubmit={submit}
            disabled={outcome !== null}
          />
        ) : (
          <input
            className="spelling-input"
            type="text"
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="off"
            spellCheck={false}
            placeholder="答えを入力"
            value={value}
            disabled={outcome !== null}
            onChange={(e) => {
              valueRef.current = e.target.value
              setValue(e.target.value)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit()
            }}
          />
        )}

        {outcome === null ? (
          <button type="button" className="btn btn-primary input-submit" onClick={submit} disabled={value.trim() === ''}>
            答え合わせ（Enter）
          </button>
        ) : (
          <div className="input-result">
            <p className={`typing-outcome ${outcome === 'ok' ? 'is-ok' : 'is-ng'}`}>
              {outcome === 'ok' ? '正解！' : 'ざんねん…'}
            </p>
            <p className="input-correct-answer">
              正解: <RichText text={targetAnswer} />
            </p>
            {item.explanation ? (
              <p className="input-explanation">
                <RichText text={item.explanation} />
              </p>
            ) : null}
          </div>
        )}
      </div>

      {isMath && outcome === null ? (
        <p className="typing-hint">
          「/」で分数、「^」で2乗などが入力できます。矢印キーで分子・分母を移動
        </p>
      ) : null}
    </div>
  )
}
