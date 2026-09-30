from pathlib import Path

p = Path(__file__).resolve().parents[1] / "README.md"
s = p.read_text(encoding="utf-8")
top = """# Register Lens

**Your register already knows. Now DVDMS will too.**

**Live app:** https://register-lens-906735912162.asia-south1.run.app (works on PC; on a phone open it in Chrome and tap *Install app*)
**Pitch deck:** [docs/deck/Register-Lens-pitch-deck.pdf](docs/deck/Register-Lens-pitch-deck.pdf) · **Demo video script:** [docs/demo-video-script.md](docs/demo-video-script.md)

Built for **Build with AI: Code for Communities (2nd edition)**, Track 3: *Smart Health & Supply Chain Resilience*.

## Try it in 2 minutes
1. Open the live app → **Scan Register** → pick **★ Real handwritten page** (a real page written by us in Hindi + English).
2. See Gemini's reading: the wrong Zinc total is **red**, a crossed-out 54 → 45 is understood, Hindi numerals are read. Fix the red cell → **Confirm all**.
3. **Compare with DVDMS** → days of stock on the register vs what DVDMS claims → **Prepare DVDMS entry & alert** → download the Excel, switch the alert between हिन्दी / اردو / English.
4. **UP Map** → click **Gonda** (villages far from care) or **Barabanki** (click a facility to see its stock).
5. **Expiry transfers** → approve / reject moves of near-expiry medicine to facilities running short.
6. Tap the round **AI** button → ask *"Barabanki mein kaun se PHC mein dawai khatam ho rahi hai?"*

"""
start = s.index("# Register Lens")
end = s.index("> **Prototype notice.**")
s = s[:start] + top + s[end:]
p.write_text(s, encoding="utf-8")
print("ok")
