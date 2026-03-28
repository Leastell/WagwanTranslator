from pathlib import Path

from dotenv import load_dotenv

# Must run before importing cohere_pipeline (it reads API keys from the environment).
load_dotenv(Path(__file__).resolve().parent / ".env")

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

from cohere_pipeline import run_voice_pipeline

app = FastAPI(title="WagwanTranslator API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

VALID_DIRECTIONS = frozenset({"oxford-to-toronto", "toronto-to-oxford"})


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/translate/voice")
async def translate_voice(
    audio: UploadFile = File(...),
    direction: str = Form(...),
):
    """
    Multipart form:
      - audio: recorded blob from the browser
      - direction: "oxford-to-toronto" | "toronto-to-oxford"

    Response: raw audio bytes (Content-Type from TTS layer, e.g. audio/wav).
    """
    if direction not in VALID_DIRECTIONS:
        raise HTTPException(
            status_code=400,
            detail='direction must be "oxford-to-toronto" or "toronto-to-oxford"',
        )

    try:
        data = await audio.read()
    except Exception as e:  # noqa: BLE001 — hackathon boundary
        raise HTTPException(status_code=400, detail=f"Could not read upload: {e}") from e

    if not data:
        raise HTTPException(status_code=400, detail="Empty audio file")

    try:
        out_bytes, mime = run_voice_pipeline(data, audio.content_type, direction)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e

    if not out_bytes:
        raise HTTPException(status_code=500, detail="TTS produced empty audio")

    return Response(content=out_bytes, media_type=mime)
