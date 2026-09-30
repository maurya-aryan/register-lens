"""Register Lens assistant: Gemini with function calling over the app's own data.

The model never invents stock numbers: it has to call these tools, which read the same data
the dashboards use. Replies follow the user's language (Hindi, English, Hinglish, ...).
"""
import json
from typing import List, Optional

from google.genai import types
from rapidfuzz import fuzz, process
from sqlmodel import Session, select

from . import config, stock
from .catalog import MEDICINES
from .db import PHC, engine
from .gemini_reader import _alive, _mark_dead, client

SYSTEM = """You are the Register Lens assistant for public-health staff in Uttar Pradesh, India
(PHC pharmacists, district drug store officers, CMO office staff).

What Register Lens does: a pharmacist photographs the handwritten stock register; Gemini reads it; the
pharmacist confirms flagged cells; the app compares it with DVDMS (the state drug-stock software),
shows days of stock left vs what DVDMS claims, exports a DVDMS bulk-entry file, and writes alerts in
Indian languages. It also maps all public health facilities in UP and suggests moving near-expiry
medicines to nearby facilities that are running short (a district officer approves every move).

Rules:
- For any number about stock, facilities, districts or transfers, CALL A TOOL. Never guess numbers.
- Say clearly that stock figures for facilities that have not scanned a register are simulated demo data.
- Reply in the user's language and script (Hindi -> Devanagari, Hinglish -> Hinglish, English -> English).
- Be brief: at most 6 short lines or bullets. Use plain words a busy pharmacist understands.
- You give supply-chain information, not medical advice about patients.
"""

MED_NAMES = {m[0]: f"{m[1]} {m[2]}" for m in MEDICINES}


def _districts() -> List[str]:
    with Session(engine) as s:
        return sorted({d for d in s.exec(select(PHC.district)).all()})


def _match_district(name: str) -> Optional[str]:
    ds = _districts()
    best = process.extractOne(name or "", ds, scorer=fuzz.WRatio)
    return best[0] if best and best[1] >= 75 else None


def _match_facility(name: str, district: str = ""):
    with Session(engine) as s:
        q = select(PHC)
        d = _match_district(district) if district else None
        if d:
            q = q.where(PHC.district == d)
        facs = s.exec(q).all()
    best = process.extractOne((name or "").lower(), [f.name.lower() for f in facs], scorer=fuzz.WRatio)
    return facs[best[2]] if best and best[1] >= 70 else None


def _match_med(name: str) -> Optional[str]:
    choices = []
    owner = []
    for m in MEDICINES:
        for v in [m[1], f"{m[1]} {m[2]}"] + list(m[5]):
            choices.append(v.lower())
            owner.append(m[0])
    best = process.extractOne((name or "").lower(), choices, scorer=fuzz.WRatio)
    return owner[best[2]] if best and best[1] >= 70 else None


# ---------------- tools (docstrings are what Gemini sees) ----------------
def statewide_overview() -> dict:
    """Uttar Pradesh totals and the 8 districts with the highest share of high-risk health facilities."""
    o = stock.state_overview()
    top = sorted(o["districts"], key=lambda r: -r["high_pct"])[:8]
    return {"totals": o["totals"], "top_risk_districts": [{k: r[k] for k in ("district", "facilities", "high_risk", "high_pct", "expiry_value")} for r in top],
            "note": "simulated stock except facilities that scanned a register"}


def district_status(district: str) -> dict:
    """Stock situation of one UP district: facility counts, the most at-risk facilities, value of stock about to expire.

    Args:
        district: district name, e.g. "Barabanki" or "Lucknow" (spelling can be approximate).
    """
    d = _match_district(district)
    if not d:
        return {"error": f"No district matching '{district}'"}
    f = stock.district_facilities(d)
    red = stock.redistribution(d)
    return {"district": d, "facilities": len(f), "by_type": {k: sum(1 for x in f if x["kind"] == k) for k in ("DH", "CHC", "PHC", "HWC")},
            "high_risk": sum(1 for x in f if x["risk"] == "high"),
            "most_at_risk": [{"name": x["name"], "type": x["kind"], "medicines_running_out": x["critical"], "most_urgent": x["worst"]} for x in f[:6]],
            "near_expiry_value_inr": sum(x["expiry_value"] for x in f),
            "suggested_transfers": red["totals"], "note": "simulated stock except facilities that scanned a register"}


