"""Generate synthetic photographed handwritten stock-register pages plus answer keys.

Output: samples/pages/reg_XX.png and samples/answers/reg_XX.json
Pages mix English names, abbreviations and Hindi (Devanagari) names, and are degraded
to look like phone photos (perspective, shadow, blur, noise). Difficulty: easy/medium/hard.
"""
import json
import math
import random
import sys
from datetime import date, timedelta
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))
from app.catalog import MEDICINES, PHCS  # noqa: E402

FONTS = ROOT / "scripts" / "fonts"
OUT = ROOT / "samples" / "pages"
ANS = ROOT / "samples" / "answers"
OUT.mkdir(parents=True, exist_ok=True)
ANS.mkdir(parents=True, exist_ok=True)

W, H = 1700, 2200
COLS = [("Drug name", 500), ("Batch No", 220), ("Expiry", 170), ("Opening", 170), ("Received", 170), ("Issued", 170), ("Closing", 170)]
X0, Y0 = 60, 300
ROW_H = 118
N_ROWS = 14


def font(name, size):
    return ImageFont.truetype(str(FONTS / name), size)


HAND_LATIN = ["PatrickHand-Regular.ttf", "Caveat[wght].ttf"]
HAND_DEV = ["Kalam-Regular.ttf"]
HINDI_DIR = ROOT / "scripts" / "hindi"
HINDI_INDEX = json.loads((HINDI_DIR / "index.json").read_text(encoding="utf-8"))
INKS = [(20, 30, 110), (15, 15, 15), (30, 50, 140), (10, 60, 120)]


