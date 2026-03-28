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

Flow today: **record audio in the browser** → **POST multipart file to FastAPI** → JSON `{ "translation": "..." }` shown in the UI. **No browser transcription** — implement **English → Toronto-style text** in **`server/cohere_translate.py`** (Cohere stub included).

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
| `server/cohere_translate.py` | **`translate_en_audio_to_toronto`** — plug in Cohere (bytes + `Content-Type` → `str`) |
| `server/main.py` | HTTP route `POST /translate/en-to-toronto`, field name **`audio`** |
| `app/src/lib/api.js` | `fetch` + `FormData`; optional **`VITE_API_ROOT`** for direct API URL |
| `app/src/lib/useAudioRecorder.js` | Tap record / stop, build Blob |
| `app/src/App.jsx` | UI wiring |

### Android emulator (same machine as dev server)

The dev server binds **`0.0.0.0:5173`**. With the default proxy, the phone only talks to port **5173**; keep **8000** running on the host.

1. Start API + `npm run dev` as above.
2. `adb reverse tcp:5173 tcp:5173`
3. Emulator **Chrome** → `http://localhost:5173` — grant mic.

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
