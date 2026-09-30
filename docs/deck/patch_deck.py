"""Update the pitch deck generator for round 2 (UP map, transfers, assistant, mobile, messy results)."""
import re
from pathlib import Path

from PIL import Image

D = Path(__file__).resolve().parent
img = D / "img"
crop = D / "img_crop"
crop.mkdir(exist_ok=True)
Image.open(img / "08_map_district.png").crop((16, 200, 1424, 830)).save(crop / "map_district.png")
Image.open(img / "09_transfers.png").crop((16, 225, 1424, 900)).save(crop / "transfers.png")
Image.open(img / "10_chat.png").crop((1020, 224, 1422, 804)).save(crop / "chat.png")
for n in ("11_mobile_home", "12_mobile_scan", "13_mobile_map"):
    im = Image.open(img / f"{n}.png")
    im.crop((0, 0, im.width, int(im.width * 16 / 9))).save(crop / f"{n}.png")

s = (D / "build_deck.js").read_text(encoding="utf-8")


def replace_block(s, start_marker, end_marker, new):
    a = s.index(start_marker)
    b = s.index(end_marker)
    return s[:a] + new + s[b:]


SLIDE3 = '''// ---------- 3. Whole of UP ----------
{
  const s = pres.addSlide();
  s.background = { color: PALE };
  title(s, "Beyond one PHC: all of Uttar Pradesh");
  s.addImage({ path: shot("map_district"), x: 0.5, y: 1.3, w: 5.2, h: 2.33, shadow: shadow() });
  s.addText("Barabanki: every DH, CHC, PHC and Health & Wellness Centre at its real location, coloured by stock risk", { x: 0.5, y: 3.7, w: 5.2, h: 0.5, fontFace: BODY, fontSize: 11, color: MUTED, margin: 0, isTextBox: true, valign: "top" });
  const stats = [["3,948", "public health facilities mapped (OpenStreetMap)"], ["75", "districts, with villages far from care"], ["84", "expiry transfers suggested in Barabanki alone"]];
  stats.forEach(([n, l], i) => {
    const y = 1.3 + i * 1.02;
    card(s, 6.0, y, 3.55, 0.88);
    s.addText([{ text: n + "  ", options: { fontFace: HEAD, fontSize: 24, bold: true, color: TEAL } }, { text: l, options: { fontSize: 11.5, color: MUTED } }],
      { x: 6.2, y, w: 3.25, h: 0.88, fontFace: BODY, margin: 0, isTextBox: true, valign: "middle" });
  });
  s.addText([{ text: "Phase 3, live: ", options: { bold: true, color: TEAL } }, { text: "batches that would expire unused are matched to the nearest facility running short; the district officer approves each move and downloads transfer orders.", options: { color: INK } }],
    { x: 0.5, y: 4.4, w: 9.05, h: 0.7, fontFace: BODY, fontSize: 13, margin: 0, isTextBox: true, valign: "top" });
  s.addNotes("We scaled from one district to the whole state. These are real facility locations from OpenStreetMap: 3,948 public facilities across 75 districts. For facilities that have not scanned a register the stock is simulated, and we say so on screen. Phase 3 is live: the app finds medicine that will expire before it can be used and suggests moving it to a nearby facility that is running short, with the district officer approving every move.");
}

'''
s = replace_block(s, "// ---------- 3. Who feels it ----------", "// ---------- 4. Solution flow ----------", SLIDE3)

