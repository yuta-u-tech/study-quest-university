import { Link } from 'react-router-dom'
import { useManifest } from '../data/hooks'
import type { SubjectInfo } from '../data/schema'

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

  return (
    <div className="home">
      <header className="home-hero">
        <p className="home-logo">StudyQuest</p>
        <h1 className="home-title">学びの世界を、えらぼう。</h1>
        <p className="home-sub">科目ごとにちがう世界で、一問一答・クイズに挑戦しよう</p>
      </header>

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

      <footer className="home-footer">StudyQuest — 学習の記録はこの端末の中にだけ保存されます</footer>
    </div>
  )
}
