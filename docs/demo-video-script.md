# Register Lens: 3–5 minute demo video script

Target length: about 4 minutes. Record the screen at 1080p with your voice over it. Keep the browser zoom at 100%.
Before recording: open the app (`http://localhost:8000` or the deployed link), and have your **own handwritten register page photo** ready (write 8–10 medicines: name, batch, expiry, opening, received, issued, closing).

## 0:00–0:30 · The problem (Home page, hero)
**Show:** the hero. Scroll slowly to "The notebook is right. The screen is out of date."
**Say:** "Every PHC pharmacist keeps a paper register. But with a hundred patients a day, there is no time to type it all into DVDMS as well. So the district sees stock that isn't really there. Government audits have found dispensed medicines showing as expired, and DVDMS not matching the registers. Every dashboard built on top of DVDMS inherits that bad data. We fix the data at the source."

## 0:30–0:50 · The idea (How it works)
**Show:** the four step cards, then the kirana khata analogy.
**Say:** "Register Lens is a helper who photographs the notebook every evening and updates the system. One photo, four steps: snap, read, confirm, sync. No extra typing."

## 0:50–2:20 · Live demo with your own page
1. Click **Scan Register**. Pick the health centre. Upload **your handwritten page photo**.
   **Say:** "This is a real handwritten page, in Hindi and English, photographed on a phone."
2. While it reads, point at the steps. **Say:** "First we clean the photo: flatten the page, remove shadows. Then Gemini reads the handwriting."
3. **Review screen.** Show the table beside the cleaned image. Point at a yellow cell.
   **Say:** "Gemini tells us how sure it is about every cell. Yellow means unsure. The pharmacist only checks those. Red means the balance doesn't add up. Nothing moves without a human yes." Fix one cell, click **Confirm all**.
4. **Compare with DVDMS.** Show a "Running out" card.
   **Say:** "DVDMS thinks this medicine has [X] days of stock. The register says [Y]. That's the gap that causes stock-outs. These numbers are worked out by plain code, not guessed by AI."

## 2:20–3:10 · Sync and alert
**Show:** Sync screen. Download the Excel file and open it briefly. Toggle the alert between Hindi and English.
**Say:** "One click gives a DVDMS-ready bulk-entry file, so the pharmacist uploads instead of typing 150 lines. Gemini writes the district alert in Hindi and English, using only the real numbers."

## 3:10–3:30 · District view
**Show:** the District view page.
**Say:** "For the district officer: which centres are closest to running out, and where DVDMS is most out of step." (Say that this view uses illustrative data for centres that haven't scanned yet.)

## 3:30–4:00 · Where AI works, accuracy, and what's next
**Show:** the "Where Gemini works" section, then the roadmap.
**Say:** "Gemini reads handwriting, understands drug names in Hindi and English, and writes the alert. Everything numeric is checked code. On our 12 synthetic test pages, cell accuracy was [use the number from eval]. Next: alerts in every state language, and routing near-expiry medicines to the clinic or store that urgently needs them, with the district officer's approval."

## 4:00–4:10 · Close
**Say:** "Register Lens. Your register already knows. Now DVDMS will too."

## Tips
- Keep the API healthy while recording: use your own page once (each new upload is one Gemini request); use sample pages for repeat takes, since they cost nothing.
- If a live read is slow, cut the waiting time in editing.
- Be honest on screen: say the sample pages and stock figures are synthetic.
