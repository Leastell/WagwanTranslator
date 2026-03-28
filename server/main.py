from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from cohere_translate import translate_en_audio_to_toronto

app = FastAPI(title="WagwanTranslator API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/translate/en-to-toronto")
async def translate_en_to_toronto(audio: UploadFile = File(...)):
    """
    Body: multipart/form-data with field name `audio` (browser recording).
    Response JSON: { "translation": "<plaintext>" }
    """
    try:
        data = await audio.read()
    except Exception as e:  # noqa: BLE001 — hackathon boundary
        raise HTTPException(status_code=400, detail=f"Could not read upload: {e}") from e

    if not data:
        raise HTTPException(status_code=400, detail="Empty audio file")

    text = translate_en_audio_to_toronto(data, audio.content_type)
    return {"translation": text}
