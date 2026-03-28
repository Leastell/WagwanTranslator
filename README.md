# WagwanTranslator

**Translate both ways between Toronto slang and plain English.**

WagwanTranslator helps people understand how people actually talk in the GTA—and lets you rewrite everyday English into that same voice when you want tone, not a textbook.

---

## The idea

Toronto slang is dense with borrowed words, compressed grammar, and context that generic translators miss. This project is a **focused** translator: not “all internet slang,” but **6ix patterns**—greetings, intensifiers, place talk, and casual phrasing you hear in chats, memes, and real life.

**It works in two directions:**

- **Slang → clear English** so newcomers, learners, or anyone outside the loop can follow.
- **Clear English → slang** so you can match a familiar tone (without pretending one line fits every block).

---

## Examples

| Toronto side            | Plain English                        |
| ----------------------- | ------------------------------------ |
| Wagwan, you good fam?   | Hey, how are you?                    |
| That’s waste, cuz.      | That’s disappointing / not worth it. |
| Reach when you’re done. | Come by / meet up when you finish.   |
| I’m finna dip.          | I’m about to leave.                  |

_(Exact output depends on how you implement rules, a lexicon, or a model.)_

---

## App (React + Python API) — quick start for engineers

**Step-by-step “what do I do now” and file map:** see [`DEVELOPMENT.md`](DEVELOPMENT.md).

Flow today: **record audio** → **`POST /translate/voice`** with **`direction`** (`oxford-to-toronto` or `toronto-to-oxford`) → backend runs **transcribe → style → TTS** (stubs in **`server/cohere_pipeline.py`**) → **audio bytes** returned and **played** in the UI. **Oxford** = standard English.

### One-time setup

```bash
# Backend
cd server
python3 -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Frontend
cd ../app
npm install
```

### Run locally (two terminals)

```bash
# Terminal A
cd server && source .venv/bin/activate && uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Terminal B
cd app && npm run dev
```

Open **`http://localhost:5173`**. Vite proxies **`/api/*`** → **`http://127.0.0.1:8000`**. Mic uses **MediaRecorder** (Chrome, Firefox, Safari, Edge).

### Where to hack

| Location | Purpose |
|----------|--------|
| `server/cohere_pipeline.py` | **`cohere_transcribe`**, **`cohere_translate_style`**, **`cohere_text_to_speech`**, **`run_voice_pipeline`** |
| `server/main.py` | **`POST /translate/voice`** — form fields **`audio`**, **`direction`**, **`voice_id`** (default `drake`) |
| `server/voice_refs/` | **`{voice_id}.wav`** or **`.mp3`** — Mistral clone ref (MP3 is converted server-side; not the mic upload) |
| `app/src/voices.json` | Sidebar clones: **`id`** → **`displayName`**, **`type`** (`toronto` \| `lad`); assets = `avatars/{id}.png` + `voice_refs/{id}.mp3` |
| `app/src/lib/api.js` | `translateVoice(blob, direction, filename, voiceId)` → `Blob` |
| `app/src/lib/useAudioRecorder.js` | Tap record / stop |
| `app/src/App.jsx` | Direction chips + `<audio controls>` |

### Phone or Android emulator

**`adb reverse tcp:5173 tcp:5173`** forwards the device’s **`localhost:5173`** to **port 5173 on your computer** (so “localhost” on the phone hits your Vite server). With the default **`/api` proxy**, you only need **5173** reversed—not 8000—unless you set **`VITE_API_ROOT`** to a URL on the device’s own `localhost`.

- **Emulator:** start API + `npm run dev`, then `adb reverse tcp:5173 tcp:5173`, open **`http://localhost:5173`** in Chrome, allow mic.
- **Physical phone, fastest:** same Wi‑Fi as your laptop → in the phone browser open **`http://<your-laptop-LAN-IP>:5173`** (firewall must allow 5173).  
- **Physical phone + USB:** enable USB debugging, `adb reverse tcp:5173 tcp:5173`, then **`http://localhost:5173`** on the phone.

### Production-ish build

```bash
cd app
npm run build
npm run preview
```

`npm run preview` uses the same **`/api` → 8000** proxy. For a static host, point **`VITE_API_ROOT`** at your deployed API (HTTPS) or put a reverse proxy in front.

### Optional next step: wrap as a real Android app

This repo stays a **web app** for speed. To ship an APK later, add [Capacitor](https://capacitorjs.com/) in `app/`, run `npx cap add android`, and point the WebView at your built `dist` — expect extra permission strings in `AndroidManifest.xml` for the microphone.

---

_Built as a hackathon idea — feedback welcome._
