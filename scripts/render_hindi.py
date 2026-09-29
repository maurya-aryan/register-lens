"""Pre-render Hindi drug-name images with real Devanagari shaping using system Chrome.

Pillow here has no complex-text-layout support, so conjuncts and i-matras come out wrong.
Chrome shapes them correctly. Output: scripts/hindi/<slug>_<n>.png (transparent, dark ink)
"""
import json
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))
from app.catalog import MEDICINES  # noqa: E402

OUT = ROOT / "scripts" / "hindi"
OUT.mkdir(parents=True, exist_ok=True)
FONT_DIR = (ROOT / "scripts" / "fonts").as_posix()

words = []
for code, name, strength, form, unit, aliases, base in MEDICINES:
    for a in aliases:
        if not a.isascii():
            words.append((code, a))

html = f"""<html><head><style>
@font-face {{ font-family: KalamR; src: url('file:///{FONT_DIR}/Kalam-Regular.ttf'); }}
@font-face {{ font-family: KalamL; src: url('file:///{FONT_DIR}/Kalam-Light.ttf'); }}
body {{ margin: 0; background: transparent; }}
.w {{ display: inline-block; padding: 14px 18px; font-size: 64px; white-space: nowrap; color: #1a2a70; }}
</style></head><body>
{''.join(f'<div><span class="w" id="w{i}" style="font-family:KalamR">{w}</span></div>' for i, (c, w) in enumerate(words))}
</body></html>"""

tmp = OUT / "_tmp.html"
tmp.write_text(html, encoding="utf-8")
index = {}
with sync_playwright() as p:
    b = p.chromium.launch(channel="chrome", headless=True)
    pg = b.new_page(viewport={"width": 1200, "height": 900})
    pg.goto(tmp.as_uri())
    pg.wait_for_timeout(800)
    pg.evaluate("document.fonts.ready")
    for i, (code, w) in enumerate(words):
        el = pg.locator(f"#w{i}")
        f = OUT / f"{code}_{i}.png"
        el.screenshot(path=str(f), omit_background=True)
        index.setdefault(w, []).append(f.name)
    b.close()
(OUT / "index.json").write_text(json.dumps(index, ensure_ascii=False, indent=1), encoding="utf-8")
tmp.unlink()
print(len(words), "hindi word images")
