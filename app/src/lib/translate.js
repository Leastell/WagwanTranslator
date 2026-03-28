/**
 * TRANSLATION PLUG — wire your hackathon logic here.
 *
 * Ideas: static map, regex rules, fetch('/api/translate'), OpenAI, etc.
 *
 * @param {string} transcript - text from the mic (Web Speech API)
 * @param {'from-toronto' | 'to-toronto'} direction
 *   - from-toronto: user is speaking Toronto slang → plain English
 *   - to-toronto: user is speaking plain English → Toronto slang
 * @returns {string} shown in the "Translation" box
 */
export function translateTranscript(transcript, direction) {
  const t = transcript?.trim()
  if (!t) return ''

  // Default: obvious pass-through so the UI works before you implement anything.
  return direction === 'to-toronto'
    ? `[TODO to Toronto] ${t}`
    : `[TODO from Toronto] ${t}`
}
