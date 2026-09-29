import json
import time
import uuid
from datetime import date
from pathlib import Path
from typing import List, Optional

from fastapi import Depends, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from sqlmodel import Session, select

from . import analysis, config, preprocess
from .db import PHC, DvdmsStock, Medicine, Submission, get_session, seed
from .gemini_reader import read_register

app = FastAPI(title="Register Lens API")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


@app.on_event("startup")
def _startup():
    seed()


@app.get("/api/health")
def health():
    return {"ok": True, "gemini_key_set": bool(config.GEMINI_API_KEY), "read_models": config.READ_MODELS,
            "pro_model": config.PRO_MODEL}


@app.get("/api/phcs")
def phcs(session: Session = Depends(get_session)):
    return [p.model_dump() for p in session.exec(select(PHC)).all()]


@app.get("/api/samples")
def samples():
    out = []
    for p in sorted(config.SAMPLES_DIR.glob("*.png")) + sorted(config.SAMPLES_DIR.glob("*.jpg")):
        out.append({"name": p.name, "url": f"/api/sample-image/{p.name}", "thumb": f"/api/sample-thumb/{p.name}"})
    return out


@app.get("/api/sample-image/{name}")
def sample_image(name: str):
    p = (config.SAMPLES_DIR / Path(name).name)
    if not p.exists():
        raise HTTPException(404)
    return FileResponse(p)


@app.get("/api/sample-thumb/{name}")
def sample_thumb(name: str):
    from PIL import Image
    src = config.SAMPLES_DIR / Path(name).name
    if not src.exists():
        raise HTTPException(404)
    dst = config.CACHE_DIR / f"thumb_{src.stem}.jpg"
    if not dst.exists():
        im = Image.open(src).convert("RGB")
        w, h = im.size
        im = im.crop((int(w * 0.08), int(h * 0.08), int(w * 0.92), int(h * 0.92)))
        im.thumbnail((420, 560))
        im.save(dst, quality=80)
    return FileResponse(dst)


@app.get("/api/uploads/{name}")
def upload_file(name: str):
    p = config.UPLOAD_DIR / Path(name).name
    if not p.exists():
        raise HTTPException(404)
    return FileResponse(p)


def _run_scan(image_bytes: bytes, phc_id: str, session: Session, use_cache: bool, tag: str = ""):
    if not session.get(PHC, phc_id):
        raise HTTPException(404, "Unknown PHC")
    try:
        cleaned, original, steps = preprocess.clean(image_bytes)
    except ValueError as e:
        raise HTTPException(400, str(e))
    sid = uuid.uuid4().hex[:10]
    (config.UPLOAD_DIR / f"{sid}_original.png").write_bytes(original)
    (config.UPLOAD_DIR / f"{sid}_clean.png").write_bytes(cleaned)
    t0 = time.time()
    try:
        page, meta = read_register(cleaned, use_cache=use_cache, tag=tag)
    except RuntimeError as e:
        raise HTTPException(502, f"The AI reader is unavailable right now: {e}")
    meds = session.exec(select(Medicine)).all()
    rows = analysis.prepare_rows([r.model_dump() for r in page.rows], meds)
    return {
        "scan_id": sid,
        "original_url": f"/api/uploads/{sid}_original.png",
        "clean_url": f"/api/uploads/{sid}_clean.png",
        "steps": steps,
        "page_date": page.page_date,
        "facility_written": page.facility_written,
        "rows": rows,
        "meta": {**meta, "total_seconds": round(time.time() - t0, 1)},
        "low_conf_threshold": config.LOW_CONF,
    }


@app.post("/api/scan")
async def scan(file: UploadFile = File(...), phc_id: str = Form(...), session: Session = Depends(get_session)):
    data = await file.read()
    if len(data) > 15 * 1024 * 1024:
        raise HTTPException(413, "Image too large (max 15 MB)")
    return _run_scan(data, phc_id, session, use_cache=True)


@app.post("/api/scan-sample")
def scan_sample(name: str = Form(...), phc_id: str = Form(...), session: Session = Depends(get_session)):
    p = config.SAMPLES_DIR / Path(name).name
    if not p.exists():
        raise HTTPException(404, "Sample not found")
    return _run_scan(p.read_bytes(), phc_id, session, use_cache=True)


class ReconcileIn(BaseModel):
    phc_id: str
    rows: List[dict]


@app.post("/api/reconcile")
def reconcile(body: ReconcileIn, session: Session = Depends(get_session)):
    if not session.get(PHC, body.phc_id):
        raise HTTPException(404, "Unknown PHC")
    rec = analysis.reconcile(session, body.phc_id, body.rows)
    session.add(Submission(phc_id=body.phc_id, created=date.today().isoformat(), summary=json.dumps(rec["summary"])))
    session.commit()
    return rec


class ExportIn(BaseModel):
    phc_id: str
    rows: List[dict]
    entry_date: Optional[str] = None


@app.post("/api/export")
def export(body: ExportIn, session: Session = Depends(get_session)):
    phc = session.get(PHC, body.phc_id)
    if not phc:
        raise HTTPException(404, "Unknown PHC")
    data = analysis.build_bulk_entry(phc, body.rows, body.entry_date or date.today().isoformat())
    return Response(data, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    headers={"Content-Disposition": f'attachment; filename="dvdms_bulk_entry_{phc.id}.xlsx"'})


class AlertIn(BaseModel):
    reconciliation: dict


@app.post("/api/alert")
def alert(body: AlertIn):
    return analysis.write_alert(body.reconciliation)


@app.get("/api/dashboard")
def dashboard(session: Session = Depends(get_session)):
    """District view. Uses the seeded DVDMS belief vs a simulated register truth for each PHC."""
    import random
    meds = {m.code: m for m in session.exec(select(Medicine)).all()}
    out = []
    for p in session.exec(select(PHC)).all():
        rng = random.Random(p.id)
        stock = session.exec(select(DvdmsStock).where(DvdmsStock.phc_id == p.id)).all()
        per_med = {}
        for s in stock:
            per_med[s.med_code] = per_med.get(s.med_code, 0) + s.qty
        crit, phantom = 0, 0
        worst = None
        for code, q in per_med.items():
            m = meds[code]
            daily = max(1, round(m.base_daily_issue * p.load))
            roll = rng.random()
            factor = rng.uniform(0.03, 0.22) if roll < 0.10 else rng.uniform(0.3, 0.7) if roll < 0.30 else rng.uniform(0.85, 1.05)
            real = int(q * factor)
            days_real = real / daily
            if days_real <= 7:
                crit += 1
                if worst is None or days_real < worst[1]:
                    worst = (f"{m.name} {m.strength}", round(days_real, 1))
            if q - real >= 0.4 * q:
                phantom += 1
        out.append({"id": p.id, "name": p.name, "block": p.block, "district": p.district,
                    "critical": crit, "phantom": phantom, "worst": worst,
                    "risk": "high" if crit >= 4 else "medium" if crit >= 2 else "low"})
    out.sort(key=lambda x: -x["critical"])
    return {"note": "Illustrative data: register truth is simulated for PHCs that have not yet scanned.", "phcs": out}


# Serve the built frontend if present
DIST = config.ROOT / "frontend" / "dist"
if DIST.exists():
    app.mount("/assets", StaticFiles(directory=DIST / "assets"), name="assets")

    @app.get("/{full_path:path}")
    def spa(full_path: str):
        f = DIST / full_path
        if full_path and f.is_file():
            return FileResponse(f)
        return FileResponse(DIST / "index.html")
