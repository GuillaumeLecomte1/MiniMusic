import { Routes, Route, Link } from 'react-router-dom'
import ApiKeyConfig from './components/ApiKeyConfig'
import LyricsGenerator from './components/LyricsGenerator'
import MusicGenerator from './components/MusicGenerator'
import CoverGenerator from './components/CoverGenerator'

function App() {
  return (
    <div className="app">
      <nav className="navbar">
        <h1>MiniMusic</h1>
        <div className="nav-links">
          <Link to="/">Config</Link>
          <Link to="/lyrics">Paroles</Link>
          <Link to="/music">Musique</Link>
          <Link to="/cover">Cover</Link>
        </div>
      </nav>

      <main className="container">
        <Routes>
          <Route path="/" element={<ApiKeyConfig />} />
          <Route path="/lyrics" element={<LyricsGenerator />} />
          <Route path="/music" element={<MusicGenerator />} />
          <Route path="/cover" element={<CoverGenerator />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
