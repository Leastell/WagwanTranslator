import { useState, useEffect } from 'react'
import { translateTranscript } from './lib/translate.js'
import { useSpeechRecognition } from './lib/useSpeechRecognition.js'
import './App.css'

export default function App() {
  const {
    isRecording,
    finalText,
    interimText,
    error,
    toggle,
    clearTranscript,
    supported,
  } = useSpeechRecognition()

  const [direction, setDirection] = useDirection()

  const rawDisplay = `${finalText}${interimText}`.trim()
  const translation = translateTranscript(rawDisplay, direction)

  return (
    <div className="app">
      <header className="header">
        <h1 className="title">WagwanTranslator</h1>
        <p className="subtitle">Mic → transcript → your translation (plug in `translate.js`)</p>
      </header>

      <section className="direction" aria-label="Translation direction">
        <button
          type="button"
          className={direction === 'from-toronto' ? 'chip active' : 'chip'}
          onClick={() => setDirection('from-toronto')}
        >
          From Toronto slang
        </button>
        <button
          type="button"
          className={direction === 'to-toronto' ? 'chip active' : 'chip'}
          onClick={() => setDirection('to-toronto')}
        >
          To Toronto slang
        </button>
      </section>

      <div className="mic-wrap">
        <button
          type="button"
          className={`mic ${isRecording ? 'recording' : ''}`}
          onClick={toggle}
          disabled={!supported}
          aria-pressed={isRecording}
          aria-label={isRecording ? 'Stop recording' : 'Start recording'}
        >
          <span className="mic-icon" aria-hidden>
            {isRecording ? '■' : '🎤'}
          </span>
        </button>
        <p className="mic-hint">
          {supported
            ? isRecording
              ? 'Tap to stop'
              : 'Tap to talk'
            : 'Need Chrome (or Chromium WebView) for speech'}
        </p>
      </div>

      {error ? <p className="error">{error}</p> : null}

      <section className="panel">
        <div className="panel-head">
          <h2>Transcript</h2>
          <button type="button" className="linkish" onClick={clearTranscript}>
            Clear
          </button>
        </div>
        <p className="transcript">
          {finalText || interimText ? (
            <>
              {finalText}
              {interimText ? <span className="interim">{interimText}</span> : null}
            </>
          ) : (
            <span className="placeholder">Your words show up here…</span>
          )}
        </p>
      </section>

      <section className="panel translation-panel">
        <h2>Translation</h2>
        <p className="translation">
          {rawDisplay ? (
            translation
          ) : (
            <span className="placeholder">Implement in `src/lib/translate.js`</span>
          )}
        </p>
      </section>
    </div>
  )
}

function useDirection() {
  const [direction, setDirection] = useState(() => {
    try {
      const v = localStorage.getItem('wagwan-direction')
      if (v === 'to-toronto' || v === 'from-toronto') return v
    } catch {
      /* ignore */
    }
    return 'from-toronto'
  })

  useEffect(() => {
    try {
      localStorage.setItem('wagwan-direction', direction)
    } catch {
      /* ignore */
    }
  }, [direction])

  return [direction, setDirection]
}
