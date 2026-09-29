"""Accuracy evaluation on the synthetic register pages.

For each page: read with Gemini (a) on the raw photo and (b) after OpenCV clean-up, and
compare cell by cell with the answer key. Results are cached, so re-running is cheap.
Usage: python eval/run_eval.py [--limit N] [--workers 4]
"""
import argparse
import json
import sys
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))
import cv2  # noqa: E402
import numpy as np  # noqa: E402
from rapidfuzz import fuzz  # noqa: E402

from app import preprocess  # noqa: E402
from app.gemini_reader import read_register  # noqa: E402

OUT = ROOT / "eval" / "results"
OUT.mkdir(parents=True, exist_ok=True)


def raw_png(path: Path) -> bytes:
    img = cv2.imdecode(np.frombuffer(path.read_bytes(), np.uint8), cv2.IMREAD_COLOR)
    h, w = img.shape[:2]
    f = min(1.0, 2400 / max(h, w))
    if f < 1:
        img = cv2.resize(img, None, fx=f, fy=f, interpolation=cv2.INTER_AREA)
    return cv2.imencode(".png", img)[1].tobytes()


def score(page, key):
    """Return dict of cell hits / totals. Rows are matched in order."""
    tot = {"name": 0, "batch": 0, "expiry": 0, "qty": 0, "rows_row_exact": 0}
    hit = {k: 0 for k in tot}
    for r, k in zip(page.rows, key["rows"]):
        tot["name"] += 1
        hit["name"] += int(fuzz.ratio((r.drug_name_raw or "").lower().strip(), k["written_name"].lower().strip()) >= 85)
        tot["batch"] += 1
        hit["batch"] += int((r.batch or "").replace(" ", "").upper() == k["batch"])
        tot["expiry"] += 1
        hit["expiry"] += int((r.expiry or "") == k["expiry"])
        truth = (k["opening"], k["received"], k["issued"], k["closing"])
        got = (r.opening, r.received or 0, r.issued, r.closing)
        for a, b in zip(got, truth):
            tot["qty"] += 1
            hit["qty"] += int(a == b)
        tot["rows_row_exact"] += 1
        hit["rows_row_exact"] += int(got == truth and (r.batch or "").upper() == k["batch"] and (r.expiry or "") == k["expiry"])
    missing = max(0, len(key["rows"]) - len(page.rows))
    for kk in ("name", "batch", "expiry", "rows_row_exact"):
        tot[kk] += missing
    tot["qty"] += missing * 4
    return hit, tot


def run_one(name: str):
    key = json.loads((ROOT / "samples" / "answers" / f"{name}.json").read_text(encoding="utf-8"))
    path = ROOT / "samples" / "pages" / key["file"]
    res = {"name": name, "difficulty": key["difficulty"]}
    for variant in ("raw", "clean"):
        png = raw_png(path) if variant == "raw" else preprocess.clean(path.read_bytes())[0]
        t = time.time()
        try:
            page, meta = read_register(png, use_cache=True, tag=f"_{variant}")
            hit, tot = score(page, key)
            res[variant] = {"hit": hit, "tot": tot, "model": meta["model"], "seconds": meta.get("seconds"), "escalated": meta["escalated"]}
        except Exception as e:  # noqa: BLE001
            res[variant] = {"error": str(e)[:200]}
        print(f"{name} {variant} {time.time()-t:.0f}s", flush=True)
    return res


def summarize(results):
    lines = []
    for variant in ("raw", "clean"):
        for group in ("all", "easy", "medium", "hard"):
            hit = {}
            tot = {}
            n = 0
            for r in results:
                v = r.get(variant)
                if not v or "hit" not in v or (group != "all" and r["difficulty"] != group):
                    continue
                n += 1
                for k in v["tot"]:
                    hit[k] = hit.get(k, 0) + v["hit"][k]
                    tot[k] = tot.get(k, 0) + v["tot"][k]
            if n:
                pct = lambda k: f"{100*hit[k]/tot[k]:.1f}%"  # noqa: E731
                lines.append(f"{variant:5s} {group:6s} pages={n:2d}  name={pct('name')} batch={pct('batch')} expiry={pct('expiry')} qty={pct('qty')} full-row={pct('rows_row_exact')}")
    return "\n".join(lines)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--workers", type=int, default=4)
    a = ap.parse_args()
    names = sorted(p.stem for p in (ROOT / "samples" / "answers").glob("*.json"))
    if a.limit:
        names = names[: a.limit]
    with ThreadPoolExecutor(max_workers=a.workers) as ex:
        results = list(ex.map(run_one, names))
    (OUT / "results.json").write_text(json.dumps(results, ensure_ascii=False, indent=1), encoding="utf-8")
    text = summarize(results)
    (OUT / "summary.txt").write_text(text, encoding="utf-8")
    print(text)
