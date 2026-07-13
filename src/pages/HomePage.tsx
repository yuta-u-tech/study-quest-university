import { Link } from 'react-router-dom'
import { useManifest } from '../data/hooks'
import type { SubjectInfo } from '../data/schema'
import { dueItemIds } from '../srs/sm2'
import { streakDays, useProgress } from '../store/progress'

function SocialScene() {
  return (
    <svg className="scene-svg" viewBox="0 0 200 90" aria-hidden="true">
      <rect width="200" height="90" fill="#F4EDDC" />
      <rect width="200" height="26" fill="url(#sqSky)" />
      <defs>
        <linearGradient id="sqSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0D3060" stopOpacity="0.9" />
          <stop offset="1" stopColor="#0D3060" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M92 62 L128 18 L136 27 L142 21 L172 62 Z" fill="#17497E" />
      <path d="M124 23 L128 18 L136 27 L142 21 L147 28 L140 34 L133 28 Z" fill="#FBF6E8" />
      {[0, 40, 80, 120, 160].map((x) => (
        <g key={x} fill="none" stroke="#5E8FBC" strokeWidth="2">
          <circle cx={x + 20} cy={92} r="18" />
          <circle cx={x + 20} cy={92} r="12" />
          <circle cx={x + 20} cy={92} r="6" />
        </g>
      ))}
      <rect x="10" y="12" width="14" height="46" fill="#B23A34" stroke="#0D3060" strokeWidth="1.5" />
      <text x="17" y="20" fill="#FBF3E2" fontSize="9" writingMode="tb" letterSpacing="2">
        社会
      </text>
    </svg>
  )
}

function subjectPath(subject: SubjectInfo): string {
  return `/subject/${subject.id}`
}

export default function HomePage() {
  const { data: manifest, error } = useManifest()
  const srs = useProgress((s) => s.srs)
  const sessions = useProgress((s) => s.sessions)

  const dueTotal = Object.values(srs).reduce((sum, deckSrs) => sum + dueItemIds(deckSrs).size, 0)
  const streak = streakDays(sessions)

  return (
    <div className="home">
      <header className="home-hero">
        <p className="home-logo">StudyQuest</p>
        <h1 className="home-title">大学の学びを、クエストに。</h1>
        <p className="home-sub">授業・専門・資格・研究スキルを、短いセッションで着実に身につけよう</p>
        {streak > 0 ? <p className="home-streak">🔥 {streak}日連続で学習中</p> : null}
      </header>

      {dueTotal > 0 ? (
        <Link to="/review" className="review-banner">
          <span className="review-banner-label">今日の復習</span>
          <span className="review-banner-count">{dueTotal}問</span>
          <span className="review-banner-go">はじめる →</span>
        </Link>
      ) : null}

      {error ? <p className="notice-error">{error}</p> : null}
      {!manifest && !error ? <p className="notice-loading">よみこみ中…</p> : null}

      {manifest ? (
        <main className="world-grid">
          {manifest.subjects.map((subject) => {
            const inner = (
              <>
                <div className={`world-scene world-scene-${subject.id}`}>
                  {subject.id === 'social' ? <SocialScene /> : null}
                </div>
                <div className="world-meta">
                  <span className="world-name">{subject.name}</span>
                  <span className="world-tagline">{subject.tagline}</span>
                </div>
                <span className={`world-badge ${subject.available ? 'is-open' : ''}`}>
                  {subject.available ? '入る →' : '準備中'}
                </span>
              </>
            )
            return subject.available ? (
              <Link key={subject.id} to={subjectPath(subject)} className={`world-card world-${subject.id}`}>
                {inner}
              </Link>
            ) : (
              <div key={subject.id} className={`world-card world-${subject.id} is-locked`}>
                {inner}
              </div>
            )
          })}
        </main>
      ) : null}

      <nav className="home-nav">
        <Link to="/review" className="home-nav-link">今日の復習</Link>
        <Link to="/stats" className="home-nav-link">学習ログ</Link>
        <Link to="/settings" className="home-nav-link">設定</Link>
      </nav>
      <footer className="home-footer">StudyQuest University — 学習の記録はこの端末の中にだけ保存されます</footer>
    </div>
  )
}