def draw_text_jitter(img, xy, text, fnt, ink, rng, jitter=2.0, rot=1.5, maxw=None):
    layer = Image.new("RGBA", (fnt.size * (len(text) + 3), int(fnt.size * 2.0)), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    d.text((10, 10), text, font=fnt, fill=ink + (235,))
    layer = layer.rotate(rng.uniform(-rot, rot), resample=Image.BICUBIC, expand=True)
    if maxw and layer.width > maxw + 40:
        s = (maxw + 40) / layer.width
        layer = layer.resize((int(layer.width * s), int(layer.height * s)), Image.LANCZOS)
    img.alpha_composite(layer, (int(xy[0] + rng.uniform(-jitter, jitter)) - 10, int(xy[1] + rng.uniform(-jitter, jitter)) - 10))


def draw_hindi(img, xy, word, rng, jitter, rot, maxw, height=78):
    im = Image.open(HINDI_DIR / rng.choice(HINDI_INDEX[word])).convert("RGBA")
    s = height / im.height
    im = im.resize((max(1, int(im.width * s)), height), Image.LANCZOS)
    im = im.rotate(rng.uniform(-rot, rot), resample=Image.BICUBIC, expand=True)
    if im.width > maxw:
        s = maxw / im.width
        im = im.resize((int(im.width * s), int(im.height * s)), Image.LANCZOS)
    img.alpha_composite(im, (int(xy[0] + rng.uniform(-jitter, jitter)), int(xy[1] - 6 + rng.uniform(-jitter, jitter))))


def paper_base(rng, tint):
    base = np.full((H, W, 3), tint, dtype=np.uint8).astype(np.float32)
    noise = np.random.default_rng(rng.randint(0, 10**6)).normal(0, 3.0, (H, W, 1))
    base += noise
    img = Image.fromarray(np.clip(base, 0, 255).astype(np.uint8)).convert("RGBA")
    d = ImageDraw.Draw(img)
    # faint ruled lines behind table
    for y in range(0, H, 46):
        d.line([(0, y), (W, y)], fill=(215, 225, 235, 80), width=1)
    return img


def make_rows(rng, n, phc_load):
    meds = rng.sample(MEDICINES, n)
    rows = []
    for code, name, strength, form, unit, aliases, base in meds:
        r = rng.random()
        if r < 0.45:
            written = name if len(name) <= 22 else name.split()[0]
        elif r < 0.75:
            written = rng.choice([a for a in aliases if a.isascii()] or [name])
        else:
            written = rng.choice([a for a in aliases if not a.isascii()] or [name])
        daily = max(1, round(base * phc_load))
        opening = int(daily * rng.uniform(4, 40))
        received = 0 if rng.random() < 0.7 else int(daily * rng.uniform(5, 20))
        issued = max(1, int(daily * rng.uniform(0.7, 1.3)))
        issued = min(issued, opening + received)
        closing = opening + received - issued
        exp = date.today() + timedelta(days=rng.randint(20, 720))
        batch = "".join(rng.choice("ABCDEFGHJKLMNPRSTUVW") for _ in range(2)) + str(rng.randint(1000, 9999))
        rows.append({"med_code": code, "written_name": written, "batch": batch,
                     "expiry": exp.strftime("%Y-%m"), "opening": opening, "received": received,
                     "issued": issued, "closing": closing})
    return rows


def render_page(idx, difficulty, seed):
    rng = random.Random(seed)
    phc = rng.choice(PHCS)
    page_date = date(2026, 9, rng.randint(15, 29))
    tint = (rng.randint(236, 250), rng.randint(232, 246), rng.randint(215, 236))
    img = paper_base(rng, tint)
    d = ImageDraw.Draw(img)
    ink = rng.choice(INKS)
    lat = rng.choice(HAND_LATIN)
    dev = rng.choice(HAND_DEV)
    jit = {"easy": 1.0, "medium": 2.5, "hard": 4.5}[difficulty]
    rot = {"easy": 0.8, "medium": 1.8, "hard": 3.0}[difficulty]

    # header
    d.text((X0, 80), "PHC STOCK REGISTER - Medicines", font=font("PatrickHand-Regular.ttf", 60), fill=(60, 60, 60, 255))
    draw_text_jitter(img, (X0, 170), f"{phc[1]}", font(lat, 58), ink, rng, jit, rot)
    draw_text_jitter(img, (X0 + 800, 170), f"Date: {page_date.strftime('%d/%m/%Y')}", font(lat, 58), ink, rng, jit, rot)

    # table grid
    x = X0
    d.rectangle([X0, Y0 - 60, X0 + sum(w for _, w in COLS), Y0], fill=(230, 236, 240, 255))
    for name, w in COLS:
        d.text((x + 12, Y0 - 50), name, font=font("PatrickHand-Regular.ttf", 38), fill=(50, 50, 50, 255))
        x += w
    total_w = sum(w for _, w in COLS)
    for r in range(N_ROWS + 1):
        y = Y0 + r * ROW_H
        d.line([(X0, y), (X0 + total_w, y)], fill=(70, 70, 70, 255), width=3)
    x = X0
    for _, w in COLS + [("", 0)]:
        d.line([(x, Y0 - 60), (x, Y0 + N_ROWS * ROW_H)], fill=(70, 70, 70, 255), width=3)
        x += w

    rows = make_rows(rng, N_ROWS, phc[5])
    for r, row in enumerate(rows):
        y = Y0 + r * ROW_H + 18
        x = X0 + 14
        is_dev = not row["written_name"].isascii()
        if is_dev:
            draw_hindi(img, (x, y), row["written_name"], rng, jit, rot, COLS[0][1] - 24)
        else:
            draw_text_jitter(img, (x, y), row["written_name"], font(lat, 54), ink, rng, jit, rot, maxw=COLS[0][1] - 24)
        x += COLS[0][1]
        draw_text_jitter(img, (x + 4, y), row["batch"], font(lat, 46), ink, rng, jit, rot, maxw=COLS[1][1] - 16)
        x += COLS[1][1]
        style = rng.random()
        exp_txt = f"{row['expiry'][5:7]}/{row['expiry'][2:4]}" if style < 0.6 else f"{int(row['expiry'][5:7])}/{row['expiry'][:4]}"
        draw_text_jitter(img, (x + 4, y), exp_txt, font(lat, 46), ink, rng, jit, rot, maxw=COLS[2][1] - 14)
        x += COLS[2][1]
        for key, (_, w) in zip(("opening", "received", "issued", "closing"), COLS[3:]):
            val = row[key]
            txt = "-" if (key == "received" and val == 0) else str(val)
            draw_text_jitter(img, (x + 10, y), txt, font(lat, 54), ink, rng, jit, rot, maxw=w - 18)
            x += w

    # ---- photo degradation ----
    page = img.convert("RGB")
    scene = Image.new("RGB", (W + 500, H + 500), (rng.randint(90, 150), rng.randint(70, 120), rng.randint(50, 90)))
    sd = ImageDraw.Draw(scene)
    for _ in range(60):  # wood grain
        y = rng.randint(0, scene.height)
        sd.line([(0, y), (scene.width, y + rng.randint(-20, 20))], fill=(rng.randint(70, 140), rng.randint(50, 100), rng.randint(30, 70)), width=rng.randint(2, 8))
    ox, oy = 250, 250
    scene.paste(page, (ox, oy))
    # perspective
    amt = {"easy": 25, "medium": 90, "hard": 170}[difficulty]
    src = [(ox, oy), (ox + W, oy), (ox + W, oy + H), (ox, oy + H)]
    dst = [(ox + rng.uniform(-amt, amt), oy + rng.uniform(-amt, amt)),
           (ox + W + rng.uniform(-amt, amt), oy + rng.uniform(-amt, amt)),
           (ox + W + rng.uniform(-amt, amt), oy + H + rng.uniform(-amt, amt)),
           (ox + rng.uniform(-amt, amt), oy + H + rng.uniform(-amt, amt))]
    a = []
    for (x1, y1), (x2, y2) in zip(dst, src):
        a.append([x1, y1, 1, 0, 0, 0, -x2 * x1, -x2 * y1])
        a.append([0, 0, 0, x1, y1, 1, -y2 * x1, -y2 * y1])
    A = np.array(a, dtype=np.float64)
    B = np.array([c for p in src for c in p], dtype=np.float64)
    coeffs = np.linalg.solve(A, B).tolist()
    scene = scene.transform(scene.size, Image.PERSPECTIVE, coeffs, Image.BICUBIC)
    scene = scene.rotate(rng.uniform(-rot * 2, rot * 2), resample=Image.BICUBIC, fillcolor=(100, 80, 60))
    arr = np.asarray(scene).astype(np.float32)
    # lighting gradient / shadow
    yy, xx = np.mgrid[0:arr.shape[0], 0:arr.shape[1]]
    ang = rng.uniform(0, math.pi * 2)
    grad = (xx * math.cos(ang) + yy * math.sin(ang)) / max(arr.shape)
    strength = {"easy": 0.08, "medium": 0.22, "hard": 0.4}[difficulty]
    shade = 1 - strength * (grad - grad.min()) / (grad.max() - grad.min())
    if difficulty != "easy":
        cx, cy = rng.uniform(0.2, 0.8) * arr.shape[1], rng.uniform(0.2, 0.8) * arr.shape[0]
        blob = np.exp(-(((xx - cx) ** 2 + (yy - cy) ** 2) / (2 * (arr.shape[1] * 0.18) ** 2)))
        shade *= 1 - (0.25 if difficulty == "medium" else 0.45) * blob
    arr *= shade[..., None]
    arr += np.random.default_rng(seed).normal(0, {"easy": 3, "medium": 6, "hard": 10}[difficulty], arr.shape)
    out = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))
    out = out.filter(ImageFilter.GaussianBlur({"easy": 0.5, "medium": 1.0, "hard": 1.8}[difficulty]))
    out.thumbnail((2000, 2000))
    name = f"reg_{idx:02d}_{difficulty}"
    out.save(OUT / f"{name}.jpg", quality={"easy": 92, "medium": 82, "hard": 68}[difficulty])
    key = {"file": f"{name}.jpg", "difficulty": difficulty, "facility": phc[1], "phc_id": phc[0],
           "page_date": page_date.isoformat(), "rows": rows}
    (ANS / f"{name}.json").write_text(json.dumps(key, ensure_ascii=False, indent=1), encoding="utf-8")
    return name


if __name__ == "__main__":
    plan = ["easy"] * 10 + ["medium"] * 12 + ["hard"] * 8
    n = int(sys.argv[1]) if len(sys.argv) > 1 else len(plan)
    for i in range(1, n + 1):
        print(render_page(i, plan[i - 1], seed=1000 + i))
