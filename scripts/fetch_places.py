"""Fetch UP village/town points from OSM Overpass in bbox tiles, with retries. Output: scripts/data/up_places.csv"""
import time
import urllib.parse
import urllib.request
from pathlib import Path

OUT = Path(__file__).resolve().parent / "data"
EPS = ["https://overpass.private.coffee/api/interpreter", "https://overpass-api.de/api/interpreter",
       "https://overpass.kumi.systems/api/interpreter"]
S, N, W, E = 23.8, 30.5, 77.0, 84.7
rows, cols = 4, 4
tiles = [(S + (N - S) * i / rows, W + (E - W) * j / cols, S + (N - S) * (i + 1) / rows, W + (E - W) * (j + 1) / cols)
         for i in range(rows) for j in range(cols)]
lines = set()
for t, (s, w, n, e) in enumerate(tiles):
    q = (f'[out:csv(::lat,::lon,place,name;false;"|")][timeout:180];'
         f'node["place"~"^(village|hamlet|town|city)$"]({s},{w},{n},{e});out;')
    for attempt in range(8):
        ep = EPS[attempt % len(EPS)]
        try:
            req = urllib.request.Request(ep, data=urllib.parse.urlencode({"data": q}).encode(),
                                         headers={"User-Agent": "RegisterLens-hackathon/1.0"})
            txt = urllib.request.urlopen(req, timeout=200).read().decode("utf-8")
            if "<html" in txt[:200].lower():
                raise RuntimeError("busy")
            new = [l for l in txt.splitlines() if l.count("|") >= 3]
            lines.update(new)
            print(f"tile {t+1}/{len(tiles)} ok {len(new)} (total {len(lines)})", flush=True)
            break
        except Exception as ex:  # noqa: BLE001
            print(f"tile {t+1} attempt {attempt+1} {ep.split('/')[2]} failed: {str(ex)[:60]}", flush=True)
            time.sleep(15 + 10 * attempt)
    else:
        print(f"tile {t+1} GAVE UP", flush=True)
(OUT / "up_places.csv").write_text("\n".join(sorted(lines)), encoding="utf-8")
print("DONE", len(lines), flush=True)
