import hashlib
import json
import time

from google import genai
from google.genai import types

from . import config
from .schemas import RegisterPage

_client = None


def client():
    global _client
    if _client is None:
        _client = genai.Client(api_key=config.GEMINI_API_KEY)
    return _client


READ_PROMPT = """You are reading a photographed page of a handwritten pharmacy stock register from an Indian Primary Health Centre (PHC).
The page is a table. Columns are roughly: Drug name, Batch No, Expiry, Opening balance, Received, Issued today, Closing balance.
The handwriting may mix Hindi (Devanagari) and English. Digits may be Latin or Devanagari; return integers in Latin digits.

Rules:
- Return one row per medicine line, in order. Do not invent rows or values.
- Copy the drug name exactly as written (in the language written). Do not translate it.
- Expiry must be YYYY-MM. If only MM/YY is written, expand it (e.g. 08/27 -> 2027-08). If unreadable use null.
- If a number is unreadable use null and give that field low confidence. NEVER guess a number to fill a gap.
- Confidence is 0 to 1 per group of fields (drug, batch, expiry, qty). Be honest: use below 0.6 when a stroke is ambiguous, crossed out, or smudged.
- If a value was crossed out and rewritten, use the rewritten value and add a short note.
- page_date is the date written at the top of the page as YYYY-MM-DD, else null.
"""


def _hash(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()[:24]


def _low_conf_share(page: RegisterPage) -> float:
    cells = 0
    low = 0
    for r in page.rows:
        for v in (r.confidence.drug, r.confidence.batch, r.confidence.expiry, r.confidence.qty):
            cells += 1
            if v < config.LOW_CONF:
                low += 1
    return low / cells if cells else 1.0


def _call(model: str, png: bytes) -> RegisterPage:
    resp = client().models.generate_content(
        model=model,
        contents=[types.Part.from_bytes(data=png, mime_type="image/png"), READ_PROMPT],
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=RegisterPage,
            temperature=0,
        ),
    )
    if getattr(resp, "parsed", None) is not None:
        return resp.parsed
    return RegisterPage.model_validate_json(resp.text)


def read_register(png: bytes, use_cache: bool = True, tag: str = ""):
    """Returns (RegisterPage, meta). Falls back across models; retries with Pro if shaky."""
    key = _hash(png) + tag
    cache_file = config.CACHE_DIR / f"read_{key}.json"
    if use_cache and cache_file.exists():
        d = json.loads(cache_file.read_text(encoding="utf-8"))
        return RegisterPage.model_validate(d["page"]), {**d["meta"], "cached": True}

    errors = []
    page = None
    used = None
    t0 = time.time()
    transient = ("429", "RESOURCE_EXHAUSTED", "503", "UNAVAILABLE", "500", "504", "DEADLINE")
    for round_ in range(3):
        for m in config.READ_MODELS:
            try:
                page = _call(m, png)
                used = m
                break
            except Exception as e:  # noqa: BLE001
                msg = str(e)
                errors.append(f"{m}: {msg[:120]}")
        if page is not None:
            break
        if not any(t in errors[-1] for t in transient):
            break
        time.sleep(3 * (round_ + 1))
    if page is None:
        raise RuntimeError("All Gemini models failed: " + " | ".join(errors[-4:]))

    meta = {"model": used, "escalated": False, "cached": False}
    share = _low_conf_share(page)
    meta["low_conf_share"] = round(share, 3)
    if share > 0.25 and config.PRO_MODEL:
        try:
            better = _call(config.PRO_MODEL, png)
            if _low_conf_share(better) <= share:
                page, meta["model"], meta["escalated"] = better, config.PRO_MODEL, True
                meta["low_conf_share"] = round(_low_conf_share(better), 3)
        except Exception as e:  # noqa: BLE001
            meta["escalation_error"] = str(e)[:200]
    meta["seconds"] = round(time.time() - t0, 1)
    cache_file.write_text(json.dumps({"page": page.model_dump(), "meta": meta}, ensure_ascii=False), encoding="utf-8")
    return page, meta


def generate_json_text(prompt: str, temperature: float = 0.0, rounds: int = 3):
    """Text-only Gemini call returning parsed JSON, with model failover and retry on overload.
    Returns (data, model_used) or (None, None)."""
    for round_ in range(rounds):
        for m in config.TEXT_MODELS:
            try:
                resp = client().models.generate_content(
                    model=m, contents=prompt,
                    config=types.GenerateContentConfig(response_mime_type="application/json", temperature=temperature))
                return json.loads(resp.text), m
            except Exception:  # noqa: BLE001
                continue
        time.sleep(2 * (round_ + 1))
    return None, None
