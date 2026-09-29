"""Walk the sample flow in headless Chrome and save screenshots for the deck/README."""
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "deck" / "img"
OUT.mkdir(parents=True, exist_ok=True)
BASE = "http://localhost:8000"
page_label = sys.argv[1] if len(sys.argv) > 1 else "Page 01"

with sync_playwright() as p:
    b = p.chromium.launch(channel="chrome", headless=True)
    pg = b.new_page(viewport={"width": 1440, "height": 900}, device_scale_factor=1)
    pg.goto(BASE + "/")
    pg.wait_for_timeout(2500)
    pg.screenshot(path=str(OUT / "01_home.png"))
    pg.goto(BASE + "/scan")
    pg.wait_for_selector("text=No register handy")
    pg.wait_for_timeout(1500)
    pg.screenshot(path=str(OUT / "02_capture.png"))
    pg.locator(f"button:has-text('{page_label}')").click()
    pg.wait_for_selector("text=Check what Gemini read", timeout=120000)
    pg.wait_for_timeout(1200)
    pg.screenshot(path=str(OUT / "03_review.png"))
    if pg.locator("button:has-text('Confirm all')").count():
        pg.get_by_role("button", name="Confirm all").click()
    pg.get_by_role("button", name="Compare with DVDMS").click()
    pg.wait_for_selector("text=DVDMS vs the register", timeout=30000)
    pg.wait_for_timeout(2200)
    pg.screenshot(path=str(OUT / "04_reconcile.png"))
    pg.get_by_role("button", name="Prepare DVDMS entry").click()
    pg.wait_for_selector("text=/Written by|Could not write/", timeout=120000)
    pg.wait_for_timeout(800)
    pg.screenshot(path=str(OUT / "05_sync.png"))
    print("alert line:", pg.locator("text=/Written by/").first.inner_text() if pg.locator("text=/Written by/").count() else "none")
    pg.goto(BASE + "/dashboard")
    pg.wait_for_selector("text=Barabanki district")
    pg.wait_for_timeout(2500)
    pg.screenshot(path=str(OUT / "06_dashboard.png"))
    b.close()
print("shots saved to", OUT)
