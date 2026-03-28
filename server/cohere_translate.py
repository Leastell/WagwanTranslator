"""
Cohere hook — implement your model call here.

You receive raw audio bytes and the client's Content-Type (e.g. audio/webm).
Return plain text: English speech rewritten in a Toronto-style voice.
"""


def translate_en_audio_to_toronto(audio: bytes, content_type: str | None) -> str:
    if not audio:
        return ""

    # --- plumbing only: replace with Cohere (STT + rewrite, or audio model, etc.) ---
    _ = content_type
    return f"[stub] Received {len(audio)} bytes. Implement in cohere_translate.translate_en_audio_to_toronto."
