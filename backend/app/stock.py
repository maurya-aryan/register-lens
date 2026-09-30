"""Stock picture for every facility, district summaries, and Phase 3 expiry redistribution.

For the 12 demo PHCs, DVDMS stock comes from the database. For all other mapped facilities,
stock is SIMULATED deterministically (seeded by facility id) so the statewide views are
illustrative. As soon as a facility's register is scanned and confirmed, its real register
numbers replace the simulated ones.
"""
import hashlib
import math
import random
from datetime import date, datetime, timedelta
from functools import lru_cache
from typing import Dict, List, Optional

from sqlmodel import Session, select

from .catalog import MEDICINES, PRICES
from .db import PHC, DvdmsStock, RegisterTruth, TransferDecision, engine

MED = {m[0]: m for m in MEDICINES}
HWC_MEDS = [m[0] for m in MEDICINES[:16]]  # smaller formulary at Health & Wellness Centres
TODAY = date.today()
EXPIRY_WINDOW = 90       # days: batches expiring within this window are candidates to move
SHORT_DAYS = 10          # receiving facility has less than this many days of stock
TARGET_DAYS = 30         # top a receiver up to this many days
MAX_KM = 45              # only suggest moves within this road-ish distance (straight line)


def _batch(rng):
    return "".join(rng.choice("ABCDEFGHJKLMNPRSTUVW") for _ in range(2)) + str(rng.randint(1000, 9999))


@lru_cache(maxsize=20000)
def simulated(fid: str, kind: str, load: float):
    rng = random.Random(fid)
    out = {}
    codes = HWC_MEDS if kind == "HWC" else list(MED)
    for code in codes:
        base = MED[code][6]
        daily = max(1, round(base * load * rng.uniform(0.7, 1.3)))
        roll = rng.random()
        real_days = rng.uniform(0.8, 6.5) if roll < 0.045 else rng.uniform(7, 15) if roll < 0.15 else rng.uniform(16, 80)
        real = int(daily * real_days)
        drift = rng.uniform(1.0, 1.2) if rng.random() < 0.6 else rng.uniform(1.5, 5.0)
        dvdms = int(min(real * drift, daily * 120)) if real else int(daily * rng.uniform(5, 30))
        batches = []
        if rng.random() < 0.14 and real_days > 20:
            d2e = rng.randint(12, 80)          # an older batch that will not be used up in time
            old = int(min(real * 0.8, daily * d2e * rng.uniform(1.4, 3.0)))
            batches.append({"batch": _batch(rng), "expiry": (TODAY + timedelta(days=d2e)).isoformat(), "qty": old})
            rest = real - old
        else:
            rest = real
        if rest > 0:
            batches.append({"batch": _batch(rng), "expiry": (TODAY + timedelta(days=rng.randint(150, 700))).isoformat(), "qty": rest})
        out[code] = {"daily": daily, "real": real, "dvdms": dvdms, "batches": batches}
    return out


def _ym_to_date(s: str) -> Optional[date]:
    try:
        if len(s) == 7:
            y, m = s.split("-")
            return date(int(y), int(m), 28)
        return date.fromisoformat(s)
    except Exception:  # noqa: BLE001
        return None


def facility_stock(session: Session, fac: PHC) -> Dict[str, dict]:
    base = {k: {**v, "batches": [dict(b) for b in v["batches"]], "source": "simulated"}
            for k, v in simulated(fac.id, fac.kind, fac.load).items()}
    if fac.demo:
        dv: Dict[str, int] = {}
        for s in session.exec(select(DvdmsStock).where(DvdmsStock.phc_id == fac.id)).all():
            dv[s.med_code] = dv.get(s.med_code, 0) + s.qty
        for code, q in dv.items():
            if code in base:
                base[code]["dvdms"] = q
    truth = session.exec(select(RegisterTruth).where(RegisterTruth.phc_id == fac.id)).all()
    for t in truth:
        e = base.setdefault(t.med_code, {"dvdms": 0, "batches": []})
        exp = _ym_to_date(t.expiry) if t.expiry else None
        e.update({"real": t.closing, "daily": max(1, t.daily), "source": "register",
                  "batches": [{"batch": t.batch, "expiry": exp.isoformat() if exp else (TODAY + timedelta(days=365)).isoformat(), "qty": t.closing}]})
    return base


