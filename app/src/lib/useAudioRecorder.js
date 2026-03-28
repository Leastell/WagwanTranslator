import { useState, useRef, useCallback, useEffect } from 'react'

function pickMimeType() {
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
  ]
  for (const t of types) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)) {
      return t
    }
  }
  return ''
}

function extensionForBlob(blob) {
  const t = blob.type || ''
  if (t.includes('ogg')) return 'ogg'
  return 'webm'
}

/**
 * Tap to start; use stopRecording() to stop and get a Blob for upload.
 */
export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false)
  const [error, setError] = useState(null)
  const [supported, setSupported] = useState(true)

  const streamRef = useRef(null)
  const recorderRef = useRef(null)
  const chunksRef = useRef([])

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setSupported(false)
    }
  }, [])

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }, [])

  const start = useCallback(async () => {
    setError(null)
    chunksRef.current = []

    if (!supported) {
      setError('Microphone not supported in this browser.')
      return
    }

    let stream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch (e) {
      setError(e?.message || 'Microphone permission denied')
      return
    }

    streamRef.current = stream

    const mimeType = pickMimeType()
    let rec
    try {
      rec = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream)
    } catch (e) {
      stopStream()
      setError(e?.message || 'Could not start MediaRecorder')
      return
    }

    rec.ondataavailable = (ev) => {
      if (ev.data && ev.data.size > 0) chunksRef.current.push(ev.data)
    }

    rec.onerror = (ev) => {
      setError(ev.error?.message || 'Recording error')
      stopStream()
      recorderRef.current = null
      setIsRecording(false)
    }

    recorderRef.current = rec
    rec.start(250)
    setIsRecording(true)
  }, [supported, stopStream])

  /** Stop mic + encoder; resolves when Blob is ready (or null if empty). */
  const stopRecording = useCallback(() => {
    return new Promise((resolve) => {
      const rec = recorderRef.current

      const finalize = () => {
        stopStream()
        recorderRef.current = null
        setIsRecording(false)
        const chunks = chunksRef.current
        chunksRef.current = []
        if (!chunks.length) {
          resolve(null)
          return
        }
        const type = chunks[0].type || 'audio/webm'
        resolve(new Blob(chunks, { type }))
      }

      if (!rec || rec.state === 'inactive') {
        finalize()
        return
      }

      rec.onstop = () => finalize()

      try {
        rec.stop()
      } catch {
        finalize()
      }
    })
  }, [stopStream])

  useEffect(
    () => () => {
      const rec = recorderRef.current
      if (rec && rec.state !== 'inactive') {
        try {
          rec.onstop = () => stopStream()
          rec.stop()
        } catch {
          stopStream()
        }
      } else {
        stopStream()
      }
      recorderRef.current = null
    },
    [stopStream],
  )

  return {
    isRecording,
    error,
    setError,
    supported,
    start,
    stopRecording,
    extensionForBlob,
  }
}
