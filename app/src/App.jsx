import { useState, useCallback, useEffect, useRef } from 'react'
import { Loader2, Mic, Square, Volume2 } from 'lucide-react'
import { translateVoice } from './lib/api.js'
import { useAudioRecorder } from './lib/useAudioRecorder.js'
import './App.css'

/** @typedef {'oxford-to-toronto' | 'toronto-to-oxford'} VoiceDirection */

const DIRECTION_STORAGE = 'wagwan-voice-direction'

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
    <div className="app">
      <header className="header">
        <h1 className="title">WagwanTranslator</h1>
        <p className="subtitle">
          Record speech → backend (Cohere transcribe → style → TTS in{' '}
          <code>server/cohere_pipeline.py</code>) → audio plays here.
        </p>
      </header>

      <section className="direction" aria-label="Translation direction">
        <button
          type="button"
          className={direction === 'oxford-to-toronto' ? 'chip active' : 'chip'}
          onClick={() => setDirection('oxford-to-toronto')}
        >
          Oxford → Toronto
        </button>
        <button
          type="button"
          className={direction === 'toronto-to-oxford' ? 'chip active' : 'chip'}
          onClick={() => setDirection('toronto-to-oxford')}
        >
          Toronto → Oxford
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
              <Loader2 className="mic-icon mic-icon--spin" size={28} strokeWidth={2} />
            ) : isRecording ? (
              <Square className="mic-icon mic-icon--stop" size={22} fill="currentColor" strokeWidth={0} />
            ) : (
              <Mic className="mic-icon" size={28} strokeWidth={2} />
            )}
          </span>
        </button>
        <p className="mic-hint">
          {!supported
            ? 'Microphone API not available'
            : loading
              ? 'Processing…'
              : isRecording
                ? 'Tap to stop & send'
                : direction === 'oxford-to-toronto'
                  ? 'Speak Oxford English'
                  : 'Speak Toronto style'}
        </p>
      </div>

      {error ? <p className="error">{error}</p> : null}

      <section className="panel output-panel">
        <div className="panel-head">
          <h2>
            <Volume2 className="panel-icon" size={14} strokeWidth={2} aria-hidden />
            Output audio
          </h2>
        </div>
        {audioUrl ? (
          <audio ref={audioRef} className="audio-out" controls src={audioUrl}>
            <a href={audioUrl}>Download audio</a>
          </audio>
        ) : (
          <p className="placeholder">
            After you stop recording, translated speech plays here (stub WAV until TTS is wired).
          </p>
        )}
      </section>
    </div>
  )
}

function readDirection() {
  try {
    const v = localStorage.getItem(DIRECTION_STORAGE)
    if (v === 'oxford-to-toronto' || v === 'toronto-to-oxford') return v
  } catch {
    /* ignore */
  }
  return 'oxford-to-toronto'
}
