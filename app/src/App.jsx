import { useState, useCallback, useEffect, useRef } from 'react'
import { Loader2, Mic, Square, Volume2 } from 'lucide-react'
import { translateVoice } from './lib/api.js'
import { useAudioRecorder } from './lib/useAudioRecorder.js'
import './App.css'

/** @typedef {'oxford-to-toronto' | 'toronto-to-oxford'} VoiceDirection */

const DIRECTION_STORAGE = 'wagwan-voice-direction'

// Fake visitor count that increases
const getVisitorCount = () => {
  const base = 1337420
  const now = Date.now()
  const hoursSinceEpoch = Math.floor(now / (1000 * 60 * 60))
  return base + (hoursSinceEpoch % 9999)
}

export default function App() {
  const {
    isRecording,
    error: recorderError,
    setError,
    supported,
    start,
    stopRecording,
    extensionForBlob,
  } = useAudioRecorder()

  const [direction, setDirection] = useState(() => readDirection())
  const [loading, setLoading] = useState(false)
  const [requestError, setRequestError] = useState(null)
  const [audioUrl, setAudioUrl] = useState(null)
  const [visitorCount] = useState(getVisitorCount)

  const audioRef = useRef(null)
  const prevUrlRef = useRef(null)

  useEffect(() => {
    try {
      localStorage.setItem(DIRECTION_STORAGE, direction)
    } catch {
      /* ignore */
    }
  }, [direction])

  useEffect(
    () => () => {
      if (prevUrlRef.current) {
        URL.revokeObjectURL(prevUrlRef.current)
        prevUrlRef.current = null
      }
    },
    [],
  )

  useEffect(() => {
    if (!audioUrl) return
    const el = audioRef.current
    if (!el) return
    el.play().catch(() => {
      /* autoplay policy — user can use controls */
    })
  }, [audioUrl])

  const error = recorderError || requestError

  const onMicClick = useCallback(async () => {
    setRequestError(null)
    setError(null)

    if (isRecording) {
      setLoading(true)
      try {
        const blob = await stopRecording()
        if (!blob || blob.size === 0) {
          setRequestError('No audio captured. Try again.')
          return
        }
        const outBlob = await translateVoice(
          blob,
          direction,
          `recording.${extensionForBlob(blob)}`,
        )
        if (prevUrlRef.current) {
          URL.revokeObjectURL(prevUrlRef.current)
        }
        const url = URL.createObjectURL(outBlob)
        prevUrlRef.current = url
        setAudioUrl(url)
      } catch (e) {
        setRequestError(e?.message || String(e))
      } finally {
        setLoading(false)
      }
      return
    }

    await start()
  }, [
    isRecording,
    start,
    stopRecording,
    setError,
    extensionForBlob,
    direction,
  ])

  const micDisabled = !supported || loading

  return (
    <>
      {/* Marquee Banner */}
      <div className="marquee-container">
        <span className="marquee-text">
          *** WELCOME TO WAGWAN TRANSLATOR *** Toronto's #1 Slang Translation Service Since 1999 ***
          Now with VOICE CLONING technology!!! *** Powered by Cohere AI & Mistral ***
          You are visitor #{visitorCount}!!! *** BOOKMARK THIS PAGE!!! ***
        </span>
      </div>

      <div className="app">
        <header className="header">
          <div className="header-images">
            <img src="/cn-tower-clipart.webp" alt="CN Tower" className="cn-tower" />
            <span className="maple-leaf" role="img" aria-label="maple leaf">🍁</span>
            <span style={{ fontSize: '4rem' }}>🏙️</span>
            <span className="maple-leaf" role="img" aria-label="maple leaf">🍁</span>
            <img src="/cn-tower-clipart.webp" alt="CN Tower" className="cn-tower" />
          </div>
          <h1 className="title">WagwanTranslator</h1>
          <p className="subtitle">
            <span className="blink">***</span> Toronto Slang ↔ Oxford English <span className="blink">***</span>
          </p>
          <p className="subtitle">
            <span className="fire-emoji">🔥</span> Voice Cloning Technology <span className="fire-emoji">🔥</span>
          </p>
        </header>

        <div className="raptors-section">
          <img src="/drake.webp" alt="Started from the bottom" className="drake-img" />
          <div className="raptors-row">
            <span style={{ fontSize: '2rem' }}>🦖</span>
            <span className="raptors-text"> WE THE NORTH </span>
            <span style={{ fontSize: '2rem' }}>🦖</span>
          </div>
        </div>

        <section className="direction" aria-label="Translation direction">
          <button
            type="button"
            className={direction === 'oxford-to-toronto' ? 'chip active' : 'chip'}
            onClick={() => setDirection('oxford-to-toronto')}
          >
            🎩 Oxford → Toronto 🍁
          </button>
          <button
            type="button"
            className={direction === 'toronto-to-oxford' ? 'chip active' : 'chip'}
            onClick={() => setDirection('toronto-to-oxford')}
          >
            🍁 Toronto → Oxford 🎩
          </button>
        </section>

        <div className="mic-wrap">
          <button
            type="button"
            className={`mic ${isRecording ? 'recording' : ''}`}
            onClick={onMicClick}
            disabled={micDisabled}
            aria-busy={loading}
            aria-pressed={isRecording}
            aria-label={isRecording ? 'Stop and send' : 'Start recording'}
          >
            <span className="mic-icon-wrap" aria-hidden>
              {loading ? (
                <Loader2 className="mic-icon mic-icon--spin" size={36} strokeWidth={2} />
              ) : isRecording ? (
                <Square className="mic-icon mic-icon--stop" size={28} fill="currentColor" strokeWidth={0} />
              ) : (
                <Mic className="mic-icon" size={36} strokeWidth={2} />
              )}
            </span>
          </button>
          <p className="mic-hint">
            {!supported
              ? '❌ Microphone not available'
              : loading
                ? '⏳ Processing... please wait fam'
                : isRecording
                  ? '🔴 Recording... tap to stop & send!'
                  : direction === 'oxford-to-toronto'
                    ? '🎤 Click to speak proper English, innit'
                    : '🎤 Click to speak Toronto ting, styll'}
          </p>
        </div>

        {error ? <p className="error">⚠️ ERROR: {error}</p> : null}

        <section className="panel output-panel">
          <div className="panel-head">
            <h2>
              <Volume2 className="panel-icon" size={16} strokeWidth={2} aria-hidden />
              🔊 Output Audio
            </h2>
          </div>
          {audioUrl ? (
            <audio ref={audioRef} className="audio-out" controls src={audioUrl}>
              <a href={audioUrl}>Download audio</a>
            </audio>
          ) : (
            <p className="placeholder">
              🎧 Your translated audio will appear here, say less!
            </p>
          )}
        </section>

        <footer className="footer">
          <img
            className="construction-gif"
            src="https://web.archive.org/web/20090830082356/http://geocities.com/SoHo/7373/construction.gif"
            alt="Under Construction"
          />
          <p style={{ color: '#FFFF00', margin: '0.5rem 0' }}>
            🚧 Site Under Construction 🚧
          </p>
          <div className="visitor-counter">
            VISITORS: {visitorCount.toLocaleString()}
          </div>
          <div className="footer-links">
            <span style={{ color: '#FF00FF' }}>
              Best viewed with Netscape Navigator 4.0
            </span>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#00FFFF', marginTop: '0.5rem' }}>
            © 1999-2026 WagwanTranslator Inc. | Made with ❤️ in the 6ix
          </p>
          <p style={{ fontSize: '0.7rem', color: '#808080' }}>
            Powered by Cohere AI & Mistral | No cap, this site is blessed fam 🙏
          </p>
        </footer>
      </div>
    </>
  )
}

function readDirection() {
  try {
    const v = localStorage.getItem(DIRECTION_STORAGE)
    if (v === 'oxford-to-toronto' || v === 'toronto-to-oxford') return v
  } catch {
    /* ignore */
  }
  return 'toronto-to-oxford'
}
