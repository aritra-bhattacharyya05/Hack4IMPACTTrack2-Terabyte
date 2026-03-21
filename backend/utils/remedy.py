"""
utils/remedy.py
GenAI remedy generation via AIPipe / OpenRouter.
Logic extracted from gen_ai_integration.ipynb.
"""
import os
import logging
import requests

logger = logging.getLogger("agriai.remedy")

# ── AIPipe config (set AIPIPE_TOKEN in env) ────────────────────────
AIPIPE_TOKEN = os.getenv(
    "AIPIPE_TOKEN",
    "eyJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6IjI0ZjIwMDgyMjRAZHMuc3R1ZHkuaWl0bS5hYy5pbiJ9.mFLuUr6uFlogphE3Arg3tN0baBcgGICrLPo9o6iawBg",
)
AIPIPE_URL  = "https://aipipe.org/openrouter/v1/chat/completions"
AIPIPE_HEADERS = {
    "Authorization": f"Bearer {AIPIPE_TOKEN}",
    "Content-Type":  "application/json",
}


# ── Fallback remedies (if API unavailable) ─────────────────────────
_FALLBACK_REMEDIES = {
    "default": [
        "Isolate affected plants immediately to prevent spread.",
        "Remove and destroy visibly infected leaves/stems.",
        "Apply a broad-spectrum fungicide (e.g., Mancozeb) as directed.",
        "Improve air circulation around the plant canopy.",
        "Consult your local agricultural extension officer if symptoms worsen within 48 hours.",
    ]
}


def generate_remedy(disease_name: str, confidence: str = "N/A") -> list[str]:
    """
    Call AIPipe GenAI to generate a structured treatment plan.
    Returns a list of actionable remedy strings.
    Falls back to default remedies if API unavailable.
    """
    clean_name = disease_name.replace("___", " ").replace("_", " ").strip()
    logger.info(f"Generating remedy for: {clean_name}")

    prompt = f"""
You are an expert agricultural scientist helping small farmers in India.

A crop disease detection AI identified:
- Disease   : {clean_name}
- Confidence: {confidence}

Provide EXACTLY 5 short, practical remedy steps as a numbered list.
Format: one step per line, starting with a number and period (e.g. "1. ...")
Keep each step under 20 words. Use simple English — the farmer is not a scientist.
Cover: severity, immediate action, treatment product, prevention, when to seek help.
"""

    payload = {
        "model":    "google/gemini-2.0-flash-lite-001",
        "messages": [{"role": "user", "content": prompt}],
    }

    try:
        resp = requests.post(AIPIPE_URL, headers=AIPIPE_HEADERS, json=payload, timeout=15)
        if resp.status_code == 200:
            raw   = resp.json()["choices"][0]["message"]["content"]
            lines = [l.strip() for l in raw.strip().splitlines() if l.strip()]
            # Extract numbered lines
            steps = [l for l in lines if l and l[0].isdigit()]
            if steps:
                return steps[:5]
            # fallback: return all non-empty lines
            return lines[:5]
        else:
            logger.warning(f"AIPipe returned {resp.status_code}: {resp.text[:200]}")
    except Exception as e:
        logger.error(f"AIPipe call failed: {e}")

    logger.info("Using fallback remedy")
    return _FALLBACK_REMEDIES["default"]
