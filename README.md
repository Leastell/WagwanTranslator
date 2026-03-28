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

## App (React) — quick start for engineers

The UI lives in **`app/`**: Vite + React, **Web Speech API** for mic → text, and a single translation stub **`src/lib/translate.js`** for you to replace.

### One-time setup

```bash
cd app
npm install
```

### Run locally (desktop)

```bash
npm run dev
```

Open the printed URL (usually `http://localhost:5173`). Use **Chrome or Edge** — speech recognition is not available in Firefox/Safari for this API.

### Where to hack

| File | Purpose |
|------|--------|
| `app/src/lib/translate.js` | **Plug:** `(transcript, direction) => string` — rules, API, LLM, etc. |
| `app/src/lib/useSpeechRecognition.js` | Mic lifecycle, `en-CA` locale — tweak language here if needed |
| `app/src/App.jsx` | Layout, direction chips, wires transcript → `translateTranscript` |

`direction` is either `from-toronto` (slang → plain) or `to-toronto` (plain → slang); persist in `localStorage` as `wagwan-direction`.

### Android emulator (same machine as dev server)

The dev server binds **`0.0.0.0:5173`** so other devices can reach your laptop.

1. Start the app: `cd app && npm run dev`.
2. In a terminal: `adb reverse tcp:5173 tcp:5173` (forwards emulator → your host).
3. On the emulator, open **Chrome** → `http://localhost:5173`.
4. Grant **Microphone** when prompted (Settings → App → Chrome → Permissions if needed).

**If `adb reverse` is awkward:** find your computer’s LAN IP (`ipconfig` / `ifconfig`) and open `http://<that-ip>:5173` from the emulator browser (some setups need the firewall to allow port 5173).

### Production-ish build

```bash
cd app
npm run build
npm run preview
```

Serve `app/dist/` from any static host. Speech still requires a **secure context** (HTTPS or localhost).

### Optional next step: wrap as a real Android app

This repo stays a **web app** for speed. To ship an APK later, add [Capacitor](https://capacitorjs.com/) in `app/`, run `npx cap add android`, and point the WebView at your built `dist` — expect extra permission strings in `AndroidManifest.xml` for the microphone.

---

_Built as a hackathon idea — feedback welcome._