def facility_summary(fac: PHC, stock: Dict[str, dict]) -> dict:
    crit = warn = phantom = 0
    worst = None
    surplus_units = 0
    surplus_value = 0.0
    for code, s in stock.items():
        days = s["real"] / s["daily"] if s["daily"] else 999
        if days <= 7:
            crit += 1
            if worst is None or days < worst[1]:
                worst = (f"{MED[code][1]} {MED[code][2]}", round(days, 1))
        elif days <= 15:
            warn += 1
        if s["dvdms"] and s["dvdms"] - s["real"] >= 0.4 * s["dvdms"]:
            phantom += 1
        used = 0
        for b in sorted(s["batches"], key=lambda b: b["expiry"]):
            d2e = (date.fromisoformat(b["expiry"]) - TODAY).days
            if 0 <= d2e <= EXPIRY_WINDOW:
                can_use = max(0, s["daily"] * d2e - used)
                waste = max(0, b["qty"] - can_use)
                surplus_units += waste
                surplus_value += waste * PRICES.get(code, 1.0)
            used += b["qty"]
    risk = "high" if crit >= 3 else "medium" if crit >= 1 else "low"
    return {"id": fac.id, "name": fac.name, "kind": fac.kind, "district": fac.district, "lat": fac.lat, "lon": fac.lon,
            "demo": fac.demo, "village": fac.village, "block": fac.block,
            "critical": crit, "warning": warn, "phantom": phantom, "worst": worst, "risk": risk,
            "expiry_units": int(surplus_units), "expiry_value": round(surplus_value),
            "scanned": any(v.get("source") == "register" for v in stock.values())}


_DISTRICT_CACHE: Dict[str, List[dict]] = {}


def invalidate(district: Optional[str] = None):
    if district:
        _DISTRICT_CACHE.pop(district, None)
    else:
        _DISTRICT_CACHE.clear()
    _STATE_CACHE.clear()


def district_facilities(district: str) -> List[dict]:
    if district in _DISTRICT_CACHE:
        return _DISTRICT_CACHE[district]
    with Session(engine) as s:
        facs = s.exec(select(PHC).where(PHC.district == district)).all()
        out = [facility_summary(f, facility_stock(s, f)) for f in facs]
    out.sort(key=lambda x: (-x["critical"], -x["phantom"]))
    _DISTRICT_CACHE[district] = out
    return out


_STATE_CACHE: Dict[str, dict] = {}


def state_overview() -> dict:
    if "v" in _STATE_CACHE:
        return _STATE_CACHE["v"]
    with Session(engine) as s:
        districts = sorted({d for d in s.exec(select(PHC.district)).all()})
    rows = []
    for d in districts:
        f = district_facilities(d)
        n = len(f)
        high = sum(1 for x in f if x["risk"] == "high")
        rows.append({"district": d, "facilities": n, "high_risk": high, "high_pct": round(100 * high / n, 1) if n else 0,
                     "critical_lines": sum(x["critical"] for x in f), "phantom_lines": sum(x["phantom"] for x in f),
                     "expiry_value": sum(x["expiry_value"] for x in f),
                     "kinds": {k: sum(1 for x in f if x["kind"] == k) for k in ("DH", "CHC", "PHC", "HWC")}})
    tot = {"districts": len(rows), "facilities": sum(r["facilities"] for r in rows),
           "high_risk": sum(r["high_risk"] for r in rows), "critical_lines": sum(r["critical_lines"] for r in rows),
           "expiry_value": sum(r["expiry_value"] for r in rows)}
    _STATE_CACHE["v"] = {"totals": tot, "districts": rows}
    return _STATE_CACHE["v"]


def facility_detail(fid: str) -> Optional[dict]:
    with Session(engine) as s:
        f = s.get(PHC, fid)
        if not f:
            return None
        stock = facility_stock(s, f)
        summ = facility_summary(f, stock)
    lines = []
    for code, v in stock.items():
        m = MED[code]
        days = round(v["real"] / v["daily"], 1) if v["daily"] else None
        dv_days = round(v["dvdms"] / v["daily"], 1) if v["daily"] else None
        lines.append({"med_code": code, "med_name": f"{m[1]} {m[2]}", "unit": m[4], "register": v["real"], "dvdms": v["dvdms"],
                      "daily": v["daily"], "days_real": days, "days_dvdms": dv_days, "source": v.get("source"),
                      "status": "critical" if days is not None and days <= 7 else "warning" if days is not None and days <= 15 else "ok",
                      "next_expiry": min((b["expiry"] for b in v["batches"]), default=None)})
    lines.sort(key=lambda x: (x["days_real"] if x["days_real"] is not None else 999))
    return {**summ, "lines": lines}


# ---------------- Phase 3: expiry redistribution ----------------
def haversine(a_lat, a_lon, b_lat, b_lon):
    r = 6371.0
    p1, p2 = math.radians(a_lat), math.radians(b_lat)
    dp, dl = p2 - p1, math.radians(b_lon - a_lon)
    h = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(h))


