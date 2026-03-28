import { useState, useRef, useCallback, useEffect } from 'react'

/** Chrome / Edge / some Android WebViews — not Firefox/Safari desktop */
export function speechRecognitionAvailable() {
  if (typeof window === 'undefined') return false
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition)
}

/**
 * Minimal hook: tap to start, tap to stop. Final + interim text for display.
 * Change `rec.lang` here if you want a different locale (e.g. en-US).
 */
export function useSpeechRecognition() {
  const [isRecording, setIsRecording] = useState(false)
  const [finalText, setFinalText] = useState('')
  const [interimText, setInterimText] = useState('')
  const [error, setError] = useState(null)
  const recRef = useRef(null)

  const stop = useCallback(() => {
    try {
      recRef.current?.stop()
    } catch {
      /* ignore */
    }
    recRef.current = null
    setIsRecording(false)
    setInterimText('')
  }, [])

  const start = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) {
      setError('Speech recognition not supported in this browser.')
      return
    }

    setError(null)
    setInterimText('')

    const rec = new SR()
    rec.continuous = true
    rec.interimResults = true
    rec.lang = 'en-CA'

    rec.onresult = (event) => {
      let interim = ''
      let finals = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i]
        const piece = r[0]?.transcript ?? ''
        if (r.isFinal) finals += piece
        else interim += piece
      }
      if (finals) {
        setFinalText((prev) => `${prev}${finals}`.trim() + (finals.endsWith(' ') ? '' : ' '))
      }
      setInterimText(interim)
    }

    rec.onerror = (e) => {
      setError(e.error || 'speech error')
      setIsRecording(false)
      setInterimText('')
    }

    rec.onend = () => {
      setIsRecording(false)
      setInterimText('')
      recRef.current = null
    }

    recRef.current = rec
    rec.start()
    setIsRecording(true)
  }, [])

  const toggle = useCallback(() => {
    if (isRecording) stop()
    else start()
  }, [isRecording, start, stop])

  const clearTranscript = useCallback(() => {
    setFinalText('')
    setInterimText('')
  }, [])

  useEffect(() => () => stop(), [stop])

  return {
    isRecording,
    finalText,
    interimText,
    error,
    start,
    stop,
    toggle,
    clearTranscript,
    supported: speechRecognitionAvailable(),
  }
}
