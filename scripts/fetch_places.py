"""Fetch UP village/town points from OSM Overpass in small tiles, resumable.

Each tile is saved to scripts/data/tiles/ as soon as it arrives, so a restart continues where it
stopped. Tiles that don't touch Uttar Pradesh are skipped. Output: scripts/data/up_places.csv
"""
import json
import time
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from shapely.geometry import box, shape
from shapely.ops import unary_union

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "scripts" / "data"
TILES = OUT / "tiles"
TILES.mkdir(parents=True, exist_ok=True)
EPS = ["https://overpass.private.coffee/api/interpreter", "https://overpass-api.de/api/interpreter",
       "https://overpass.kumi.systems/api/interpreter"]
S, N, W, E = 23.8, 30.5, 77.0, 84.7
R = C = 8
up = unary_union([shape(f["geometry"]) for f in json.loads((ROOT / "backend" / "data" / "up_districts.geojson").read_text(encoding="utf-8"))["features"]])
tiles = []
for i in range(R):
    for j in range(C):
        s, w = S + (N - S) * i / R, W + (E - W) * j / C
        n, e = S + (N - S) * (i + 1) / R, W + (E - W) * (j + 1) / C
        if box(w, s, e, n).intersects(up):
            tiles.append((i * C + j, s, w, n, e))
todo = [t for t in tiles if not (TILES / f"t{t[0]:02d}.txt").exists()]
print(f"{len(tiles)} tiles touch UP; {len(tiles) - len(todo)} already saved; {len(todo)} to fetch", flush=True)


def fetch(t):
    k, s, w, n, e = t
    q = (f'[out:csv(::lat,::lon,place,name;false;"|")][timeout:90];'
         f'node["place"~"^(village|hamlet|town|city)$"]({s},{w},{n},{e});out;')
    for attempt in range(12):
        ep = EPS[(k + attempt) % len(EPS)]
        try:
            req = urllib.request.Request(ep, data=urllib.parse.urlencode({"data": q}).encode(),
                                         headers={"User-Agent": "RegisterLens-hackathon/1.0"})
            txt = urllib.request.urlopen(req, timeout=120).read().decode("utf-8")
            if "<html" in txt[:300].lower() or "runtime error" in txt[:500].lower():
                raise RuntimeError("busy")
            rows = [l for l in txt.splitlines() if l.count("|") >= 3]
            (TILES / f"t{k:02d}.txt").write_text("\n".join(rows), encoding="utf-8")
            done = len(list(TILES.glob("t*.txt")))
            print(f"tile {k} ok {len(rows)} places ({done}/{len(tiles)} saved)", flush=True)
            return
        except Exception as ex:  # noqa: BLE001
            print(f"tile {k} try {attempt + 1} {ep.split('/')[2]}: {str(ex)[:40]}", flush=True)
            time.sleep(6 + 4 * attempt)
    print(f"tile {k} GAVE UP", flush=True)


with ThreadPoolExecutor(max_workers=3) as ex:
    list(ex.map(fetch, todo))

lines = set()
for f in TILES.glob("t*.txt"):
    lines.update(l for l in f.read_text(encoding="utf-8").splitlines() if l)
(OUT / "up_places.csv").write_text("\n".join(sorted(lines)), encoding="utf-8")
missing = [t[0] for t in tiles if not (TILES / f"t{t[0]:02d}.txt").exists()]
print("DONE", len(lines), "places; missing tiles:", missing, flush=True)