SLIDE7 = '''// ---------- 7. Accuracy ----------
{
  const s = pres.addSlide();
  s.background = { color: PALE };
  title(s, "Does it work? Measured, with the misses.");
  const L = ["Easy (6)", "Medium (4)", "Hard (2)", "Messy (10)"];
  s.addChart(pres.charts.BAR, [
    { name: "Quantities", labels: L, values: [100, 100, 100, 92.9] },
    { name: "Batch", labels: L, values: [100, 100, 89.3, 51.4] },
    { name: "Expiry", labels: L, values: [100, 100, 85.7, 73.4] },
  ], {
    x: 0.4, y: 1.2, w: 5.5, h: 3.6, barDir: "col", barGrouping: "clustered", chartColors: [TEAL, SKY, AMBER],
    showTitle: true, title: "Cell accuracy by page type (%), 22 synthetic pages", titleFontSize: 12, titleColor: INK, titleFontFace: BODY,
    showValue: true, dataLabelFontSize: 8, dataLabelColor: INK, dataLabelPosition: "outEnd", dataLabelFormatCode: "0",
    valAxisMinVal: 0, valAxisMaxVal: 110, valAxisMajorUnit: 20, valAxisLabelFontSize: 10, catAxisLabelFontSize: 10, valAxisLabelColor: MUTED, catAxisLabelColor: MUTED,
    valGridLine: { color: LINE, size: 0.75 }, catGridLine: { style: "none" }, showLegend: true, legendPos: "b", legendFontSize: 10, legendColor: MUTED,
  });
  card(s, 6.1, 1.25, 3.45, 3.6);
  s.addText([
    { text: "Drug names: 100% everywhere", options: { fontFace: HEAD, fontSize: 15, bold: true, color: TEAL, breakLine: true } },
    { text: "Quantities, which drive stock-out numbers: 100% on clean pages, 93% on messy ones.", options: { fontSize: 11, color: INK, breakLine: true } },
    { text: " ", options: { fontSize: 5, breakLine: true } },
    { text: "The weak spot", options: { bold: true, fontSize: 12, color: INK, breakLine: true } },
    { text: "Small cursive batch codes and expiry dates on messy pages (G/U, E/C, 3/8). Gemini's own confidence caught only 4 of 104 wrong values.", options: { fontSize: 11, color: MUTED, breakLine: true } },
    { text: " ", options: { fontSize: 5, breakLine: true } },
    { text: "Our fix", options: { bold: true, fontSize: 12, color: INK, breakLine: true } },
    { text: "DVDMS batch cross-check + balance check flagged 63 of 74 lines with errors for the pharmacist, 0 false alarms.", options: { fontSize: 11, color: MUTED } },
  ], { x: 6.28, y: 1.35, w: 3.12, h: 3.45, fontFace: BODY, margin: 0, isTextBox: true, valign: "top" });
  s.addText("Messy pages: ruled notebooks, no column lines, cursive, corrections, Hindi numerals, stains, folds, blur. All pages synthetic; the demo DVDMS is a mock seeded with correct batches, so the cross-check shows the mechanism, not a field catch rate.", { x: 0.5, y: 4.95, w: 9, h: 0.5, fontFace: BODY, fontSize: 9.5, italic: true, color: MUTED, margin: 0, isTextBox: true, valign: "top" });
  s.addNotes("We measured honestly on 22 synthetic pages, including 10 deliberately messy ones. Medicine names were always right. Quantities stayed above 90 percent even on messy pages. The weak spot is small cursive batch codes and expiry dates, and the model does not know when it is wrong, so we cross-check against the batches DVDMS already has and the balance of each line. That flagged 63 of the 74 lines that had any error. Every line is confirmed by the pharmacist before anything is used.");
}

// ---------- 8. Assistant + mobile ----------
{
  const s = pres.addSlide();
  s.background = { color: WHITE };
  title(s, "Ask it anything. Use it on any phone.");
  s.addImage({ path: shot("chat"), x: 0.5, y: 1.25, w: 2.7, h: 3.9, shadow: shadow() });
  s.addText([
    { text: "Gemini assistant with function calling", options: { bold: true, fontSize: 14, color: INK, breakLine: true } },
    { text: "Looks up districts, facilities, nearby stock and transfer plans before answering, so it never invents a number. Replies in Hindi, Hinglish or English. Voice input.", options: { fontSize: 11.5, color: MUTED } },
  ], { x: 3.4, y: 1.25, w: 2.6, h: 2.2, fontFace: BODY, margin: 0, isTextBox: true, valign: "top" });
  s.addText([
    { text: "Installable phone app (PWA)", options: { bold: true, fontSize: 14, color: INK, breakLine: true } },
    { text: "Open the link in Chrome, tap Install. Own icon, full screen, Scan opens the camera. No app store needed.", options: { fontSize: 11.5, color: MUTED } },
  ], { x: 3.4, y: 3.35, w: 2.6, h: 1.8, fontFace: BODY, margin: 0, isTextBox: true, valign: "top" });
  ["11_mobile_home", "13_mobile_map"].forEach((n, i) => {
    s.addImage({ path: shot(n), x: 6.25 + i * 1.7, y: 1.25, w: 1.55, h: 2.76, shadow: shadow() });
  });
  s.addText("Phone views: home and district map", { x: 6.25, y: 4.1, w: 3.3, h: 0.3, fontFace: BODY, fontSize: 10, color: MUTED, margin: 0, isTextBox: true });
  s.addText("Safeguards: unsure cells yellow · balance errors red · batch cross-check · nothing uploaded automatically · officer approves every transfer.", { x: 6.25, y: 4.45, w: 3.3, h: 0.75, fontFace: BODY, fontSize: 10.5, color: TEAL, bold: true, margin: 0, isTextBox: true, valign: "top" });
  s.addNotes("Two features for real users. The assistant is Gemini with five tools over the app's data; here it answered a Hindi question about Barabanki by calling the district tool. And the whole app installs on a pharmacist's phone from the browser, with the camera for scanning. Every step keeps a human in charge.");
}

'''
s = replace_block(s, "// ---------- 7. Accuracy ----------", "// ---------- 9. Deployable ----------", SLIDE7)

