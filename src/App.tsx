import { Route, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage'
import SubjectPage from './pages/SubjectPage'
import DeckPage from './pages/DeckPage'
import SessionPage from './pages/SessionPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/subject/:subjectId" element={<SubjectPage />} />
      <Route path="/deck/:deckId" element={<DeckPage />} />
      <Route path="/play/:deckId/:mode" element={<SessionPage />} />
    </Routes>
  )
}
