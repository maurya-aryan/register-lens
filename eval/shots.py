"""Take desktop screenshots of the running app with system Chrome (for visual checks)."""
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

OUT = Path(__file__).resolve().parents[1] / "eval" / "shots"
OUT.mkdir(parents=True, exist_ok=True)
BASE = "http://127.0.0.1:5173"
pages = sys.argv[1:] or ["/"]

with sync_playwright() as p:
    b = p.chromium.launch(channel="chrome", headless=True)
    for path in pages:
        pg = b.new_page(viewport={"width": 1440, "height": 900})
        pg.goto(BASE + path)
        pg.wait_for_timeout(1500)
        h = pg.evaluate("document.documentElement.scrollHeight")
        # scroll through so scroll-triggered animations play
        y = 0
        while y < h:
            pg.evaluate(f"window.scrollTo(0,{y})")
            pg.wait_for_timeout(350)
            y += 500
        pg.evaluate("window.scrollTo(0,0)")
        pg.wait_for_timeout(600)
        name = (path.strip("/").replace("/", "_").replace("?", "_").replace("=", "") or "home")
        pg.screenshot(path=str(OUT / f"{name}_full.png"), full_page=True)
        print(name, "height", h)
        pg.close()
    b.close()
