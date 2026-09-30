"""Phone-size screenshots of every page + horizontal overflow check."""
from pathlib import Path
from playwright.sync_api import sync_playwright

OUT = Path(__file__).resolve().parent / "shots" / "mobile"
OUT.mkdir(parents=True, exist_ok=True)
pages = [("/", "home"), ("/scan", "scan"), ("/map", "map"), ("/map?district=Barabanki", "district"), ("/redistribute?district=Barabanki", "redistribute")]
with sync_playwright() as p:
    b = p.chromium.launch(channel="chrome", headless=True)
    ctx = b.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
    pg = ctx.new_page()
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    for path, name in pages:
        pg.goto("http://localhost:8000" + path)
        pg.wait_for_timeout(3500)
        ov = pg.evaluate("""() => { const w = document.documentElement.clientWidth; return [...document.querySelectorAll('body *')].filter(e => { const r = e.getBoundingClientRect(); return r.right > w + 2 && r.width > 0 && getComputedStyle(e).position !== 'fixed'; }).slice(0, 5).map(e => e.tagName + '.' + String(e.className).slice(0, 50)); }""")
        sw = pg.evaluate("document.documentElement.scrollWidth")
        print(name, "scrollWidth", sw, "overflow:", ov)
        pg.screenshot(path=str(OUT / f"{name}.png"))
    # scan flow with a sample page
    pg.goto("http://localhost:8000/scan")
    pg.wait_for_selector("text=No register handy")
    pg.locator("button:has-text('Page 01')").click()
    pg.wait_for_selector("text=Check what Gemini read", timeout=120000)
    pg.wait_for_timeout(1000)
    pg.screenshot(path=str(OUT / "review.png"))
    pg.evaluate("window.scrollTo(0, 900)")
    pg.wait_for_timeout(500)
    pg.screenshot(path=str(OUT / "review2.png"))
    print("errors:", errs[:5])
    b.close()
