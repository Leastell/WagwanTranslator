"""
Voice translation pipeline using Cohere and Mistral APIs.

Pipeline: audio → transcribe → text style transfer → TTS → audio bytes.
"Oxford" = standard English; "Toronto" = Toronto vernacular.

Environment variables:
    COHERE_API_KEY: Your Cohere API key
    MISTRAL_API_KEY: Your Mistral API key
"""

from __future__ import annotations

import base64
import io
import os
from pathlib import Path
from typing import Literal

import httpx

Direction = Literal["oxford-to-toronto", "toronto-to-oxford"]

_ENV_LOADED = False


def _load_server_env_once() -> None:
    """Load server/.env even if this module was imported before main.py ran load_dotenv."""
    global _ENV_LOADED
    if _ENV_LOADED:
        return
    try:
        from dotenv import load_dotenv

        p = Path(__file__).resolve().parent / ".env"
        if p.is_file():
            load_dotenv(p)
    except ImportError:
        pass
    _ENV_LOADED = True


def _cohere_key() -> str:
    _load_server_env_once()
    return (os.environ.get("COHERE_API_KEY") or "").strip()


def _mistral_key() -> str:
    _load_server_env_once()
    return (os.environ.get("MISTRAL_API_KEY") or "").strip()


def _convert_to_wav(audio: bytes, content_type: str | None) -> bytes:
    """Convert audio to WAV format using ffmpeg if needed."""
    import subprocess
    import tempfile

    # If already WAV, return as-is
    if content_type in ("audio/wav", "audio/x-wav"):
        return audio

    # Use ffmpeg to convert to WAV
    with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as f_in:
        f_in.write(audio)
        in_path = f_in.name

    out_path = in_path.replace(".webm", ".wav")

    try:
        subprocess.run(
            ["ffmpeg", "-y", "-i", in_path, "-ar", "16000", "-ac", "1", out_path],
            capture_output=True,
            check=True,
        )
        with open(out_path, "rb") as f_out:
            return f_out.read()
    finally:
        import os
        os.unlink(in_path)
        if os.path.exists(out_path):
            os.unlink(out_path)


def cohere_transcribe(audio: bytes, content_type: str | None) -> str:
    """Transcribe audio using Cohere speech-to-text API. Expects WAV format."""
    if not audio:
        return ""

    key = _cohere_key()
    if not key:
        raise ValueError("COHERE_API_KEY environment variable not set")

    response = httpx.post(
        "https://api.cohere.com/v2/audio/transcriptions",
        headers={"Authorization": f"Bearer {key}"},
        files={"file": ("audio.wav", audio, "audio/wav")},
        data={"model": "cohere-transcribe-03-2026", "language": "en"},
        timeout=60.0,
    )
    response.raise_for_status()

    result = response.json()
    return result.get("text", "")


