# Register Lens: demo video script (target 4:30, max 5:00)

Record the laptop screen at 1080p (Win + Alt + R, or Snipping Tool → Record). Browser zoom 100%.
Have ready: the live link open on the home page; your handwritten register photo on the laptop; your phone with the app installed (for a 20-second phone clip, filmed with another phone).

## 0:00–0:25 · The problem (Home, hero → "The problem")
**Say:** "Every PHC pharmacist keeps a paper stock register. With a hundred patients a day, there is no time to type it into DVDMS too. So DVDMS drifts: CAG audits found stock that doesn't match the registers, and dispensed medicines showing as expired. Every dashboard built on DVDMS inherits that bad data. Register Lens fixes the data at the source, with one photo."

## 0:25–1:45 · Scan your real page (Scan)
1. Click **Scan Register**. Pick **Barabanki → PHC Banki**. Upload your handwritten photo.
   **Say:** "This is a real handwritten page, Hindi and English, taken on a phone."
2. While reading: "First we clean the photo: flatten the page, remove shadows. Then Gemini reads it into a table."
3. **Review:** point at a yellow or red cell. "Yellow means Gemini is unsure. Red means the numbers don't add up: here Opening plus Received minus Issued is not the Closing. Amber notes come from cross-checking the batch against DVDMS: that catches misreads Gemini is confident about. The pharmacist fixes or confirms. Nothing moves without a human yes." Fix the wrong line, click **Confirm all**.
4. **Compare with DVDMS:** "DVDMS thinks there are X days of stock. The register says Y. That gap is how stock-outs happen. These numbers are plain, checkable code, not AI guesses."

## 1:45–2:25 · Sync, Phase 2 languages
1. Download the Excel: "A DVDMS-ready bulk entry, so the pharmacist uploads instead of typing 150 lines."
2. Alert: switch हिन्दी / اردو / English. Open **languages**, add Bhojpuri or Tamil, click **Write in these languages**.
   **Say:** "Phase 2: the district alert in 16 Indian languages; for UP, Hindi, Urdu and English. Written only from the computed numbers."

## 2:25–3:15 · All of UP (UP Map)
1. **UP Map:** "Every public health facility in Uttar Pradesh: 3,948 real locations across 75 districts from OpenStreetMap."
2. Click **Barabanki**. Click a red facility: "Red means medicines running out; the drawer shows register vs DVDMS days." Point at purple dots (if shown): "Villages more than 8 km from a PHC or CHC."
   **Say clearly:** "For facilities that haven't scanned a register yet, the stock is simulated for this demo."

## 3:15–3:50 · Phase 3: expiry transfers
Click **Expiry transfers**. "Medicine that will expire before a facility can use it is matched to the nearest facility that's running short." Approve one, reject one, download **Transfer orders**. "The district officer approves every move."

## 3:50–4:15 · AI assistant
Open the chat. Click the Hindi suggestion (or speak with the mic): "Barabanki mein kaun se PHC mein dawai khatam ho rahi hai?"
**Say:** "The assistant is Gemini with function calling: it looks up the app's data before answering, so it never invents a number, and it replies in your language."

## 4:15–4:35 · Phone (20-second clip)
Show the phone: Chrome → Install app → open from the icon → Scan → camera.
**Say:** "No app store: the pharmacist installs it from the link, and Scan opens the camera."

## 4:35–4:50 · Honest results and close
**Say:** "On our 22 test pages, medicine names were always right and quantities above 90 percent even on messy pages; small cursive batch codes are the weak spot, which is why we cross-check and keep the pharmacist in charge. Register Lens: your register already knows. Now DVDMS will too."

## Tips
- Do the live scan once; if Gemini is slow, cut the wait in editing. If the AI quota is hit, use a sample page (they need no AI call).
- Upload to YouTube as **Unlisted**, and check the link opens in a private window.
