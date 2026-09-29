# Register Lens

**Your register already knows. Now DVDMS will too.**

Register Lens turns a *photo of the handwritten PHC stock register* into a checked table, shows how far the DVDMS record has drifted from what is really on the shelf, produces a DVDMS-compatible bulk-entry file, and drafts a Hindi + English alert for the district officer.

Built for **Build with AI: Code for Communities (2nd edition)**, Track 3: *Smart Health & Supply Chain Resilience*.

> **Prototype notice.** All register pages and stock figures are **synthetic samples**. This is not an official government portal and is not connected to the real DVDMS / e-Aushadhi.

## The problem
PHC pharmacists keep a paper register but have no time to also type every dispense into DVDMS. The paper is right; the system drifts. CAG audits describe consumption not being entered and DVDMS stock differing from stock registers, with dispensed medicines even appearing as expired. Dashboards and forecasters built on top of DVDMS inherit that bad data.

## How it works
1. **Snap**: photo of the day's register page (or pick a sample page).
2. **Clean**: OpenCV flattens the page, straightens rows, removes shadows and boosts faint ink.
3. **Read**: **Gemini** reads the handwriting (Hindi + English) into structured JSON with a confidence score per cell. If a page comes back shaky it is re-read with the Pro model.
4. **Confirm**: the pharmacist checks only the uncertain / non-balancing cells. Nothing moves without a human yes.
5. **Reconcile**: plain code compares the register with DVDMS: drift, days of stock (reality vs DVDMS), phantom stock, expiring batches.
6. **Sync**: downloads a DVDMS-compatible Excel bulk entry; **Gemini** writes a short Hindi + English district alert from the real numbers.

Where AI is used: handwriting reading, drug-name matching for hard cases, and alert writing. Everything numeric after reading is deterministic code.

## Tech stack
- **Backend:** Python, FastAPI, SQLModel/SQLite, OpenCV, RapidFuzz, openpyxl, `google-genai` (Gemini API)
- **Frontend:** React + Vite + TypeScript, Tailwind CSS v4, Framer Motion, GSAP ScrollTrigger, Lucide icons
- **Assets:** illustrations from [unDraw](https://undraw.co/license) (free licence), fonts from Google Fonts (OFL)

## Run locally (Windows / macOS / Linux)
```bash
# 1. backend
python -m venv .venv
.venv/Scripts/pip install -r backend/requirements.txt        # macOS/Linux: .venv/bin/pip
cp .env.example .env                                          # add your GEMINI_API_KEY (from https://aistudio.google.com)
cd backend && ../.venv/Scripts/python -m uvicorn app.main:app --port 8000

# 2. frontend (new terminal)
cd frontend && npm install && npm run dev                     # http://localhost:5173
```
The frontend proxies `/api` to port 8000. For a single-server build: `cd frontend && npm run build`, then the FastAPI app serves `frontend/dist` itself.

Regenerate the synthetic test pages (needs `pip install playwright` and Chrome for correct Devanagari shaping):
```bash
python scripts/render_hindi.py && python scripts/gen_registers.py
```

## Evaluation
`eval/run_eval.py` reads all 30 synthetic pages (10 easy / 12 medium / 8 hard) with and without the OpenCV clean-up and scores cell-level accuracy against the answer keys. See `eval/results/summary.txt` after a run.

## Roadmap
- **Phase 1 (this build):** scan → read → confirm → reconcile → bulk entry → Hindi + English alert.
- **Phase 2:** alerts and screens in each PHC's state language.
- **Phase 3:** expiry redistribution: near-expiry batches routed to nearby clinics/stores that urgently need them, with district-officer approval.

## Honest limitations
- Test pages are synthetic; real registers will be messier. Confidence scores are the model's own estimates, so the human confirmation step matters.
- No live DVDMS API is publicly available; the bulk-entry file is a compatible template and the DVDMS stock in the demo is a mock.
- The district dashboard shows illustrative data for centres that have not scanned yet.
