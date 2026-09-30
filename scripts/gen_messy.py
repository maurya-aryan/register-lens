"""Messier synthetic register pages ("v2") that mimic real-world problems.

Variation per page: notebook with hand-drawn wobbly columns or no lines at all, handwritten header,
cursive hands, struck-through values rewritten beside them, Hindi (Devanagari) numerals,
blanks written as "nil"/"0"/"-", varied expiry formats, and photo damage (stains, fold, dim light,
motion blur, heavy JPEG). Output: samples/pages/messy_XX.jpg + samples/answers/messy_XX.json
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
sys.path.insert(0, str(ROOT / "scripts"))
import gen_registers as g  # noqa: E402

W, H = g.W, g.H
DEV_DIGITS = str.maketrans("0123456789", "०१२३४५६७८९")
LATIN = ["Caveat[wght].ttf", "PatrickHand-Regular.ttf", "ReenieBeanie.ttf"]
MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]


def exp_text(ym, rng):
    y, m = int(ym[:4]), int(ym[5:7])
    return rng.choice([f"{m:02d}/{y % 100:02d}", f"{m}/{y}", f"{MONTHS[m-1]} {y % 100:02d}", f"{m}-{y % 100:02d}", f"Exp {m:02d}/{y % 100:02d}"])


def wobbly_line(d, x0, y0, x1, y1, rng, color, width=3):
    pts = []
    n = 24
    for i in range(n + 1):
        t = i / n
        pts.append((x0 + (x1 - x0) * t + rng.uniform(-3, 3), y0 + (y1 - y0) * t + rng.uniform(-3, 3)))
    d.line(pts, fill=color, width=width, joint="curve")


def render(idx, seed):
    rng = random.Random(seed)
    phc = rng.choice(g.PHCS)
    page_date = date(2026, 9, rng.randint(15, 29))
    layout = rng.choice(["ruled", "ruled", "noline", "grid"])
    tint = (rng.randint(228, 248), rng.randint(226, 244), rng.randint(205, 232))
    img = g.paper_base(rng, tint)
    d = ImageDraw.Draw(img)
    if layout != "grid":
        img = Image.new("RGBA", (W, H), tint + (255,))
        d = ImageDraw.Draw(img)
        for y in range(260, H - 60, 118 if layout == "ruled" else 10**6):
            d.line([(0, y), (W, y)], fill=(150, 175, 210, 255), width=2)
        d.line([(110, 0), (110, H)], fill=(220, 120, 120, 255), width=3)   # notebook margin
    ink = rng.choice(g.INKS)
    lat = rng.choice(LATIN)
    jit, rot = 4.0, 2.6
    dev_digits = rng.random() < 0.3
    blank_word = rng.choice(["-", "nil", "0", ""])

    # handwritten header
    g.draw_text_jitter(img, (140, 70), rng.choice(["Stock Register", "दवा स्टॉक रजिस्टर", "Medicine stock", "Store register"]) if False else "Stock Register",
                       g.font(lat, 70), ink, rng, jit, rot)
    g.draw_text_jitter(img, (140, 160), phc[1], g.font(lat, 60), ink, rng, jit, rot)
    g.draw_text_jitter(img, (900, 160), f"{page_date.day}/{page_date.month}/{page_date.year % 100}", g.font(lat, 60), ink, rng, jit, rot)

    cols = [("Name", 470), ("Batch", 230), ("Exp", 180), ("Open", 170), ("Recd", 160), ("Issue", 160), ("Bal", 180)]
    x0, y0, rh, n = 130, 330, 118, rng.randint(9, 13)
    # column headers (handwritten)
    x = x0
    for name, w in cols:
        g.draw_text_jitter(img, (x + 8, y0 - 70), name, g.font(lat, 48), ink, rng, jit, rot)
        x += w
    if layout == "grid":
        for r in range(n + 1):
            d.line([(x0, y0 + r * rh), (x0 + sum(w for _, w in cols), y0 + r * rh)], fill=(60, 60, 60, 255), width=3)
    if layout in ("ruled", "grid"):
        x = x0
        for _, w in cols + [("", 0)]:
            wobbly_line(d, x, y0 - 80, x + rng.uniform(-8, 8), y0 + n * rh, rng, ink + (200,), 3)
            x += w

    rows = g.make_rows(rng, n, phc[5])
    fixes = set(rng.sample(range(n), k=min(2, n)))
    for r, row in enumerate(rows):
        y = y0 + r * rh + 22
        x = x0 + 10
        if not row["written_name"].isascii():
            g.draw_hindi(img, (x, y), row["written_name"], rng, jit, rot, cols[0][1] - 24)
        else:
            g.draw_text_jitter(img, (x, y), row["written_name"], g.font(lat, 56), ink, rng, jit, rot, maxw=cols[0][1] - 24)
        x += cols[0][1]
        g.draw_text_jitter(img, (x + 4, y), row["batch"], g.font(lat, 60), ink, rng, jit, rot, maxw=cols[1][1] - 14)
        x += cols[1][1]
        g.draw_text_jitter(img, (x + 4, y), exp_text(row["expiry"], rng), g.font(lat, 56), ink, rng, jit, rot, maxw=cols[2][1] - 10)
        x += cols[2][1]
        for key, (_, w) in zip(("opening", "received", "issued", "closing"), cols[3:]):
            val = row[key]
            txt = blank_word if (key == "received" and val == 0) else str(val)
            nf = lat
            if dev_digits and txt.isdigit():
                txt = txt.translate(DEV_DIGITS)
                nf = "Kalam-Regular.ttf"
            if r in fixes and key == "issued":
                wrong = str(val + rng.choice([-7, 5, 10, 13]))
                if nf != lat:
                    wrong = wrong.translate(DEV_DIGITS)
                g.draw_text_jitter(img, (x + 6, y - 4), wrong, g.font(nf, 44), ink, rng, 1, 1, maxw=w - 60)
                d.line([(x + 4, y + 22), (x + 4 + 16 * len(wrong) + 20, y + 16)], fill=ink + (255,), width=4)
                g.draw_text_jitter(img, (x + 20, y + 44), txt, g.font(nf, 44), ink, rng, 1, 1, maxw=w - 30)
            else:
                g.draw_text_jitter(img, (x + 8, y), txt, g.font(nf, 56 if nf == lat else 46), ink, rng, jit, rot, maxw=w - 16)
            x += w

    # ---- damage ----
    page = img.convert("RGB")
    arr = np.asarray(page).astype(np.float32)
    yy, xx = np.mgrid[0:H, 0:W]
    for _ in range(rng.randint(1, 3)):  # tea/ink stains
        cx, cy, r = rng.uniform(0, W), rng.uniform(0, H), rng.uniform(60, 180)
        m = np.clip(1 - np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2) / r, 0, 1) ** 1.5
        arr -= m[..., None] * np.array([20, 45, 80]) * rng.uniform(0.4, 1.0)
    if rng.random() < 0.6:  # fold line
        fx = rng.uniform(W * 0.35, W * 0.65)
        arr *= (1 - 0.18 * np.exp(-((xx - fx) ** 2) / (2 * 14 ** 2)))[..., None]
    page = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))

    scene = Image.new("RGB", (W + 500, H + 500), (rng.randint(80, 140), rng.randint(60, 110), rng.randint(40, 80)))
    scene.paste(page, (250, 250))
    amt = 160
    ox = oy = 250
    src = [(ox, oy), (ox + W, oy), (ox + W, oy + H), (ox, oy + H)]
    dst = [(p[0] + rng.uniform(-amt, amt), p[1] + rng.uniform(-amt, amt)) for p in src]
    A = []
    for (x1, y1), (x2, y2) in zip(dst, src):
        A.append([x1, y1, 1, 0, 0, 0, -x2 * x1, -x2 * y1])
        A.append([0, 0, 0, x1, y1, 1, -y2 * x1, -y2 * y1])
    coeffs = np.linalg.solve(np.array(A, float), np.array([c for p in src for c in p], float)).tolist()
    scene = scene.transform(scene.size, Image.PERSPECTIVE, coeffs, Image.BICUBIC)
    arr = np.asarray(scene).astype(np.float32)
    yy, xx = np.mgrid[0:arr.shape[0], 0:arr.shape[1]]
    ang = rng.uniform(0, 2 * math.pi)
    grad = (xx * math.cos(ang) + yy * math.sin(ang))
    grad = (grad - grad.min()) / (grad.max() - grad.min())
    dim = rng.uniform(0.55, 0.85) if rng.random() < 0.5 else 1.0
    arr *= (dim * (1 - 0.45 * grad))[..., None]
    arr += np.random.default_rng(seed).normal(0, 11, arr.shape)
    out = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))
    if rng.random() < 0.5:  # motion blur
        k = rng.choice([5, 7])
        out = out.filter(ImageFilter.Kernel((k, k) if k == 5 else (5, 5), [1 if i // 5 == 2 else 0 for i in range(25)], scale=5))
    out = out.filter(ImageFilter.GaussianBlur(1.3))
    out.thumbnail((1800, 1800))
    name = f"messy_{idx:02d}"
    out.save(g.OUT / f"{name}.jpg", quality=rng.randint(50, 65))
    key = {"file": f"{name}.jpg", "difficulty": "messy", "facility": phc[1], "phc_id": phc[0], "page_date": page_date.isoformat(),
           "rows": rows, "features": {"layout": layout, "hindi_digits": dev_digits, "blank_word": blank_word, "corrections": len(fixes)}}
    (g.ANS / f"{name}.json").write_text(json.dumps(key, ensure_ascii=False, indent=1), encoding="utf-8")
    return name, key["features"]


if __name__ == "__main__":
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 10
    for i in range(1, n + 1):
        print(render(i, 5000 + i))
