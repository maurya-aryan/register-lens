"""Build Uttar Pradesh facility + district data from OpenStreetMap extracts.

Inputs  (scripts/data/): up_health.json (Overpass facilities), up_districts.json (district relations)
Outputs (backend/data/): up_facilities.json, up_districts.geojson (simplified boundaries)
Data (c) OpenStreetMap contributors, ODbL.
"""
import json
import re
from pathlib import Path

from shapely.geometry import Point, mapping
from shapely.ops import linemerge, polygonize, unary_union
from shapely.strtree import STRtree
from shapely.geometry import LineString

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "scripts" / "data"
OUT = ROOT / "backend" / "data"
OUT.mkdir(parents=True, exist_ok=True)

# ---- districts ----
rels = json.load(open(SRC / "up_districts.json", encoding="utf-8"))["elements"]
districts = []
for r in rels:
    name = r.get("tags", {}).get("name:en") or r.get("tags", {}).get("name", "")
    name = re.sub(r"\s+district$", "", name, flags=re.I).strip()
    lines = [LineString([(p["lon"], p["lat"]) for p in m["geometry"]])
             for m in r.get("members", []) if m.get("type") == "way" and m.get("role") in ("outer", "") and m.get("geometry")]
    if not lines:
        continue
    polys = list(polygonize(linemerge(unary_union(lines))))
    if not polys:
        continue
    geom = unary_union(polys)
    districts.append({"name": name, "geom": geom})
print("districts:", len(districts))

tree = STRtree([d["geom"] for d in districts])


def district_of(lon, lat):
    pt = Point(lon, lat)
    for i in tree.query(pt):
        if districts[i]["geom"].contains(pt):
            return districts[i]["name"]
    return None


# ---- facilities ----
els = json.load(open(SRC / "up_health.json", encoding="utf-8"))["elements"]
KIND = [
    ("PHC", r"\b(phc|p\.\s?h\.\s?c|primary health|prathmik|प्राथमिक)"),
    ("CHC", r"\b(chc|c\.\s?h\.\s?c|community health|samudayik|सामुदायिक)"),
    ("HWC", r"(sub ?cent|subcent|\bhwc\b|health (and|&) wellness|ayushman arogya|upkendra|उपकेंद्र)"),
    ("DH", r"(district (hospital|women)|zila|जिला)"),
]
facs = []
seen = set()
for e in els:
    t = e.get("tags", {})
    name = (t.get("name:en") or t.get("name") or "").strip()
    lat = e.get("lat") or e.get("center", {}).get("lat")
    lon = e.get("lon") or e.get("center", {}).get("lon")
    if not name or lat is None:
        continue
    kind = next((k for k, rx in KIND if re.search(rx, name.lower())), None)
    if not kind:
        continue
    key = (name.lower(), round(lat, 3), round(lon, 3))
    if key in seen:
        continue
    seen.add(key)
    dist = district_of(lon, lat)
    if not dist:
        continue
    facs.append({"name": name, "kind": kind, "lat": round(lat, 6), "lon": round(lon, 6), "district": dist,
                 "village": t.get("addr:village") or t.get("addr:city") or t.get("addr:place") or ""})

facs.sort(key=lambda f: (f["district"], f["kind"], f["name"]))
for i, f in enumerate(facs):
    f["id"] = f"F{i+1:05d}"
json.dump(facs, open(OUT / "up_facilities.json", "w", encoding="utf-8"), ensure_ascii=False)

feats = []
for d in districts:
    g = d["geom"].simplify(0.01, preserve_topology=True)
    n = sum(1 for f in facs if f["district"] == d["name"])
    c = d["geom"].representative_point()
    feats.append({"type": "Feature", "properties": {"name": d["name"], "facilities": n, "lat": round(c.y, 4), "lon": round(c.x, 4)},
                  "geometry": mapping(g)})
json.dump({"type": "FeatureCollection", "features": feats}, open(OUT / "up_districts.geojson", "w", encoding="utf-8"))

from collections import Counter
print("facilities:", len(facs), Counter(f["kind"] for f in facs))
print("districts with facilities:", len({f["district"] for f in facs}))
print("Barabanki:", Counter(f["kind"] for f in facs if f["district"] == "Barabanki"))