def cohere_translate_style(text: str, direction: Direction) -> str:
    """Translate between Oxford English and Toronto slang using Cohere Chat API."""
    if not text.strip():
        return ""

    key = _cohere_key()
    if not key:
        raise ValueError("COHERE_API_KEY environment variable not set")

    if direction == "toronto-to-oxford":
        prompt = f"""You are a translator. Translate the following text from Multicultural Toronto English (Toronto slang) to formal Oxford English style.

Multicultural Toronto English includes slang like:
- "wagwan" = "what's going on" / "hello"
- "ting" = "thing" or "girl"
- "mandem" = "group of men/friends"
- "bare" = "a lot of" / "very"
- "styll" = "still" / "though" / emphasis
- "ahlie" = "right?" / "isn't it?"
- "fam" = "friend" / "family"
- "bucktee" = "fool" / "weirdo"
- "wallahi" = "I swear to God"
- "yute" = "youth" / "young person"
- "cyattie" = "promiscuous woman"
- "ends" = "neighborhood"
- "link" = "meet up"
- "say less" = "understood" / "no need to explain"
- "no cap" = "no lie" / "for real"
- "waste yute" = "useless person"
- "crodie" = "close friend"
- "blessed" = "good" / "doing well"

Convert the slang to proper, formal Oxford English while preserving the meaning. Only output the translated text, nothing else.

Text to translate: {text}"""
    else:  # oxford-to-toronto
        prompt = f"""You are a translator. Translate the following formal English text to Multicultural Toronto English (Toronto slang).

Use Toronto slang authentically, including terms like:
- "wagwan" = "what's going on" / "hello"
- "ting" = "thing" or "girl"
- "mandem" = "group of men/friends"
- "bare" = "a lot of" / "very"
- "styll" = "still" / "though" / emphasis
- "ahlie" = "right?" / "isn't it?"
- "fam" = "friend" / "family"
- "bucktee" = "fool" / "weirdo"
- "wallahi" = "I swear to God"
- "yute" = "youth" / "young person"
- "ends" = "neighborhood"
- "link" = "meet up"
- "say less" = "understood" / "no need to explain"
- "no cap" = "no lie" / "for real"
- "waste yute" = "useless person"
- "crodie" = "close friend"
- "blessed" = "good" / "doing well"

Make it sound natural and authentic to how people actually speak in Toronto. Only output the translated text, nothing else.

Text to translate: {text}"""

    response = httpx.post(
        "https://api.cohere.com/v2/chat",
        headers={
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
        },
        json={
            "model": "command-a-03-2025",
            "messages": [{"role": "user", "content": prompt}],
        },
        timeout=60.0,
    )
    response.raise_for_status()

    result = response.json()
    return result["message"]["content"][0]["text"]


def cohere_text_to_speech(
    text: str,
    direction: Direction,
    ref_audio: bytes | None = None,
) -> tuple[bytes, str]:
    """
    Convert text to speech using Mistral Voxtral TTS API.
    Optionally uses ref_audio for voice cloning.
    Returns (audio_bytes, mime_type).
    """
    if not text.strip():
        return _stub_silence_wav(), "audio/wav"

    mkey = _mistral_key()
    if not mkey:
        raise ValueError("MISTRAL_API_KEY environment variable not set")

    _ = direction  # Could use different voices per direction in future

    payload = {
        "model": "voxtral-mini-tts-2603",
        "input": text,
        "response_format": "wav",
    }

    # Use reference audio for voice cloning if provided
    if ref_audio:
        payload["ref_audio"] = base64.b64encode(ref_audio).decode("utf-8")

    response = httpx.post(
        "https://api.mistral.ai/v1/audio/speech",
        headers={
            "Authorization": f"Bearer {mkey}",
            "Content-Type": "application/json",
        },
        json=payload,
        timeout=120.0,
    )
    response.raise_for_status()

    result = response.json()
    audio_b64 = result.get("audio_data", "")
    audio_bytes = base64.b64decode(audio_b64)

    return audio_bytes, "audio/wav"


def _stub_silence_wav(duration_frames: int = 8000) -> bytes:
    """Tiny valid WAV for fallback."""
    buf = io.BytesIO()
    import wave
    with wave.open(buf, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(16000)
        w.writeframes(b"\x00\x00" * duration_frames)
    return buf.getvalue()


def run_voice_pipeline(
    audio: bytes,
    content_type: str | None,
    direction: Direction,
) -> tuple[bytes, str]:
    """
    Full pipeline: transcribe → style transfer → TTS with voice cloning.
    """
    if direction not in ("oxford-to-toronto", "toronto-to-oxford"):
        raise ValueError(f"Invalid direction: {direction}")

    # Convert audio to WAV for both transcription and voice cloning
    if content_type not in ("audio/wav", "audio/x-wav"):
        audio_wav = _convert_to_wav(audio, content_type)
    else:
        audio_wav = audio

    raw_text = cohere_transcribe(audio_wav, "audio/wav")
    if not raw_text.strip():
        raise ValueError("Could not transcribe audio - no speech detected")

    styled = cohere_translate_style(raw_text, direction)

    # Use converted WAV audio as reference for voice cloning
    return cohere_text_to_speech(styled, direction, ref_audio=audio_wav)
