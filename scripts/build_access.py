"""Village/town access to primary care, per district. Output: backend/data/up_access.json

For every OSM village/hamlet/town in UP: straight-line distance to the nearest PHC/CHC/district
hospital, which facility is nearest (its 'catchment'), and villages beyond 8 km ('access gaps').
"""
import json
from pathlib import Path

import numpy as np
from shapely.geometry import Point, shape
from shapely.strtree import STRtree

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "backend" / "data"
places = []
for line in (ROOT / "scripts" / "data" / "up_places.csv").read_text(encoding="utf-8").splitlines():
    p = line.split("|")
    if len(p) < 4:
        continue
    try:
        places.append((float(p[0]), float(p[1]), p[2], p[3]))
    except ValueError:
        continue
print("places", len(places))

gj = json.loads((DATA / "up_districts.geojson").read_text(encoding="utf-8"))
geoms = [shape(f["geometry"]) for f in gj["features"]]
names = [f["properties"]["name"] for f in gj["features"]]
tree = STRtree(geoms)

facs = [f for f in json.loads((DATA / "up_facilities.json").read_text(encoding="utf-8")) if f["kind"] in ("PHC", "CHC", "DH")]
F = np.array([[f["lat"], f["lon"]] for f in facs])
Frad = np.radians(F)

out = {}
catch = {}
by_d = {}
for lat, lon, kind, name in places:
    pt = Point(lon, lat)
    d = next((names[i] for i in tree.query(pt) if geoms[i].contains(pt)), None)
    if d:
        by_d.setdefault(d, []).append((lat, lon, kind, name))

for d, pl in by_d.items():
    P = np.radians(np.array([[p[0], p[1]] for p in pl]))
    dist = np.empty(len(pl))
    idx = np.empty(len(pl), dtype=int)
    for s in range(0, len(pl), 2000):
        a = P[s:s + 2000]
        dlat = a[:, None, 0] - Frad[None, :, 0]
        dlon = a[:, None, 1] - Frad[None, :, 1]
        h = np.sin(dlat / 2) ** 2 + np.cos(a[:, None, 0]) * np.cos(Frad[None, :, 0]) * np.sin(dlon / 2) ** 2
        km = 2 * 6371 * np.arcsin(np.sqrt(h))
        idx[s:s + 2000] = km.argmin(1)
        dist[s:s + 2000] = km.min(1)
    far = [(pl[i], dist[i]) for i in np.argsort(-dist) if dist[i] > 8]
    for i in range(len(pl)):
        fid = facs[idx[i]]["id"]
        catch[fid] = catch.get(fid, 0) + 1
    out[d] = {
        "villages": sum(1 for p in pl if p[2] in ("village", "hamlet")),
        "towns": sum(1 for p in pl if p[2] in ("town", "city")),
        "median_km": round(float(np.median(dist)), 1),
        "over_5km": int((dist > 5).sum()), "over_8km": int((dist > 8).sum()), "over_12km": int((dist > 12).sum()),
        "far_places": [{"name": p[3], "kind": p[2], "lat": round(p[0], 5), "lon": round(p[1], 5), "km": round(float(k), 1)}
                       for p, k in far[:300]],
    }
json.dump({"districts": out, "catchment": catch, "source": "OpenStreetMap place points; straight-line distance"},
          open(DATA / "up_access.json", "w", encoding="utf-8"), ensure_ascii=False)
tot = sum(v["villages"] for v in out.values())
print("districts", len(out), "villages", tot, "over 8km", sum(v["over_8km"] for v in out.values()))