def facility_status(facility_name: str, district: str = "") -> dict:
    """Medicines running low at one health facility, with register vs DVDMS days of stock.

    Args:
        facility_name: facility name, e.g. "PHC Banki" or "CHC Haidergarh".
        district: optional district to narrow the search.
    """
    f = _match_facility(facility_name, district)
    if not f:
        return {"error": f"No facility matching '{facility_name}'"}
    d = stock.facility_detail(f.id)
    lines = [{"medicine": l["med_name"], "days_left_register": l["days_real"], "days_dvdms_shows": l["days_dvdms"], "status": l["status"]}
             for l in d["lines"][:8]]
    return {"facility": d["name"], "type": d["kind"], "district": d["district"], "data": "register" if d["scanned"] else "simulated",
            "running_out": d["critical"], "lowest_stock": lines}


def find_medicine_nearby(medicine: str, facility_name: str, district: str = "") -> dict:
    """Nearest facilities that have at least 30 days of a medicine, starting from a given facility.

    Args:
        medicine: medicine name in English or Hindi, e.g. "ORS", "Paracetamol", "पैरासिटामोल".
        facility_name: the facility that needs the medicine.
        district: optional district to narrow the facility search.
    """
    code = _match_med(medicine)
    f = _match_facility(facility_name, district)
    if not code:
        return {"error": f"Unknown medicine '{medicine}'"}
    if not f or f.lat is None:
        return {"error": f"No mapped facility matching '{facility_name}'"}
    with Session(engine) as s:
        cands = s.exec(select(PHC).where(PHC.district == f.district)).all()
        res = []
        for c in cands:
            if c.id == f.id or c.lat is None:
                continue
            st = stock.facility_stock(s, c).get(code)
            if not st or not st["daily"]:
                continue
            days = st["real"] / st["daily"]
            if days >= 30:
                res.append({"name": c.name, "type": c.kind, "km": round(stock.haversine(f.lat, f.lon, c.lat, c.lon), 1),
                            "units": st["real"], "days_of_stock": round(days)})
    res.sort(key=lambda x: x["km"])
    return {"medicine": MED_NAMES[code], "from": f.name, "district": f.district, "nearest_with_stock": res[:5],
            "note": "simulated stock except facilities that scanned a register"}


def expiry_transfer_plan(district: str) -> dict:
    """Suggested moves of near-expiry medicine batches to nearby facilities that are running short (Phase 3).

    Args:
        district: district name.
    """
    d = _match_district(district)
    if not d:
        return {"error": f"No district matching '{district}'"}
    r = stock.redistribution(d)
    return {"district": d, "totals": r["totals"], "rules": r["rules"],
            "top": [{"medicine": t["med_name"], "qty": t["qty"], "from": t["from"]["name"], "to": t["to"]["name"], "km": t["km"],
                     "expires_in_days": t["days_to_expiry"], "value_inr": t["value"], "decision": t["decision"]} for t in r["transfers"][:6]]}


TOOLS = [statewide_overview, district_status, facility_status, find_medicine_nearby, expiry_transfer_plan]


def reply(messages: List[dict], context: Optional[dict] = None) -> dict:
    contents = []
    for m in messages[-10:]:
        role = "model" if m.get("role") in ("assistant", "model") else "user"
        contents.append(types.Content(role=role, parts=[types.Part.from_text(text=str(m.get("text", ""))[:2000])]))
    sys = SYSTEM
    if context:
        sys += "\nCurrent screen context (JSON, from the user's app session):\n" + json.dumps(context, ensure_ascii=False)[:4000]
    cfg = types.GenerateContentConfig(
        system_instruction=sys, tools=TOOLS, temperature=0.3,
        automatic_function_calling=types.AutomaticFunctionCallingConfig(maximum_remote_calls=4),
    )
    last = ""
    for model in _alive(config.CHAT_MODELS):
        try:
            resp = client().models.generate_content(model=model, contents=contents, config=cfg)
            used = [c.parts[0].function_call.name for c in (resp.automatic_function_calling_history or [])
                    if c.parts and getattr(c.parts[0], "function_call", None)]
            text = (resp.text or "").strip()
            if text:
                return {"text": text, "model": model, "tools_used": used}
        except Exception as e:  # noqa: BLE001
            last = str(e)
            _mark_dead(model, last)
    if "429" in last or "RESOURCE_EXHAUSTED" in last:
        return {"text": "The AI assistant has reached its free usage limit for now. The maps, dashboards and sample scans still work.", "model": None, "tools_used": [], "error": "quota"}
    return {"text": "The AI assistant is busy right now. Please try again in a minute.", "model": None, "tools_used": [], "error": "busy"}
