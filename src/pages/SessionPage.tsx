import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useDeck } from '../data/hooks'
import { displayQuestion } from '../data/refs'
import type { Deck, DeckItem } from '../data/schema'
import { shuffled } from '../lib/shuffle'
import { dueItemIds } from '../srs/sm2'
import FlashcardSession from '../modes/flashcard/FlashcardSession'
import ChoiceSession from '../modes/choice/ChoiceSession'
import TestSession from '../modes/test/TestSession'
import TypingSession from '../modes/typing/TypingSession'
import ResultView from '../modes/ResultView'
import { useProgress, weakItemIds } from '../store/progress'

export interface AnswerResult {
  item: DeckItem
  ok: boolean
}

interface QueueFilter {
  unit: string | null
  section: string | null
  weakOnly: boolean
  dueOnly: boolean
  random: boolean
  needsReading: boolean
}

function buildQueue(deck: Deck, deckId: string, filter: QueueFilter): DeckItem[] {
  const { itemStats, srs } = useProgress.getState()
  const weak = weakItemIds(itemStats[deckId])
  const due = dueItemIds(srs[deckId])
  const inRange = deck.items
    .filter((i) => !filter.unit || i.unit === filter.unit)
    .filter((i) => !filter.section || i.section === filter.section)
    .filter((i) => !filter.weakOnly || weak.has(i.id))
    .filter((i) => !filter.dueOnly || due.has(i.id))
    .filter((i) => !filter.needsReading || Boolean(i.reading))
  return filter.random ? shuffled(inRange) : inRange
}

function buildOptions(item: DeckItem, deck: Deck): string[] {
  const sameSection = deck.items
    .filter((i) => i.section === item.section && i.answer !== item.answer)
    .map((i) => i.answer)
  const others = deck.items
    .filter((i) => i.section !== item.section && i.answer !== item.answer)
    .map((i) => i.answer)
  const pool = [...new Set([...shuffled(sameSection), ...shuffled(others)])]
  return shuffled([item.answer, ...pool.slice(0, 3)])
}

function sectionLabel(item: DeckItem): string {
  return [item.unit, item.section].filter(Boolean).join('｜')
}

export default function SessionPage() {
  const { deckId = '', mode = '' } = useParams()
  const [params] = useSearchParams()
  const { data: deck, error } = useDeck(deckId)

  const recordAnswer = useProgress((s) => s.recordAnswer)
  const recordSession = useProgress((s) => s.recordSession)

  const [round, setRound] = useState(0)
  const [results, setResults] = useState<AnswerResult[]>([])

  const filter: QueueFilter = {
    unit: params.get('unit'),
    section: params.get('section'),
    weakOnly: params.get('weak') === '1',
    dueOnly: params.get('due') === '1',
    random: params.get('order') === 'random' || mode === 'test' || mode === 'typing',
    needsReading: mode === 'typing',
  }

  // にがて/要復習の集合はセッション開始時点のスナップショットで固定する
  // （解答のたびにキューが変わると出題が壊れるため round でのみ再計算）
  const queue = useMemo(() => {
    if (!deck) return []
    return buildQueue(deck, deckId, filter)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deck, deckId, params.toString(), mode, round])

  const optionsByItem = useMemo(() => {
    if (!deck || (mode !== 'choice' && mode !== 'test')) return new Map<string, string[]>()
    return new Map(queue.map((item) => [item.id, buildOptions(item, deck)]))
  }, [deck, queue, mode])

  const index = results.length
  const current = queue[index]
  const finished = queue.length > 0 && index >= queue.length
  const correctCount = results.filter((r) => r.ok).length
  // シャッフル時・抽出時は前問参照が成立しないので答えをインライン展開する
  const expandRefs = filter.random || filter.weakOnly || filter.dueOnly || mode !== 'flashcard'

  useEffect(() => {
    if (finished && deck) {
      recordSession({
        deckId: deck.id,
        mode,
        at: new Date().toISOString(),
        total: queue.length,
        correct: correctCount,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished])

  const handleAnswer = (item: DeckItem, ok: boolean) => {
    recordAnswer(deckId, item.id, ok ? 'good' : 'again')
    setResults((prev) => [...prev, { item, ok }])
  }

  const handleExpire = () => {
    // 時間切れ: 残り問題はすべて不正解として記録する
    setResults((prev) => {
      const rest = queue.slice(prev.length)
      for (const item of rest) recordAnswer(deckId, item.id, 'again')
      return [...prev, ...rest.map((item) => ({ item, ok: false }))]
    })
  }

  const retry = () => {
    setResults([])
    setRound((r) => r + 1)
  }

  if (error) {
    return (
      <div className="page">
        <div className="page-body">
          <p className="notice-error">{error}</p>
          <Link to="/" className="btn">ホームへ</Link>
        </div>
      </div>
    )
  }
  if (!deck) {
    return (
      <div className="page">
        <div className="page-body">
          <p className="notice-loading">よみこみ中…</p>
        </div>
      </div>
    )
  }
  if (queue.length === 0) {
    return (
      <div className="page" data-theme={deck.subject}>
        <div className="page-body">
          <p className="notice-error">出題できる問題がありません。</p>
          <Link to={`/deck/${deck.id}`} className="btn">もどる</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="page session" data-theme={deck.subject}>
      <div className="page-body">
        <header className="session-head">
          <Link to={`/deck/${deck.id}`} className="session-close" aria-label="やめる">
            ✕
          </Link>
          <div
            className="session-progress"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={queue.length}
            aria-valuenow={Math.min(index, queue.length)}
          >
            <div
              className="session-progress-fill"
              style={{ width: `${(Math.min(index, queue.length) / queue.length) * 100}%` }}
            />
          </div>
          <span className="session-count">
            {Math.min(index + 1, queue.length)} / {queue.length}
          </span>
        </header>

        {finished ? (
          <ResultView deck={deck} results={results} onRetry={retry} expandRefs={expandRefs} />
        ) : mode === 'flashcard' ? (
          <FlashcardSession
            key={current.id}
            item={current}
            questionText={displayQuestion(current, deck, expandRefs)}
            sectionLabel={sectionLabel(current)}
            onGrade={(grade) => {
              recordAnswer(deckId, current.id, grade)
              setResults((prev) => [...prev, { item: current, ok: grade === 'good' }])
            }}
          />
        ) : mode === 'choice' ? (
          <ChoiceSession
            key={current.id}
            item={current}
            questionText={displayQuestion(current, deck, expandRefs)}
            sectionLabel={sectionLabel(current)}
            options={optionsByItem.get(current.id) ?? []}
            combo={countTrailingCorrect(results)}
            onAnswer={(ok) => handleAnswer(current, ok)}
          />
        ) : mode === 'test' ? (
          <TestSession
            deck={deck}
            queue={queue}
            optionsByItem={optionsByItem}
            index={index}
            onAnswer={handleAnswer}
            onExpire={handleExpire}
          />
        ) : mode === 'typing' ? (
          <TypingSession
            key={current.id}
            item={current}
            questionText={displayQuestion(current, deck, true)}
            combo={countTrailingCorrect(results)}
            onAnswer={(ok) => handleAnswer(current, ok)}
          />
        ) : (
          <p className="notice-error">このモードはまだ準備中です。</p>
        )}
      </div>
    </div>
  )
}

function countTrailingCorrect(results: AnswerResult[]): number {
  let combo = 0
  for (let i = results.length - 1; i >= 0; i -= 1) {
    if (!results[i].ok) break
    combo += 1
  }
  return combo
}
