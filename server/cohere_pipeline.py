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
from typing import Literal

import httpx
import soundfile as sf

Direction = Literal["oxford-to-toronto", "toronto-to-oxford"]

COHERE_API_KEY = os.environ.get("COHERE_API_KEY", "")
MISTRAL_API_KEY = os.environ.get("MISTRAL_API_KEY", "")


def cohere_transcribe(audio: bytes, content_type: str | None) -> str:
    """Transcribe audio using Cohere speech-to-text API."""
    if not audio:
        return ""

    if not COHERE_API_KEY:
        raise ValueError("COHERE_API_KEY environment variable not set")

    # Determine file extension from content type
    ext_map = {
        "audio/wav": "wav",
        "audio/x-wav": "wav",
        "audio/webm": "webm",
        "audio/ogg": "ogg",
        "audio/mpeg": "mp3",
        "audio/mp3": "mp3",
    }
    ext = ext_map.get(content_type, "wav")
    filename = f"audio.{ext}"

    response = httpx.post(
        "https://api.cohere.com/v2/audio/transcriptions",
        headers={"Authorization": f"Bearer {COHERE_API_KEY}"},
        files={"file": (filename, audio, content_type or "audio/wav")},
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

    if not COHERE_API_KEY:
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
            "Authorization": f"Bearer {COHERE_API_KEY}",
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


def cohere_text_to_speech(text: str, direction: Direction) -> tuple[bytes, str]:
    """
    Convert text to speech using Mistral Voxtral TTS API.
    Returns (audio_bytes, mime_type).
    """
    if not text.strip():
        return _stub_silence_wav(), "audio/wav"

    if not MISTRAL_API_KEY:
        raise ValueError("MISTRAL_API_KEY environment variable not set")

    _ = direction  # Could use different voices per direction in future

    response = httpx.post(
        "https://api.mistral.ai/v1/audio/speech",
        headers={
            "Authorization": f"Bearer {MISTRAL_API_KEY}",
            "Content-Type": "application/json",
        },
        json={
            "model": "voxtral-mini-tts-2603",
            "input": text,
            "response_format": "wav",
        },
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
    Full pipeline: transcribe → style transfer → TTS.
    """
    if direction not in ("oxford-to-toronto", "toronto-to-oxford"):
        raise ValueError(f"Invalid direction: {direction}")

    raw_text = cohere_transcribe(audio, content_type)
    if not raw_text.strip():
        raise ValueError("Could not transcribe audio - no speech detected")

    styled = cohere_translate_style(raw_text, direction)
    return cohere_text_to_speech(styled, direction)
