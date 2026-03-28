import { useState, useCallback } from 'react'
import { Loader2, Mic, Square } from 'lucide-react'
import { translateEnglishAudioToToronto } from './lib/api.js'
import { useAudioRecorder } from './lib/useAudioRecorder.js'
import './App.css'

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

  const [translation, setTranslation] = useState('')
  const [loading, setLoading] = useState(false)
  const [requestError, setRequestError] = useState(null)

  const error = recorderError || requestError

  const onMicClick = useCallback(async () => {
    setRequestError(null)
    setError(null)

    if (isRecording) {
      setLoading(true)
      try {
        const blob = await stopRecording()
        if (!blob || blob.size === 0) {
          setTranslation('')
          setRequestError('No audio captured. Try again.')
          return
        }
        const { translation: text } = await translateEnglishAudioToToronto(
          blob,
          `recording.${extensionForBlob(blob)}`,
        )
        setTranslation(text)
      } catch (e) {
        setTranslation('')
        setRequestError(e?.message || String(e))
      } finally {
        setLoading(false)
      }
      return
    }

    setTranslation('')
    await start()
  }, [
    isRecording,
    start,
    stopRecording,
    setError,
    extensionForBlob,
  ])

  const micDisabled = !supported || loading

  return (
    <div className="app">
      <header className="header">
        <h1 className="title">WagwanTranslator</h1>
        <p className="subtitle">
          English speech → Python backend → Toronto-style text (Cohere in{' '}
          <code>server/cohere_translate.py</code>)
        </p>
      </header>

      <p className="mode-pill">Mode: English → Toronto</p>

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
              ? 'Sending audio…'
              : isRecording
                ? 'Tap to stop & translate'
                : 'Tap to record (speak English)'}
        </p>
      </div>

      {error ? <p className="error">{error}</p> : null}

      <section className="panel translation-panel">
        <h2>Translation</h2>
        <p className="translation">
          {translation ? (
            translation
          ) : (
            <span className="placeholder">
              Your Toronto-style line appears here after you stop recording.
            </span>
          )}
        </p>
      </section>
    </div>
  )
}