s = s.replace('["Language", "Phase 2: alerts and screens in the PHC\'s state language.", "தமிழ்  తెలుగు  বাংলা  मराठी  ଓଡ଼ିଆ  ಕನ್ನಡ  ગુજરાતી  മലയാളം  ਪੰਜਾਬੀ", SKY],',
              '["Language", "Phase 2, live: district alerts in 16 Indian languages; UP defaults to Hindi, Urdu, English.", "हिन्दी  اردو  भोजपुरी  தமிழ்  తెలుగు  বাংলা  मराठी  ଓଡ଼ିଆ  ಕನ್ನಡ", SKY],')
s = s.replace('{ text: "Phase 3: expiry redistribution. ", options: { bold: true, color: TEAL } },\n    { text: "Batches close to expiry are routed to the nearby clinic or store that urgently needs them, with the district officer approving every move.", options: { color: MUTED } },',
              '{ text: "Already statewide: ", options: { bold: true, color: TEAL } },\n    { text: "3,948 facilities in all 75 UP districts are on the map today. A new state needs its facility list, register template and languages, not new code.", options: { color: MUTED } },')
s = s.replace('c("Gemini reads handwriting to JSON, model failover, OpenCV clean-up, evaluation script and results")',
              'c("Gemini reads handwriting to JSON; function-calling assistant; multilingual alerts; OpenCV clean-up; 22-page evaluation")')
s = s.replace('c("Language, register template and medicine catalogue as separate configs; Phase 2 languages")',
              'c("All 75 UP districts, 3,948 facilities, villages far from care; 16 languages; config-driven for other states")')
s = s.replace('c("No new hardware; DVDMS bulk-entry output; four-week pilot plan; Dockerfile for Cloud Run")',
              'c("Runs on Cloud Run; installable phone app; DVDMS bulk-entry output; four-week pilot plan")')
s = s.replace('c("Attacks the stock-out and expiry-loss cycle at the source; reported losses in crores")',
              'c("Stock-outs and expiry losses (reported in crores) at the source; expiry transfers with officer approval")')
(D / "build_deck.js").write_text(s, encoding="utf-8")
print("slides:", len(re.findall(r"pres\.addSlide\(\)", s)))
