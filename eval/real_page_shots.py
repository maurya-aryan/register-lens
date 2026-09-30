"""Walk the real handwritten page through the app (PC) and capture deck screenshots."""
from pathlib import Path
from playwright.sync_api import sync_playwright

OUT = Path(__file__).resolve().parents[1] / "docs" / "deck" / "img"
B = "http://localhost:8000"
with sync_playwright() as p:
    b = p.chromium.launch(channel="chrome", headless=True)
    pg = b.new_page(viewport={"width": 1440, "height": 900})
    pg.goto(B + "/scan"); pg.wait_for_selector("text=No register handy"); pg.wait_for_timeout(1200)
    pg.locator("button:has-text('Real handwritten page')").click()
    pg.wait_for_selector("text=Check what Gemini read", timeout=120000); pg.wait_for_timeout(1500)
    pg.evaluate("window.scrollTo(0, 250)"); pg.wait_for_timeout(600)
    pg.screenshot(path=str(OUT / "real_review.png"))
    # scroll the table to the Zinc / Hindi-numeral / correction rows
    pg.evaluate("document.querySelector('table.reg').parentElement.scrollTop = 520"); pg.wait_for_timeout(600)
    pg.screenshot(path=str(OUT / "real_review_zinc.png"))
    # fix Zinc closing 285 -> 275 on screen, then confirm and continue
    row = pg.locator("table.reg tbody tr", has_text="Zinc")
    row.locator("input").nth(6).fill("275"); pg.wait_for_timeout(500)
    if pg.locator("button:has-text('Confirm all')").count():
        pg.get_by_role("button", name="Confirm all").click()
    pg.get_by_role("button", name="Compare with DVDMS").click()
    pg.wait_for_selector("text=DVDMS vs the register", timeout=30000); pg.wait_for_timeout(2500)
    pg.screenshot(path=str(OUT / "real_reconcile.png"))
    pg.get_by_role("button", name="Prepare DVDMS entry").click()
    pg.wait_for_selector("text=/Written by|Could not write/", timeout=150000); pg.wait_for_timeout(800)
    pg.screenshot(path=str(OUT / "real_sync.png"))
    urdu = pg.locator("button:has-text('اردو')")
    if urdu.count():
        urdu.first.click(); pg.wait_for_timeout(600)
        pg.screenshot(path=str(OUT / "real_sync_urdu.png"))
    print("alert:", pg.locator("text=/Written by/").first.inner_text() if pg.locator("text=/Written by/").count() else "none")
    pg.goto(B + "/map?district=Gonda"); pg.wait_for_timeout(6000)
    pg.screenshot(path=str(OUT / "map_gonda.png"))
    b.close()
print("ok")
