import { Route, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage'
import SubjectPage from './pages/SubjectPage'
import DeckPage from './pages/DeckPage'
import SessionPage from './pages/SessionPage'
import ReviewPage from './pages/ReviewPage'
import StatsPage from './pages/StatsPage'
import SettingsPage from './pages/SettingsPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/subject/:subjectId" element={<SubjectPage />} />
      <Route path="/deck/:deckId" element={<DeckPage />} />
      <Route path="/play/:deckId/:mode" element={<SessionPage />} />
      <Route path="/review" element={<ReviewPage />} />
      <Route path="/stats" element={<StatsPage />} />
      <Route path="/settings" element={<SettingsPage />} />
    </Routes>
  )
}
