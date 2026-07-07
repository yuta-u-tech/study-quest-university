import { useEffect, useMemo, useRef, useState } from 'react'
import type { DeckItem } from '../../data/schema'
import { createChallenge } from '../../typing/romaji'

export type TypingStyle = 'copy' | 'recall'

interface TypingSessionProps {
  item: DeckItem
  questionText: string
  combo: number
  style: TypingStyle
  onAnswer: (ok: boolean) => void
}

const BASE_MS = 5000
const MS_PER_KANA = 1100
const RECALL_BASE_MS = 10000
const RECALL_MS_PER_KANA = 1400
const HINT_AFTER_MISSES = 3

export default function TypingSession({
  item,
  questionText,
  combo,
  style,
  onAnswer,
}: TypingSessionProps) {
  const reading = item.reading ?? ''
  const challenge = useMemo(() => createChallenge(reading), [reading])
  const [typed, setTyped] = useState('')
  const [missFlash, setMissFlash] = useState(false)
  const [misses, setMisses] = useState(0)
  const [hintRequested, setHintRequested] = useState(false)
  const limit =
    style === 'recall'
      ? RECALL_BASE_MS + reading.length * RECALL_MS_PER_KANA
      : BASE_MS + reading.length * MS_PER_KANA
  const [remaining, setRemaining] = useState(limit)
  const doneRef = useRef(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const revealed = style === 'copy' || hintRequested || misses >= HINT_AFTER_MISSES

  const finish = (ok: boolean) => {
    if (doneRef.current) return
    doneRef.current = true
    onAnswer(ok)
  }

  useEffect(() => {
    const start = Date.now()
    const timer = setInterval(() => {
      const left = limit - (Date.now() - start)
      setRemaining(left)
      if (left <= 0) {
        clearInterval(timer)
        finish(false)
      }
    }, 100)
    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleKey = (key: string) => {
    if (doneRef.current) return
    if (!/^[a-z-]$/.test(key)) return
    const result = challenge.type(key)
    setTyped(challenge.typed())
    if (result === 'miss') {
      setMisses((m) => m + 1)
      setMissFlash(true)
      setTimeout(() => setMissFlash(false), 160)
    }
    if (challenge.isDone()) finish(true)
  }

  return (
    <div
      className="typing-stage"
      onClick={() => inputRef.current?.focus()}
      role="presentation"
    >
      {combo >= 2 ? <div className="combo-badge">{combo} れんぞく成功！</div> : null}

      <div className="test-timer">
        <div className="test-timer-bar">
          <div
            className="test-timer-fill"
            style={{ width: `${Math.max(0, (remaining / limit) * 100)}%` }}
          />
        </div>
      </div>

      <p className={`typing-question ${style === 'recall' ? 'is-main' : ''}`}>{questionText}</p>

      <div className={`typing-card ${missFlash ? 'is-miss' : ''}`}>
        {revealed ? (
          <>
            <p className="typing-answer">{item.answer}</p>
            <p className="typing-reading">{reading}</p>
          </>
        ) : (
          <p className="typing-answer typing-answer-hidden" aria-label="答えは非表示">
            {'？'.repeat(Math.max(2, reading.length))}
          </p>
        )}
        <p className="typing-romaji">
          <span className="typing-romaji-done">{typed}</span>
          {revealed ? <span className="typing-romaji-rest">{challenge.remaining()}</span> : null}
        </p>
        {!revealed ? (
          <button
            type="button"
            className="typing-hint-btn"
            onClick={(e) => {
              e.stopPropagation()
              setHintRequested(true)
              inputRef.current?.focus()
            }}
          >
            ヒントを見る
          </button>
        ) : null}
      </div>

      <input
        ref={inputRef}
        className="typing-input"
        autoCapitalize="none"
        autoCorrect="off"
        autoComplete="off"
        aria-label="ローマ字入力"
        value=""
        onChange={() => {}}
        onKeyDown={(e) => {
          if (e.key.length === 1) {
            e.preventDefault()
            handleKey(e.key.toLowerCase())
          }
        }}
      />
      <p className="typing-hint">
        {style === 'recall'
          ? '問題の答えを思い出して、読みをローマ字入力（ミス3回でヒント表示）'
          : 'キーボードで答えの読みをローマ字入力（時間切れに注意！）'}
      </p>
    </div>
  )
}
