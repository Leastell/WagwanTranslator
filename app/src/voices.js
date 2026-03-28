import manifest from "./voices.json";

const VALID_TYPES = new Set(["toronto", "lad"]);

/**
 * Audio: drop `server/voice_refs/{id}.wav` or `{id}.mp3`
 * Avatar: drop `app/public/avatars/{id}.png` (or set `image` below)
 */
function assertManifest() {
  const voices = manifest.voices;
  if (!voices || typeof voices !== "object") {
    console.error("voices.json: missing `voices` object");
    return;
  }
  for (const [id, entry] of Object.entries(voices)) {
    if (!/^[a-z0-9_-]+$/i.test(id)) {
      console.error(`voices.json: invalid id "${id}" (use letters, numbers, _ -)`);
    }
    if (!entry?.displayName?.trim()) {
      console.error(`voices.json: ${id} needs displayName`);
    }
    if (!VALID_TYPES.has(entry?.type)) {
      console.error(
        `voices.json: ${id}.type must be "toronto" or "lad" (got ${JSON.stringify(entry?.type)})`,
      );
    }
  }
}

assertManifest();

/** @returns {Record<string, { displayName: string, type: 'toronto' | 'lad', image?: string }>} */
export function getVoices() {
  return manifest.voices || {};
}

export function getVoiceIds() {
  return Object.keys(getVoices());
}

/** @param {string} id */
export function getVoice(id) {
  const k = (id || "").trim().toLowerCase();
  return getVoices()[k] ?? null;
}

export function getDefaultVoiceId() {
  const preferred = (manifest.defaultVoiceId || "").trim().toLowerCase();
  if (preferred && getVoice(preferred)) return preferred;
  const toronto = Object.entries(getVoices()).find(([, v]) => v.type === "toronto");
  if (toronto) return toronto[0];
  const first = getVoiceIds()[0];
  return first || "drake";
}

/** @param {'toronto' | 'lad'} type */
export function listVoicesByType(type) {
  return Object.entries(getVoices())
    .filter(([, v]) => v.type === type)
    .map(([id, v]) => ({ id, ...v }));
}

/** @param {string} id */
export function isValidVoiceId(id) {
  const k = (id || "").trim().toLowerCase();
  if (!/^[a-z0-9_-]+$/.test(k)) return false;
  return Boolean(getVoice(k));
}

/**
 * @param {string} id
 * @param {{ image?: string }} entry
 */
export function avatarUrlForVoice(id, entry) {
  if (entry?.image) {
    const img = entry.image.trim();
    if (img.startsWith("/")) return img;
    return `/avatars/${img}`;
  }
  return `/avatars/${id}.png`;
}
