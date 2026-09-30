import hashlib
import json
import time

from google import genai
from google.genai import types

from . import config
from .schemas import RegisterPage

_client = None
_dead: dict = {}  # model -> time until which we skip it (quota exhausted / not available)


def _mark_dead(model: str, err: str):
    if "PerDay" in err:
        _dead[model] = time.time() + 3 * 3600
    elif "404" in err or "NOT_FOUND" in err:
        _dead[model] = time.time() + 24 * 3600
    elif "429" in err or "RESOURCE_EXHAUSTED" in err:
        _dead[model] = time.time() + 20


def _alive(models):
    now = time.time()
    live = [m for m in models if _dead.get(m, 0) < now]
    return live or list(models)  # if everything looks dead, still try them all


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
- Real registers are messy. The page may be a plain ruled notebook with hand-drawn or no column lines, and
  handwritten rows may slope across the ruled lines: follow each handwritten row from left to right.
- Column names vary (e.g. Open/Opening/OB, Recd/Received/Rec, Issue/Issued/Consumed, Bal/Closing/CB).
- In the Received column, "nil", "-", "--", "0" or an empty cell all mean 0.
- Expiry can be written as 07/27, 7-27, 7/2027, Jul 27 or "Exp 07/27": always return YYYY-MM.
- If a number is struck through, crossed out or overwritten and another value is written next to or below it,
  use the NEW value and add a note. Never add the old and new values together.
- Devanagari numerals (०१२३४५६७८९) must be converted to Latin digits.
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


def read_register(png: bytes, use_cache: bool = True, tag: str = "", store_path=None):
    """Returns (RegisterPage, meta). Falls back across models; retries with Pro if shaky."""
    key = _hash(png) + tag
    cache_file = config.CACHE_DIR / f"read_{key}.json"
    if store_path is not None and store_path.exists():
        d = json.loads(store_path.read_text(encoding="utf-8"))
        return RegisterPage.model_validate(d["page"]), {**d["meta"], "cached": True, "stored": True}
    if use_cache and cache_file.exists():
        d = json.loads(cache_file.read_text(encoding="utf-8"))
        if store_path is not None:
            store_path.write_text(json.dumps(d, ensure_ascii=False), encoding="utf-8")
        return RegisterPage.model_validate(d["page"]), {**d["meta"], "cached": True}

    errors = []
    page = None
    used = None
    t0 = time.time()
    transient = ("429", "RESOURCE_EXHAUSTED", "503", "UNAVAILABLE", "500", "504", "DEADLINE")
    for round_ in range(3):
        for m in _alive(config.READ_MODELS):
            try:
                page = _call(m, png)
                used = m
                break
            except Exception as e:  # noqa: BLE001
                msg = str(e)
                _mark_dead(m, msg)
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
    if share > 0.25 and config.PRO_MODEL and _dead.get(config.PRO_MODEL, 0) < time.time():
        try:
            better = _call(config.PRO_MODEL, png)
            if _low_conf_share(better) <= share:
                page, meta["model"], meta["escalated"] = better, config.PRO_MODEL, True
                meta["low_conf_share"] = round(_low_conf_share(better), 3)
        except Exception as e:  # noqa: BLE001
            _mark_dead(config.PRO_MODEL, str(e))
            meta["escalation_error"] = str(e)[:200]
    meta["seconds"] = round(time.time() - t0, 1)
    blob = json.dumps({"page": page.model_dump(), "meta": meta}, ensure_ascii=False)
    cache_file.write_text(blob, encoding="utf-8")
    if store_path is not None:
        store_path.write_text(blob, encoding="utf-8")
    return page, meta


def generate_json_text(prompt: str, temperature: float = 0.0, rounds: int = 3):
    """Text-only Gemini call returning parsed JSON, with model failover and retry on overload.
    Returns (data, model_used) or (None, None)."""
    for round_ in range(rounds):
        for m in _alive(config.TEXT_MODELS):
            try:
                resp = client().models.generate_content(
                    model=m, contents=prompt,
                    config=types.GenerateContentConfig(response_mime_type="application/json", temperature=temperature))
                return json.loads(resp.text), m
            except Exception as e:  # noqa: BLE001
                _mark_dead(m, str(e))
                continue
        time.sleep(2 * (round_ + 1))
    return None, None
