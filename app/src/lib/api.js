/**
 * Voice translate: POST audio + direction → audio response (play in browser).
 *
 * Dev: Vite proxies /api → backend (vite.config.js).
 * Prod: VITE_API_ROOT=http://your-host:8000 (no trailing slash).
 */

/** @typedef {'oxford-to-toronto' | 'toronto-to-oxford'} VoiceDirection */

function voiceUrl() {
  const root = (import.meta.env.VITE_API_ROOT || '').replace(/\/$/, '')
  if (root) return `${root}/translate/voice`
  return '/api/translate/voice'
}

/**
 * @param {Blob} audioBlob
 * @param {VoiceDirection} direction
 * @param {string} [filename]
 * @param {string} [voiceId] — server loads `voice_refs/{voiceId}.wav` or `.mp3` for Mistral clone
 * @returns {Promise<Blob>}
 */
export async function translateVoice(
  audioBlob,
  direction,
  filename = 'recording.webm',
  voiceId = 'drake',
) {
  const form = new FormData()
  form.append('audio', audioBlob, filename)
  form.append('direction', direction)
  form.append('voice_id', voiceId)

  const res = await fetch(voiceUrl(), {
    method: 'POST',
    body: form,
  })

  if (!res.ok) {
    const text = await res.text()
    let detail = text
    try {
      const j = JSON.parse(text)
      detail = j.detail ?? j.message ?? text
      if (typeof detail !== 'string') detail = JSON.stringify(detail)
    } catch {
      /* use raw text */
    }
    throw new Error(detail || `Request failed (${res.status})`)
  }

  return res.blob()
}
