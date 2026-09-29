import json
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))
from app import preprocess  # noqa: E402
from app.gemini_reader import read_register  # noqa: E402

name = sys.argv[1] if len(sys.argv) > 1 else "reg_02_easy"
raw = (ROOT / "samples" / "pages" / f"{name}.jpg").read_bytes()
cleaned, orig, steps = preprocess.clean(raw)
print("steps:", steps)
t = time.time()
page, meta = read_register(cleaned, use_cache=True)
print("meta:", meta, f"{time.time()-t:.1f}s")
key = json.loads((ROOT / "samples" / "answers" / f"{name}.json").read_text(encoding="utf-8"))
print("date", page.page_date, "facility", page.facility_written, "| truth", key["page_date"], key["facility"])
for r, k in zip(page.rows, key["rows"]):
    ok = (r.opening, r.received or 0, r.issued, r.closing) == (k["opening"], k["received"], k["issued"], k["closing"])
    print("OK " if ok else "BAD", r.drug_name_raw, "|", k["written_name"], "|", r.batch, k["batch"], "|", r.expiry, k["expiry"], "|",
          (r.opening, r.received, r.issued, r.closing), (k["opening"], k["received"], k["issued"], k["closing"]))
print(len(page.rows), "rows read vs", len(key["rows"]))
