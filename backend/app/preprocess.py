"""OpenCV clean-up applied before the photo is sent to Gemini.

Steps: downscale -> find page and flatten perspective -> deskew -> remove uneven
illumination/shadows -> local contrast (CLAHE) -> light denoise.
Each step is conservative: if page detection is unsure it leaves the image alone.
"""
import cv2
import numpy as np

MAX_SIDE = 2400


def _order_quad(pts):
    pts = pts.reshape(4, 2).astype("float32")
    s = pts.sum(axis=1)
    d = np.diff(pts, axis=1).ravel()
    return np.array([pts[np.argmin(s)], pts[np.argmin(d)], pts[np.argmax(s)], pts[np.argmax(d)]], dtype="float32")


def _find_page(img):
    h, w = img.shape[:2]
    scale = 800 / max(h, w)
    small = cv2.resize(img, None, fx=scale, fy=scale)
    gray = cv2.cvtColor(small, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (7, 7), 0)
    _, th = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    th = cv2.morphologyEx(th, cv2.MORPH_CLOSE, np.ones((15, 15), np.uint8))
    cnts, _ = cv2.findContours(th, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not cnts:
        return None
    c = max(cnts, key=cv2.contourArea)
    if cv2.contourArea(c) < 0.35 * small.shape[0] * small.shape[1]:
        return None
    approx = cv2.approxPolyDP(c, 0.02 * cv2.arcLength(c, True), True)
    if len(approx) != 4:
        return None
    quad = _order_quad(approx) / scale
    # if the "page" is basically the whole frame, there is nothing to flatten
    if cv2.contourArea(quad.astype("float32")) > 0.97 * h * w:
        return None
    return quad


def _warp(img, quad):
    tl, tr, br, bl = quad
    w = int(max(np.linalg.norm(br - bl), np.linalg.norm(tr - tl)))
    h = int(max(np.linalg.norm(tr - br), np.linalg.norm(tl - bl)))
    if w < 300 or h < 300:
        return img
    dst = np.array([[0, 0], [w - 1, 0], [w - 1, h - 1], [0, h - 1]], dtype="float32")
    return cv2.warpPerspective(img, cv2.getPerspectiveTransform(quad, dst), (w, h))


def _deskew(img):
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 60, 160)
    lines = cv2.HoughLinesP(edges, 1, np.pi / 720, threshold=120,
                            minLineLength=img.shape[1] // 4, maxLineGap=20)
    if lines is None:
        return img, 0.0
    angles = []
    for x1, y1, x2, y2 in lines.reshape(-1, 4):
        a = np.degrees(np.arctan2(y2 - y1, x2 - x1))
        if abs(a) < 15:
            angles.append(a)
    if len(angles) < 5:
        return img, 0.0
    ang = float(np.median(angles))
    if abs(ang) < 0.3:
        return img, 0.0
    h, w = img.shape[:2]
    M = cv2.getRotationMatrix2D((w / 2, h / 2), ang, 1.0)
    return cv2.warpAffine(img, M, (w, h), flags=cv2.INTER_CUBIC,
                          borderMode=cv2.BORDER_REPLICATE), ang


def _flatten_light(img):
    """Divide by a heavily blurred copy to cancel shadows and uneven lighting."""
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    small = cv2.resize(l, None, fx=0.25, fy=0.25, interpolation=cv2.INTER_AREA)
    bg = cv2.medianBlur(small, 31)
    bg = cv2.resize(bg, (l.shape[1], l.shape[0]), interpolation=cv2.INTER_LINEAR)
    flat = cv2.divide(l, bg, scale=235)
    return cv2.cvtColor(cv2.merge([flat, a, b]), cv2.COLOR_LAB2BGR)


def clean(image_bytes: bytes):
    """Returns (cleaned_png_bytes, original_png_bytes, steps_applied)."""
    arr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Could not decode image")
    steps = []
    h, w = img.shape[:2]
    if max(h, w) > MAX_SIDE:
        f = MAX_SIDE / max(h, w)
        img = cv2.resize(img, None, fx=f, fy=f, interpolation=cv2.INTER_AREA)
        steps.append("resized")
    original = img.copy()
    quad = _find_page(img)
    if quad is not None:
        img = _warp(img, quad)
        steps.append("page-flattened")
    img, ang = _deskew(img)
    if ang:
        steps.append(f"deskew {ang:.1f} deg")
    img = _flatten_light(img)
    steps.append("shadow-removal")
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    l = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8)).apply(l)
    img = cv2.cvtColor(cv2.merge([l, a, b]), cv2.COLOR_LAB2BGR)
    steps.append("contrast")
    img = cv2.fastNlMeansDenoisingColored(img, None, 3, 3, 7, 15)
    steps.append("denoise")
    _, cleaned = cv2.imencode(".png", img)
    _, orig = cv2.imencode(".png", original)
    return cleaned.tobytes(), orig.tobytes(), steps
