"""How well do the model's own confidence scores catch its mistakes?

Uses the stored readings in samples/readings against the answer keys.
A cell is 'flagged' if its confidence group is below the app threshold. We also count
rows whose balance check fails, since the app flags those too.
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))
from app import config  # noqa: E402
from app.schemas import RegisterPage  # noqa: E402
from app.analysis import batch_crosscheck  # noqa: E402

# batches DVDMS lists per (centre, medicine): the mock is seeded from the answer keys
KNOWN = {}
for _f in (ROOT / 'samples' / 'answers').glob('*.json'):
    _d = json.loads(_f.read_text(encoding='utf-8'))
    for _r in _d['rows']:
        KNOWN.setdefault((_d['phc_id'], _r['med_code']), set()).add((_r['batch'], _r['expiry']))

thr = config.LOW_CONF
tot_cells = wrong = wrong_flagged = 0
rows_total = rows_wrong = rows_wrong_caught = 0
xcaught = [0]
xfalse = [0]
by_diff = {}
for f in sorted(config.READINGS_DIR.glob("*.json")):
    name = f.stem
    ans = ROOT / "samples" / "answers" / f"{name}.json"
    if not ans.exists():
        continue
    key = json.loads(ans.read_text(encoding="utf-8"))
    page = RegisterPage.model_validate(json.loads(f.read_text(encoding="utf-8"))["page"])
    d = by_diff.setdefault(key["difficulty"], {"rows": 0, "wrong_rows": 0, "caught": 0, "pages": 0})
    d["pages"] += 1
    for r, k in zip(page.rows, key["rows"]):
        checks = {
            "batch": ((r.batch or "").replace(" ", "").upper() == k["batch"], r.confidence.batch),
            "expiry": ((r.expiry or "") == k["expiry"], r.confidence.expiry),
            "qty": ((r.opening, r.received or 0, r.issued, r.closing) == (k["opening"], k["received"], k["issued"], k["closing"]), r.confidence.qty),
        }
        row_wrong = False
        row_caught = False
        for group, (ok, conf) in checks.items():
            tot_cells += 1
            if not ok:
                wrong += 1
                row_wrong = True
                if conf < thr:
                    wrong_flagged += 1
                    row_caught = True
        known = sorted(KNOWN.get((key["phc_id"], k["med_code"]), []))
        xflags = batch_crosscheck({"batch": r.batch, "expiry": r.expiry}, known)
        crosscheck_hit = any(f["level"] == "warn" for f in xflags)
        balance_bad = None in (r.opening, r.issued, r.closing) or (r.opening + (r.received or 0) - r.issued != r.closing)
        if row_wrong and (balance_bad or crosscheck_hit):
            row_caught = True
        if row_wrong and crosscheck_hit:
            xcaught[0] += 1
        if (not row_wrong) and crosscheck_hit:
            xfalse[0] += 1
        d["rows"] += 1
        rows_total += 1
        if row_wrong:
            d["wrong_rows"] += 1
            rows_wrong += 1
            if row_caught:
                d["caught"] += 1
                rows_wrong_caught += 1

print(f"pages read: {sum(v['pages'] for v in by_diff.values())}; rows: {rows_total}; cell groups checked: {tot_cells}")
print(f"cell groups wrong: {wrong}; flagged by confidence: {wrong_flagged}")
print(f"DVDMS batch cross-check: caught {xcaught[0]} wrong rows, false alarms on correct rows: {xfalse[0]}")
print(f"rows with any error: {rows_wrong}; caught (low confidence or balance check): {rows_wrong_caught}")
for k, v in by_diff.items():
    print(f"  {k}: pages={v['pages']} rows={v['rows']} rows_with_error={v['wrong_rows']} caught={v['caught']}")
