from pathlib import Path

p = Path(__file__).resolve().parents[1] / "README.md"
s = p.read_text(encoding="utf-8")

features = '''## What is in the prototype
| Feature | What it does |
|---|---|
| **Scan a register** | Photo of the handwritten page → OpenCV clean-up → Gemini reads it into a table with per-cell confidence → pharmacist confirms → DVDMS drift, days of stock → DVDMS bulk-entry Excel |
| **Batch cross-check** | Flags a batch/expiry that looks like a known DVDMS batch with a character off: catches misreads the model is confident about |
| **Phase 2: languages** | District alerts in 16 Indian languages (Hindi, Urdu, English by default for UP; Bhojpuri, Awadhi, Bengali, Tamil, Telugu...) |
| **Phase 3: expiry transfers** | Finds batches that will expire before they can be used and matches them to the nearest facility running short; officer approves/rejects; transfer orders in Excel |
| **All of Uttar Pradesh** | 3,948 real public facilities (district hospitals, CHCs, PHCs, Health & Wellness Centres) in 75 districts from OpenStreetMap, on an interactive map with per-facility stock and villages far from care |
| **AI assistant** | Gemini with function calling over the app's own data (5 tools: statewide overview, district status, facility stock, nearby stock search, transfer plan); answers in Hindi/Hinglish/English; voice input |
| **Mobile app (PWA)** | Installable from Chrome ("Add to Home screen"), full screen, camera capture for scanning |

'''
if "## What is in the prototype" not in s:
    s = s.replace("## How it works", features + "## How it works", 1)

messy = '''
### Messier pages (v2 stress test)
To test conditions closer to real registers we generated 10 "messy" pages (`scripts/gen_messy.py`): ruled notebooks with hand-drawn or no column lines, rows drifting across lines, cursive hands, struck-through values rewritten beside them, Hindi numerals, "nil"/"-" blanks, varied expiry formats, stains, folds, dim light, motion blur and heavy JPEG. Results (109 lines):

| Drug name | Batch | Expiry | Quantities | Whole line exact |
|---|---|---|---|---|
| 100% | 51.4% | 73.4% | 92.9% | 38.5% |

What this means: medicine names and most quantities survive messy handwriting, but **batch codes and expiry dates in small cursive writing are often misread** (letter confusions such as G/U, E/C, 3/8). The model's own confidence caught only 4 of the 104 wrong values. The DVDMS batch cross-check plus the balance check flagged 56 of the 67 lines with errors (84%) for the pharmacist, with no false alarms on correct lines (again: the demo DVDMS is a mock seeded with correct batches). This is why every line is confirmed by a person and nothing is uploaded automatically. Next step: measure on real photographed registers from pilot PHCs.
'''
if "### Messier pages" not in s:
    s = s.replace("## Gemini API quota", messy + "\n## Gemini API quota", 1)

s = s.replace('''## Roadmap
- **Phase 1 (this build):** scan → read → confirm → reconcile → bulk entry → Hindi + English alert.
- **Phase 2:** alerts and screens in each PHC's state language.
- **Phase 3:** expiry redistribution: near-expiry batches routed to nearby clinics/stores that urgently need them, with district-officer approval.''', '''## Roadmap
- **Phase 1 (live):** scan → read → confirm → reconcile → bulk entry → alert.
- **Phase 2 (live):** alerts in 16 Indian languages. Next: full UI translation.
- **Phase 3 (live):** expiry redistribution with officer approval. Next: include Jan Aushadhi stores and cross-district moves.
- **Next:** pilot with real registers in one district; real DVDMS integration; per-state register templates.''')
s = s.replace("- No live DVDMS API is publicly available; the bulk-entry file is a compatible template and the DVDMS stock in the demo is a mock.",
              "- No live DVDMS API is publicly available; the bulk-entry file is a compatible template and the DVDMS stock in the demo is a mock.\n- Facility locations are real (OpenStreetMap, which is incomplete); stock for facilities that have not scanned a register is simulated.\n- Village distances are straight-line, not road distance.")
p.write_text(s, encoding="utf-8")
print("ok")
