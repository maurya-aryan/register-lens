"""Read the gallery sample pages once with Gemini and store the readings in samples/readings/.

After this the demo's "Try a sample page" needs no API calls. Also scores each page against
its answer key (cleaned pipeline) and writes eval/results/prewarm_scores.json.
Usage: python scripts/prewarm_samples.py [name ...]   (default: the curated gallery set)
"""
import json
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))
sys.path.insert(0, str(ROOT / "eval"))
from app import config, preprocess  # noqa: E402
from app.gemini_reader import read_register  # noqa: E402
from run_eval import score  # noqa: E402

GALLERY = ["reg_01_easy", "reg_02_easy", "reg_03_easy", "reg_04_easy", "reg_05_easy", "reg_06_easy",
           "reg_11_medium", "reg_12_medium", "reg_13_medium", "reg_14_medium", "reg_24_hard", "reg_28_hard"]

names = sys.argv[1:] or GALLERY
out = ROOT / "eval" / "results"
out.mkdir(parents=True, exist_ok=True)
scores_file = out / "prewarm_scores.json"
scores = json.loads(scores_file.read_text(encoding="utf-8")) if scores_file.exists() else {}

for name in names:
    key = json.loads((ROOT / "samples" / "answers" / f"{name}.json").read_text(encoding="utf-8"))
    path = ROOT / "samples" / "pages" / key["file"]
    store = config.READINGS_DIR / f"{name}.json"
    t = time.time()
    cleaned, _, _ = preprocess.clean(path.read_bytes())
    try:
        page, meta = read_register(cleaned, use_cache=True, store_path=store)
    except Exception as e:  # noqa: BLE001
        print(f"{name}: FAILED {str(e)[:160]}", flush=True)
        continue
    hit, tot = score(page, key)
    scores[name] = {"difficulty": key["difficulty"], "hit": hit, "tot": tot, "model": meta["model"]}
    pct = lambda k: f"{100 * hit[k] / tot[k]:.0f}%"  # noqa: E731
    print(f"{name} [{key['difficulty']}] model={meta['model']} {time.time()-t:.0f}s  name={pct('name')} batch={pct('batch')} "
          f"expiry={pct('expiry')} qty={pct('qty')} full-row={pct('rows_row_exact')}", flush=True)
    scores_file.write_text(json.dumps(scores, ensure_ascii=False, indent=1), encoding="utf-8")
