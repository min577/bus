import { Routes, Route, Navigate } from 'react-router-dom'
import TabBar from './components/TabBar.jsx'
import HomePage from './pages/HomePage.jsx'
import PatternPage from './pages/PatternPage.jsx'
import ComparePage from './pages/ComparePage.jsx'

export default function App() {
  return (
    <div className="app">
      <main className="app-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/pattern" element={<PatternPage />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <TabBar />
    </div>
  )
}
