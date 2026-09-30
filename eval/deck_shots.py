from pathlib import Path
from playwright.sync_api import sync_playwright

OUT = Path(__file__).resolve().parents[1] / "docs" / "deck" / "img"
B = "http://localhost:8000"
with sync_playwright() as p:
    b = p.chromium.launch(channel="chrome", headless=True)
    pg = b.new_page(viewport={"width": 1440, "height": 900})
    pg.goto(B + "/map"); pg.wait_for_timeout(5000); pg.screenshot(path=str(OUT / "07_map_up.png"))
    pg.goto(B + "/map?district=Barabanki"); pg.wait_for_timeout(5000)
    pg.locator("aside button:has-text('PHC Banki')").first.click(); pg.wait_for_timeout(2500)
    pg.screenshot(path=str(OUT / "08_map_district.png"))
    pg.goto(B + "/redistribute?district=Barabanki"); pg.wait_for_timeout(5000)
    pg.locator("button:has-text('Approve')").first.click(); pg.wait_for_timeout(300)
    pg.locator("button:has-text('Approve')").first.click(); pg.wait_for_timeout(1200)
    pg.screenshot(path=str(OUT / "09_transfers.png"))
    pg.goto(B + "/map?district=Barabanki"); pg.wait_for_timeout(3000)
    pg.locator("button[aria-label='Open assistant']").click(); pg.wait_for_timeout(600)
    pg.locator("button:has-text('Barabanki mein kaun se PHC')").click()
    pg.wait_for_selector("text=/Wrench|district data|facility stock|UP overview/", timeout=120000)
    pg.wait_for_timeout(1000)
    pg.screenshot(path=str(OUT / "10_chat.png"))
    ctx = b.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
    m = ctx.new_page()
    m.goto(B + "/"); m.wait_for_timeout(3000); m.screenshot(path=str(OUT / "11_mobile_home.png"))
    m.goto(B + "/scan"); m.wait_for_timeout(3000); m.screenshot(path=str(OUT / "12_mobile_scan.png"))
    m.goto(B + "/map?district=Barabanki"); m.wait_for_timeout(5000); m.screenshot(path=str(OUT / "13_mobile_map.png"))
    b.close()
print("ok")
