import { useEffect, useMemo, useRef, useState } from 'react'
import type { DeckItem } from '../../data/schema'
import { createChallenge } from '../../typing/romaji'

interface TypingSessionProps {
  item: DeckItem
  questionText: string
  combo: number
  onAnswer: (ok: boolean) => void
}

const BASE_MS = 5000
const MS_PER_KANA = 1100

export default function TypingSession({ item, questionText, combo, onAnswer }: TypingSessionProps) {
  const reading = item.reading ?? ''
  const challenge = useMemo(() => createChallenge(reading), [reading])
  const [typed, setTyped] = useState('')
  const [missFlash, setMissFlash] = useState(false)
  const limit = BASE_MS + reading.length * MS_PER_KANA
  const [remaining, setRemaining] = useState(limit)
  const doneRef = useRef(false)
  const inputRef = useRef<HTMLInputElement>(null)

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

      <p className="typing-question">{questionText}</p>

      <div className={`typing-card ${missFlash ? 'is-miss' : ''}`}>
        <p className="typing-answer">{item.answer}</p>
        <p className="typing-reading">{reading}</p>
        <p className="typing-romaji">
          <span className="typing-romaji-done">{typed}</span>
          <span className="typing-romaji-rest">{challenge.remaining()}</span>
        </p>
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
      <p className="typing-hint">キーボードで答えの読みをローマ字入力（時間切れに注意！）</p>
    </div>
  )
}
