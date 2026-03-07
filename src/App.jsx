import { useState, useEffect } from 'react'
import { getRandomVerse } from './verses'
import './App.css'

function App() {
  const [verse, setVerse] = useState(null)
  const [loading, setLoading] = useState(true)

  const showNewVerse = () => {
    setLoading(true)
    setVerse(getRandomVerse())
    setLoading(false)
  }

  useEffect(() => {
    setVerse(getRandomVerse())
    setLoading(false)
  }, [])

  return (
    <div className="app">
      <main className="verse-card">
        {loading ? (
          <p className="verse-text">...</p>
        ) : verse ? (
          <>
            <blockquote className="verse-text">"{verse.text}"</blockquote>
            <cite className="verse-reference">— {verse.reference}</cite>
            <button type="button" className="new-verse-btn" onClick={showNewVerse}>
              Another verse
            </button>
          </>
        ) : null}
      </main>
    </div>
  )
}

export default App
