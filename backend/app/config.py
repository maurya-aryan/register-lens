import os
from pathlib import Path
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[2]
load_dotenv(ROOT / ".env")

BACKEND = ROOT / "backend"
DATA_DIR = BACKEND / "data"
UPLOAD_DIR = BACKEND / "uploads"
CACHE_DIR = BACKEND / "cache"
SAMPLES_DIR = ROOT / "samples" / "pages"
DB_PATH = BACKEND / "registerlens.db"
READINGS_DIR = ROOT / "samples" / "readings"
READINGS_DIR.mkdir(parents=True, exist_ok=True)
for d in (UPLOAD_DIR, CACHE_DIR):
    d.mkdir(parents=True, exist_ok=True)

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
# Reading models, tried in order. The Pro model is used for a retry when a page
# comes back with many low-confidence cells.
READ_MODELS = [m for m in os.environ.get(
    "READ_MODELS", "gemini-3.8-flash,gemini-3.7-flash,gemini-3.6-flash,gemini-3.5-flash,gemini-3-flash-preview,gemini-3.1-flash-lite-preview,gemini-3.5-flash-lite").split(",") if m]
PRO_MODEL = os.environ.get("PRO_MODEL", "gemini-pro-latest")
TEXT_MODELS = [m for m in os.environ.get(
    "TEXT_MODELS", "gemini-3.1-flash-lite-preview,gemini-3.5-flash-lite,gemini-3.5-flash,gemini-3-flash-preview").split(",") if m]
LOW_CONF = 0.75
