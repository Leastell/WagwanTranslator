"""
Cohere integration points — implement each step against Cohere APIs.

Pipeline: audio → transcribe → text style transfer → TTS → audio bytes.
"Oxford" = standard English; "Toronto" = Toronto vernacular.
"""

from __future__ import annotations

import io
import wave
from typing import Literal

Direction = Literal["oxford-to-toronto", "toronto-to-oxford"]


def cohere_transcribe(audio: bytes, content_type: str | None) -> str:
    """TODO: Cohere speech-to-text. Return plain transcript of what was spoken."""
    _ = content_type
    if not audio:
        return ""
    return f"[stub transcript] len={len(audio)}"


def cohere_translate_style(text: str, direction: Direction) -> str:
    """TODO: Cohere text → text. Rewrite between Oxford English and Toronto style."""
    if not text.strip():
        return ""
    return f"[stub {direction}] {text}"


def cohere_text_to_speech(text: str, direction: Direction) -> tuple[bytes, str]:
    """
    TODO: Cohere (or other) TTS. Return (audio_bytes, mime_type).
    mime_type examples: audio/wav, audio/mpeg
    """
    _ = direction
    _ = text
    return _stub_silence_wav(), "audio/wav"


def _stub_silence_wav(duration_frames: int = 8000) -> bytes:
    """Tiny valid WAV so the browser can play something before real TTS exists."""
    buf = io.BytesIO()
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
    Wire transcribe → style → TTS. Replace internals with real Cohere calls.
    """
    if direction not in ("oxford-to-toronto", "toronto-to-oxford"):
        raise ValueError(f"Invalid direction: {direction}")

    raw_text = cohere_transcribe(audio, content_type)
    styled = cohere_translate_style(raw_text, direction)
    return cohere_text_to_speech(styled, direction)
