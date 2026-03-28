# What to do next — WagwanTranslator

This file is the **onboarding map**: what works today, what you should do first, and **where new code belongs**. The product pitch stays in [`README.md`](README.md).

---

## 1. Run the full stack (do this first)

You need **two processes**: Python API + Vite frontend.

**Terminal A — backend (port 8000)**

```bash
cd server
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal B — frontend (port 5173)**

```bash
cd app
npm install          # once per clone / after pulling new deps
npm run dev
```

Open **`http://localhost:5173`**. Record with the mic, pick **Oxford → Toronto** or **Toronto → Oxford**, stop — the app **POSTs audio** and plays the **response audio** (stub silence WAV until real TTS is wired).

**Browsers:** **MediaRecorder** works in **Chrome, Firefox, Safari, Edge**.

---

## 2. Repo layout (where things live)

```text
WagwanTranslator/
├── README.md
├── DEVELOPMENT.md
├── .gitignore
├── server/
│   ├── requirements.txt
│   ├── main.py                  # POST /translate/voice, GET /health
│   └── cohere_pipeline.py       # ⭐ Cohere stubs: STT → style → TTS
└── app/
    ├── vite.config.js           # Proxies /api → http://127.0.0.1:8000
    └── src/
        ├── App.jsx              # Direction + mic + <audio>
        ├── App.css
        └── lib/
            ├── api.js
            └── useAudioRecorder.js
```

**Build output:** `app/dist/` after `npm run build`.

---

## 3. Request / response contract

- **Method / path:** `POST /translate/voice`
- **Body:** `multipart/form-data`
  - **`audio`** — file blob from the browser
  - **`direction`** — `oxford-to-toronto` | `toronto-to-oxford`  
    (**Oxford** = standard English; **Toronto** = Toronto vernacular.)
- **Response:** **binary audio** (e.g. `audio/wav`). Not JSON.

The frontend calls **`/api/translate/voice`** in dev; Vite strips the **`/api`** prefix.

---

## 4. What you implement (Cohere)

| Step | Function in `cohere_pipeline.py` |
|------|----------------------------------|
| Speech-to-text | `cohere_transcribe(audio, content_type) -> str` |
| Style transfer | `cohere_translate_style(text, direction) -> str` |
| TTS | `cohere_text_to_speech(text, direction) -> tuple[bytes, str]` (bytes + MIME) |

`run_voice_pipeline` chains them; swap stubs for real SDK calls and env (e.g. `COHERE_API_KEY`).

---

## 5. Frontend env (optional)

| Variable | Purpose |
|----------|--------|
| `VITE_API_ROOT` | If set, voice requests go to `${VITE_API_ROOT}/translate/voice` (no `/api` prefix). CORS is open in `main.py` for hackathon use. |

---

## 6. Android emulator

- `adb reverse tcp:5173 tcp:5173` — browser hits your Vite dev server through the proxy to **8000** on the host.
- If you set **`VITE_API_ROOT=http://localhost:8000`** on the device, **`localhost` is the phone** — use **`adb reverse tcp:8000 tcp:8000`** or your LAN IP instead.

---

## 7. Ship / demo checklist

- [ ] `GET http://127.0.0.1:8000/health` → `{"ok":true}`.
- [ ] Record → stop → audio element plays (stub or real TTS).
- [ ] Secrets only in `.env` / env vars.
- [ ] `npm run build` succeeds.

---

## 8. Quick commands reference

| Command | When |
|---------|------|
| `cd server && uvicorn main:app --reload --host 0.0.0.0 --port 8000` | API dev |
| `cd app && npm run dev` | Frontend dev |
| `cd app && npm run build` | Production bundle |
| `cd app && npm run preview` | Test build (proxy to 8000 same as dev) |

---

If something in this doc drifts from the code, update **this file** so the next person is not guessing.
