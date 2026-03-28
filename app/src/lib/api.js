/**
 * POST recorded audio to the Python backend. Returns plaintext translation JSON.
 *
 * Dev: Vite proxies /api → backend (see vite.config.js).
 * Prod / custom: set VITE_API_ROOT=http://your-host:8000 (no trailing slash).
 */

function translateUrl() {
  const root = (import.meta.env.VITE_API_ROOT || '').replace(/\/$/, '')
  if (root) return `${root}/translate/en-to-toronto`
  return '/api/translate/en-to-toronto'
}

/**
 * @param {Blob} audioBlob — e.g. from MediaRecorder
 * @param {string} [filename] — optional filename hint for the server
 * @returns {Promise<{ translation: string }>}
 */
export async function translateEnglishAudioToToronto(audioBlob, filename = 'recording.webm') {
  const form = new FormData()
  form.append('audio', audioBlob, filename)

  const res = await fetch(translateUrl(), {
    method: 'POST',
    body: form,
  })

  const text = await res.text()
  let json
  try {
    json = text ? JSON.parse(text) : {}
  } catch {
    throw new Error(`Bad JSON from server (${res.status}): ${text.slice(0, 200)}`)
  }

  if (!res.ok) {
    const detail = json.detail ?? json.message ?? text
    throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail))
  }

  if (typeof json.translation !== 'string') {
    throw new Error('Server response missing string "translation"')
  }

  return json
}
