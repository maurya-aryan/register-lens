"""Headless-Chrome end-to-end test against the single-server build (http://localhost:8000).
Uploads a real (non-sample) photo file through the UI and walks every step."""
import sys
import time
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
shots = ROOT / "eval" / "shots"
shots.mkdir(parents=True, exist_ok=True)
photo = ROOT / "samples" / "pages" / (sys.argv[1] if len(sys.argv) > 1 else "reg_16_medium.jpg")
BASE = "http://localhost:8000"

with sync_playwright() as p:
    b = p.chromium.launch(channel="chrome", headless=True)
    pg = b.new_page(viewport={"width": 1440, "height": 900})
    errors = []
    pg.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
    pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.goto(BASE + "/")
    pg.wait_for_timeout(1200)
    pg.get_by_role("link", name="Scan a Register").first.click()
    pg.wait_for_url("**/scan")
    pg.select_option("select", "P03")
    t0 = time.time()
    if len(sys.argv) > 2 and sys.argv[2] == "sample":
        pg.locator("button:has-text('Page 02')").click()
    else:
        pg.set_input_files("input[type=file]", str(photo))
    pg.wait_for_selector("text=Check what Gemini read", timeout=280000)
    print(f"review reached after {time.time()-t0:.0f}s")
    pg.wait_for_timeout(800)
    pg.screenshot(path=str(shots / "e2e_review.png"), full_page=False)
    rows = pg.locator("table.reg tbody tr").count()
    pending = pg.locator("text=/\\d+ need a look/").count()
    print("rows", rows, "| pending badge present:", bool(pending))
    # confirm anything flagged, then continue
    if pending:
        pg.get_by_role("button", name="Confirm all").click()
    pg.get_by_role("button", name="Compare with DVDMS").click()
    pg.wait_for_selector("text=DVDMS vs the register", timeout=30000)
    pg.wait_for_timeout(1800)
    pg.screenshot(path=str(shots / "e2e_reconcile.png"), full_page=False)
    print("reconcile cards", pg.locator("text=DVDMS shows").count())
    pg.get_by_role("button", name="Prepare DVDMS entry").click()
    pg.wait_for_selector("text=District alert", timeout=30000)
    pg.wait_for_selector("text=/Written by/", timeout=90000)
    pg.wait_for_timeout(500)
    pg.screenshot(path=str(shots / "e2e_sync.png"), full_page=False)
    with pg.expect_download() as d:
        pg.get_by_role("button", name="Download Excel file").click()
    dl = d.value
    out = shots / dl.suggested_filename
    dl.save_as(str(out))
    print("downloaded", dl.suggested_filename, out.stat().st_size, "bytes")
    print("alert source line:", pg.locator("text=/Written by/").first.inner_text())
    print("console errors:", errors[:5])
    b.close()