def redistribution(district: str) -> dict:
    with Session(engine) as s:
        facs = [f for f in s.exec(select(PHC).where(PHC.district == district)).all() if f.lat is not None]
        stocks = {f.id: facility_stock(s, f) for f in facs}
        decisions = {d.transfer_id: d.decision for d in s.exec(select(TransferDecision)).all()}
    byid = {f.id: f for f in facs}
    donors = []   # (days_to_expiry, fid, code, batch, expiry, surplus)
    needs = {}    # code -> list of [fid, need_units, daily]
    for f in facs:
        for code, v in stocks[f.id].items():
            used = 0
            for b in sorted(v["batches"], key=lambda b: b["expiry"]):
                d2e = (date.fromisoformat(b["expiry"]) - TODAY).days
                if 0 < d2e <= EXPIRY_WINDOW:
                    can_use = max(0, v["daily"] * d2e - used)
                    surplus = int(b["qty"] - can_use)
                    if surplus >= 20:
                        donors.append((d2e, f.id, code, b["batch"], b["expiry"], surplus))
                used += b["qty"]
            days = v["real"] / v["daily"] if v["daily"] else 999
            if days < SHORT_DAYS:
                needs.setdefault(code, []).append([f.id, int(v["daily"] * TARGET_DAYS - v["real"]), v["daily"]])
    donors.sort()
    transfers = []
    for d2e, fid, code, batch, expiry, surplus in donors:
        a = byid[fid]
        cands = sorted(((haversine(a.lat, a.lon, byid[n[0]].lat, byid[n[0]].lon), n) for n in needs.get(code, []) if n[0] != fid and n[1] > 0),
                       key=lambda x: x[0])
        for km, n in cands:
            if surplus <= 0 or km > MAX_KM:
                break
            # receiver must be able to use it before it expires
            qty = int(min(surplus, n[1], n[2] * max(0, d2e - 3)))
            if qty < 10:
                continue
            m = MED[code]
            tid = hashlib.sha1(f"{fid}|{n[0]}|{code}|{batch}".encode()).hexdigest()[:10]
            b = byid[n[0]]
            transfers.append({
                "id": tid, "med_code": code, "med_name": f"{m[1]} {m[2]}", "unit": m[4], "qty": qty,
                "batch": batch, "expiry": expiry, "days_to_expiry": d2e,
                "from": {"id": a.id, "name": a.name, "kind": a.kind, "lat": a.lat, "lon": a.lon},
                "to": {"id": b.id, "name": b.name, "kind": b.kind, "lat": b.lat, "lon": b.lon},
                "km": round(km, 1), "value": round(qty * PRICES.get(code, 1.0)),
                "stockout_days_avoided": round(qty / n[2], 1),
                "decision": decisions.get(tid),
            })
            surplus -= qty
            n[1] -= qty
    transfers.sort(key=lambda t: (-t["value"], t["days_to_expiry"]))
    return {"district": district, "transfers": transfers,
            "totals": {"transfers": len(transfers), "units": sum(t["qty"] for t in transfers),
                       "value": sum(t["value"] for t in transfers),
                       "approved": sum(1 for t in transfers if t["decision"] == "approved")},
            "rules": {"expiry_window_days": EXPIRY_WINDOW, "short_days": SHORT_DAYS, "target_days": TARGET_DAYS, "max_km": MAX_KM}}


def decide(transfer_id: str, decision: str):
    with Session(engine) as s:
        row = s.get(TransferDecision, transfer_id)
        if row:
            row.decision, row.created = decision, datetime.now().isoformat(timespec="seconds")
        else:
            s.add(TransferDecision(transfer_id=transfer_id, decision=decision, created=datetime.now().isoformat(timespec="seconds")))
        s.commit()


def save_register_truth(session: Session, phc_id: str, rows: List[dict]):
    """Store the confirmed register reading so maps and dashboards use real numbers for this facility."""
    for old in session.exec(select(RegisterTruth).where(RegisterTruth.phc_id == phc_id)).all():
        session.delete(old)
    fac = session.get(PHC, phc_id)
    for r in rows:
        if not r.get("med_code") or r.get("closing") is None:
            continue
        code = r["med_code"]
        base = MED[code][6] * (fac.load if fac else 1.0)
        daily = r.get("issued") or max(1, round(base))
        session.add(RegisterTruth(phc_id=phc_id, med_code=code, batch=r.get("batch") or "", expiry=r.get("expiry") or "",
                                  closing=int(r["closing"]), daily=int(daily), created=datetime.now().isoformat(timespec="seconds")))
    session.commit()
    invalidate(fac.district if fac else None)
