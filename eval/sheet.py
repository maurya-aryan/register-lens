import glob, os
from playwright.sync_api import sync_playwright
files = sorted(glob.glob('D:/RegisterLens/frontend/public/img/art/*.svg'))
html = '<html><body style="margin:0;background:#fff;display:grid;grid-template-columns:repeat(4,340px);gap:10px;padding:10px;font:14px sans-serif">' + ''.join(f'<div><img src="file:///{f}" width="330" height="240" style="object-fit:contain"><div>{os.path.basename(f)}</div></div>' for f in files) + '</body></html>'
open('D:/RegisterLens/eval/shots/sheet.html','w').write(html)
with sync_playwright() as p:
    b = p.chromium.launch(channel='chrome', headless=True)
    pg = b.new_page(viewport={'width':1440,'height':900})
    pg.goto('file:///D:/RegisterLens/eval/shots/sheet.html'); pg.wait_for_timeout(1000)
    pg.screenshot(path='D:/RegisterLens/eval/shots/sheet.png', full_page=True)
    b.close()
