import { useRef, useState } from 'react'
import TopBar from '../components/TopBar'
import { toDayKey, useProgress } from '../store/progress'
import type { ProgressData } from '../store/progress'

function isProgressData(value: unknown): value is ProgressData {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return (
    typeof v.itemStats === 'object' && v.itemStats !== null &&
    typeof v.srs === 'object' && v.srs !== null &&
    Array.isArray(v.sessions)
  )
}

export default function SettingsPage() {
  const { itemStats, srs, sessions, importData, resetAll } = useProgress()
  const fileRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<string | null>(null)

  const exportData = () => {
    const data: ProgressData = { itemStats, srs, sessions }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `studyquest-backup-${toDayKey(new Date())}.json`
    a.click()
    URL.revokeObjectURL(url)
    setMessage('バックアップを書き出しました。')
  }

  const importFile = async (file: File) => {
    try {
      const parsed: unknown = JSON.parse(await file.text())
      if (!isProgressData(parsed)) throw new Error('形式が違います')
      importData(parsed)
      setMessage('学習データを読み込みました。')
    } catch (error) {
      console.error('import failed:', error)
      setMessage('読み込めませんでした。StudyQuestのバックアップファイルか確認してください。')
    }
  }

  const reset = () => {
    if (window.confirm('学習データをすべて消します。この操作はもとにもどせません。よろしいですか？')) {
      resetAll()
      setMessage('学習データをリセットしました。')
    }
  }

  return (
    <div className="page">
      <div className="page-body">
        <TopBar backTo="/" backLabel="ホーム" title="せってい" />

        <section className="panel">
          <h2 className="panel-label">学習データ</h2>
          <p className="settings-note">
            学習の記録はこの端末（ブラウザ）の中にだけ保存されます。べつの端末へ引っこすときは、
            ここで書き出したファイルを新しい端末で読み込んでください。
          </p>
          <div className="settings-actions">
            <button type="button" className="btn btn-primary" onClick={exportData}>
              バックアップを書き出す
            </button>
            <button type="button" className="btn" onClick={() => fileRef.current?.click()}>
              バックアップを読み込む
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) void importFile(file)
                e.target.value = ''
              }}
            />
          </div>
        </section>

        <section className="panel">
          <h2 className="panel-label">危険な操作</h2>
          <button type="button" className="btn btn-danger" onClick={reset}>
            学習データをすべてリセット
          </button>
        </section>

        {message ? <p className="settings-message">{message}</p> : null}
      </div>
    </div>
  )
}
