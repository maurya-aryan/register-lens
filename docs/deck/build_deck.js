const pptxgen = require("pptxgenjs");
const fs = require("fs");
const path = require("path");

const DARK = "0B3F39", TEAL = "167F71", MINT = "D5F3EC", PALE = "EEFAF7", INK = "16323A", MUTED = "5B7780";
const AMBER = "F0A23B", ROSE = "E5484D", SKY = "3B9CE2", WHITE = "FFFFFF", LINE = "DCEBE7";
const HEAD = "Cambria", BODY = "Calibri";
const art = (n) => path.join(__dirname, "art", n + ".png");
const shot = (n) => path.join(__dirname, "img_crop", n + ".png");

const pres = new pptxgen();
pres.layout = "LAYOUT_16x9"; // 10 x 5.625 in
pres.title = "Register Lens";
pres.author = "Register Lens team";

const shadow = () => ({ type: "outer", color: "14665C", blur: 10, offset: 3, angle: 90, opacity: 0.18 });
const title = (s, t, color = INK, size = 30) =>
  s.addText(t, { x: 0.5, y: 0.35, w: 9, h: 0.8, fontFace: HEAD, fontSize: size, bold: true, color, margin: 0, isTextBox: true, valign: "top" });
const card = (s, x, y, w, h, fill = WHITE) =>
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.12, fill: { color: fill }, line: { color: LINE, width: 0.75 }, shadow: shadow() });
const dot = (s, x, y, d, color, txt) => {
  s.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color }, line: { color, width: 0 } });
  if (txt) s.addText(txt, { x, y, w: d, h: d, align: "center", valign: "middle", fontFace: HEAD, fontSize: 16, bold: true, color: WHITE, margin: 0, isTextBox: true });
};

// ---------- 1. Title ----------
{
  const s = pres.addSlide();
  s.background = { color: DARK };
  s.addText("BUILD WITH AI  ·  CODE FOR COMMUNITIES 2.0  ·  TRACK 3", { x: 0.6, y: 0.55, w: 6, h: 0.3, fontFace: BODY, fontSize: 11, bold: true, color: "72D0BD", charSpacing: 3, margin: 0, isTextBox: true });
  s.addText("Register Lens", { x: 0.6, y: 1.35, w: 6, h: 1.0, fontFace: HEAD, fontSize: 54, bold: true, color: WHITE, margin: 0, isTextBox: true });
  s.addText("Your register already knows.\nNow DVDMS will too.", { x: 0.6, y: 2.45, w: 5.8, h: 1.1, fontFace: HEAD, fontSize: 24, color: MINT, margin: 0, isTextBox: true, valign: "top" });
  s.addText("Smart Health & Supply Chain Resilience", { x: 0.6, y: 4.35, w: 6, h: 0.35, fontFace: BODY, fontSize: 15, color: "A9E5D7", margin: 0, isTextBox: true });
  s.addShape(pres.shapes.OVAL, { x: 6.55, y: 0.95, w: 3.3, h: 3.3, fill: { color: WHITE }, line: { color: WHITE, width: 0 } });
  s.addImage({ path: art("medical-representative_k331"), x: 6.85, y: 1.2, w: 2.7, h: 2.7, sizing: { type: "contain", w: 2.7, h: 2.7 } });
  s.addNotes("Hi, we are presenting Register Lens for Track 3, Smart Health and Supply Chain Resilience. In one line: we read the paper register a PHC already keeps, and use it to keep DVDMS honest.");
}

// ---------- 2. Problem ----------
{
  const s = pres.addSlide();
  s.background = { color: WHITE };
  title(s, "The notebook is right. The screen is out of date.", INK, 26);
  s.addText([
    { text: "Busy OPD, no time to type twice.", options: { bold: true, breakLine: true, color: INK } },
    { text: "Auditors record that DVDMS is not updated regularly because of the rush of work and shortage of staff.", options: { breakLine: true, color: MUTED } },
    { text: " ", options: { breakLine: true, fontSize: 6 } },
    { text: "So DVDMS drifts from reality.", options: { bold: true, breakLine: true, color: INK } },
    { text: "Stock differs from the registers, and dispensed medicines can even show as expired.", options: { breakLine: true, color: MUTED } },
    { text: " ", options: { breakLine: true, fontSize: 6 } },
    { text: "Everything built on DVDMS inherits it.", options: { bold: true, breakLine: true, color: INK } },
    { text: "Dashboards and forecasts are only as good as the data underneath.", options: { color: MUTED } },
  ], { x: 0.5, y: 1.35, w: 4.6, h: 2.9, fontFace: BODY, fontSize: 15, margin: 0, isTextBox: true, valign: "top", paraSpaceAfter: 2 });
  card(s, 5.5, 1.35, 4.0, 1.05, PALE);
  s.addText([{ text: "₹14.52 crore", options: { fontFace: HEAD, fontSize: 26, bold: true, color: TEAL, breakLine: true } }, { text: "expired drugs reported lying in Haryana", options: { fontSize: 12, color: MUTED } }], { x: 5.7, y: 1.4, w: 3.7, h: 0.95, fontFace: BODY, margin: 0, isTextBox: true, valign: "middle" });
  card(s, 5.5, 2.55, 4.0, 1.05, PALE);
  s.addText([{ text: "₹23.03 crore", options: { fontFace: HEAD, fontSize: 26, bold: true, color: TEAL, breakLine: true } }, { text: "expired drugs reported in Karnataka, 2019–22", options: { fontSize: 12, color: MUTED } }], { x: 5.7, y: 2.6, w: 3.7, h: 0.95, fontFace: BODY, margin: 0, isTextBox: true, valign: "middle" });
  s.addImage({ path: art("taking-notes_oyqz"), x: 6.5, y: 3.65, w: 2.2, h: 1.6, sizing: { type: "contain", w: 2.2, h: 1.6 } });
  s.addText("Sources: CAG audit findings reported by The Tribune and Deccan Herald; CAG e-Aushadhi IT audit.", { x: 0.5, y: 5.05, w: 5.4, h: 0.3, fontFace: BODY, fontSize: 9, color: MUTED, margin: 0, isTextBox: true });
  s.addNotes("The paper register is accurate because pharmacists must keep it. DVDMS is the system districts use to plan supply, but it lags because nobody has time to type twice. CAG audits describe exactly this: consumption not entered, stock not matching registers, dispensed drugs appearing as expired. Those are reported figures for expired drugs in Haryana and Karnataka.");
}

// ---------- 3. Whole of UP ----------
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

// ---------- 4. Solution flow ----------
{
  const s = pres.addSlide();
  s.background = { color: WHITE };
  title(s, "One photo. Four steps. Zero extra typing.");
  const steps = [["Snap", "Photograph the day's register page.", SKY], ["Read", "Gemini reads Hindi + English handwriting and scores each cell.", TEAL], ["Confirm", "The pharmacist checks only flagged cells.", AMBER], ["Sync", "DVDMS bulk entry + Hindi/English district alert.", ROSE]];
  steps.forEach(([h, d, c], i) => {
    const x = 0.5 + i * 2.32;
    card(s, x, 1.6, 2.05, 2.5);
    dot(s, x + 0.72, 1.85, 0.62, c, String(i + 1));
    s.addText(h, { x: x + 0.15, y: 2.6, w: 1.75, h: 0.4, align: "center", fontFace: HEAD, fontSize: 19, bold: true, color: INK, margin: 0, isTextBox: true });
    s.addText(d, { x: x + 0.2, y: 3.05, w: 1.65, h: 0.95, align: "center", fontFace: BODY, fontSize: 12, color: MUTED, margin: 0, isTextBox: true, valign: "top" });
    if (i < 3) s.addText("›", { x: x + 2.05, y: 2.3, w: 0.27, h: 0.5, align: "center", fontFace: BODY, fontSize: 26, bold: true, color: "72D0BD", margin: 0, isTextBox: true });
  });
  s.addText("No new hardware  ·  no new forms  ·  the pharmacist always approves", { x: 0.5, y: 4.55, w: 9, h: 0.4, align: "center", fontFace: BODY, fontSize: 15, bold: true, color: TEAL, margin: 0, isTextBox: true });
  s.addNotes("Snap, read, confirm, sync. The pharmacist takes one photo. Gemini reads it and says how sure it is about each cell. The pharmacist checks only the flagged cells. Then we produce a DVDMS-compatible bulk-entry file and a district alert in Hindi and English.");
}

// ---------- 5. Product ----------
{
  const s = pres.addSlide();
  s.background = { color: PALE };
  title(s, "The working prototype");
  const items = [["03_review_hard", "Review: flagged lines with reasons"], ["04_reconcile", "Reconcile: DVDMS vs the register"], ["05_sync", "Sync: bulk entry + Hindi/English alert"]];
  items.forEach(([f, cap], i) => {
    const x = 0.5 + i * 3.05;
    s.addImage({ path: shot(f), x, y: 1.4, w: 2.85, h: 1.415, shadow: shadow() });
    s.addText(cap, { x, y: 2.95, w: 2.85, h: 0.4, fontFace: BODY, fontSize: 12, bold: true, color: INK, margin: 0, isTextBox: true });
  });
  s.addText([
    { text: "Live end to end: ", options: { bold: true, color: TEAL } },
    { text: "photo upload or sample page, image clean-up, Gemini read, review, reconcile, Excel export, Hindi/English alert, district view.", options: { color: MUTED } },
  ], { x: 0.5, y: 3.75, w: 9, h: 0.8, fontFace: BODY, fontSize: 14, margin: 0, isTextBox: true, valign: "top" });
  s.addText("React + FastAPI + Gemini API · built for a PC browser first", { x: 0.5, y: 4.85, w: 9, h: 0.3, fontFace: BODY, fontSize: 11, color: MUTED, margin: 0, isTextBox: true });
  s.addNotes("This is the working prototype, not a mock-up. Left: the review screen, where flagged lines carry a plain-language reason. Middle: DVDMS versus the register with days of stock. Right: the bulk-entry download and the alert. Sample data is synthetic and labelled as such.");
}

// ---------- 6. AI approach ----------
{
  const s = pres.addSlide();
  s.background = { color: WHITE };
  title(s, "Where AI works, and where plain code does");
  const boxes = [["Photo", "phone camera", MINT, INK], ["OpenCV clean-up", "flatten page, remove shadows, boost ink", MINT, INK], ["Gemini reads", "handwriting to JSON + confidence", TEAL, WHITE], ["Code checks", "match drugs, balances, DVDMS drift, days of stock", DARK, WHITE], ["Gemini writes", "district alert, Hindi + English", TEAL, WHITE]];
  boxes.forEach(([h, d, bg, fg], i) => {
    const y = 1.35 + i * 0.7;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.5, y, w: 4.6, h: 0.58, rectRadius: 0.1, fill: { color: bg }, line: { color: bg, width: 0 } });
    s.addText([{ text: h + "  ", options: { bold: true, fontFace: HEAD, fontSize: 14 } }, { text: d, options: { fontSize: 11.5 } }], { x: 0.65, y, w: 4.35, h: 0.58, fontFace: BODY, color: fg, margin: 0, isTextBox: true, valign: "middle" });
  });
  s.addText("The pharmacist confirms between “reads” and “checks”. Nothing is uploaded without a human yes.", { x: 0.5, y: 4.9, w: 4.6, h: 0.5, fontFace: BODY, fontSize: 11, italic: true, color: TEAL, margin: 0, isTextBox: true, valign: "top" });
  const pts = [
    ["Structured output", "Gemini returns schema-checked JSON with a confidence score per cell."],
    ["Numbers are never generated", "Drift and days of stock are computed by checkable code."],
    ["Resilient to limits", "Fails over across Gemini models, skips exhausted ones, lighter models for alerts, stored readings for demo pages."],
    ["Names in two languages", "PCM, Paracetamol and पैरासिटामोल resolve to one medicine."],
  ];
  pts.forEach(([h, d], i) => {
    const y = 1.35 + i * 0.95;
    dot(s, 5.55, y + 0.05, 0.36, TEAL, String(i + 1));
    s.addText([{ text: h, options: { bold: true, color: INK, breakLine: true, fontSize: 13.5 } }, { text: d, options: { color: MUTED, fontSize: 11.5 } }], { x: 6.05, y, w: 3.5, h: 0.85, fontFace: BODY, margin: 0, isTextBox: true, valign: "top" });
  });
  s.addNotes("Gemini does the three jobs a rules-based system cannot: reading messy bilingual handwriting, understanding drug-name variants, and writing the alert. Everything numeric is plain code, so an officer can audit it. We also fail over across Gemini models because free-tier quotas are per model.");
}

// ---------- 7. Accuracy ----------
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

// ---------- 9. Deployable ----------
{
  const s = pres.addSlide();
  s.background = { color: PALE };
  title(s, "Pilot-ready in four weeks");
  const wk = [["Week 1", "Collect real register photos from 3–5 PHCs in one district. Measure accuracy."], ["Week 2", "Map each register template. Match DVDMS bulk-entry fields with the state IT team."], ["Week 3", "Shadow mode: run beside the current process and compare stock numbers."], ["Week 4", "Go live with pharmacists, district officer sign-off on alerts."]];
  wk.forEach(([h, d], i) => {
    const x = 0.5 + i * 2.32;
    card(s, x, 1.45, 2.1, 2.1);
    s.addText(h, { x: x + 0.2, y: 1.6, w: 1.7, h: 0.4, fontFace: HEAD, fontSize: 16, bold: true, color: TEAL, margin: 0, isTextBox: true });
    s.addText(d, { x: x + 0.2, y: 2.05, w: 1.7, h: 1.4, fontFace: BODY, fontSize: 11.5, color: MUTED, margin: 0, isTextBox: true, valign: "top" });
  });
  s.addText([
    { text: "What it needs: ", options: { bold: true, color: INK } },
    { text: "a phone camera, a browser, a Gemini API key. It reads the register that already exists and outputs a bulk-entry file for the existing system, so there is no new hardware and no new workflow to learn.", options: { color: MUTED } },
  ], { x: 0.5, y: 3.85, w: 9, h: 0.9, fontFace: BODY, fontSize: 14, margin: 0, isTextBox: true, valign: "top" });
  s.addNotes("This can be piloted in weeks because we do not ask anyone to change their process. The register stays; we read it. The bulk-entry route into DVDMS already exists according to the audit reports. Week one is measuring on real registers, which is the honest next step after synthetic testing.");
}

// ---------- 10. Scale ----------
{
  const s = pres.addSlide();
  s.background = { color: WHITE };
  title(s, "Built to travel across states and BRICS nations");
  const cols = [
    ["Language", "Phase 2, live: district alerts in 16 Indian languages; UP defaults to Hindi, Urdu, English.", "हिन्दी  اردو  भोजपुरी  தமிழ்  తెలుగు  বাংলা  मराठी  ଓଡ଼ିଆ  ಕನ್ನಡ", SKY],
    ["Register templates", "Layout differs by state; one template file per register lets Gemini read a new format without retraining.", "column names · units · date style", TEAL],
    ["Medicine catalogue", "Each country brings its own essential-medicines list and local aliases.", "NLEM (India) → other national lists", AMBER],
  ];
  cols.forEach(([h, d, x2, c], i) => {
    const x = 0.5 + i * 3.05;
    card(s, x, 1.4, 2.85, 2.6);
    dot(s, x + 0.2, 1.6, 0.4, c);
    s.addText(h, { x: x + 0.75, y: 1.6, w: 1.95, h: 0.4, fontFace: HEAD, fontSize: 15, bold: true, color: INK, margin: 0, isTextBox: true, valign: "middle" });
    s.addText(d, { x: x + 0.2, y: 2.2, w: 2.5, h: 1.0, fontFace: BODY, fontSize: 12, color: MUTED, margin: 0, isTextBox: true, valign: "top" });
    s.addText(x2, { x: x + 0.2, y: 3.2, w: 2.5, h: 0.75, fontFace: "Nirmala UI", fontSize: 10, color: c, bold: true, margin: 0, isTextBox: true, valign: "top" });
  });
  card(s, 0.5, 4.2, 9.05, 0.95, PALE);
  s.addText([
    { text: "Already statewide: ", options: { bold: true, color: TEAL } },
    { text: "3,948 facilities in all 75 UP districts are on the map today. A new state needs its facility list, register template and languages, not new code.", options: { color: MUTED } },
  ], { x: 0.7, y: 4.25, w: 8.65, h: 0.85, fontFace: BODY, fontSize: 13, margin: 0, isTextBox: true, valign: "middle" });
  s.addNotes("Scaling is configuration, not rebuilding: language, register template and medicine catalogue are separate files. Phase two adds state languages. Phase three turns the near-expiry batches we already detect into transfers, always with officer approval.");
}

// ---------- 11. Rubric map ----------
{
  const s = pres.addSlide();
  s.background = { color: PALE };
  title(s, "How this maps to the judging criteria");
  const hdr = { bold: true, color: WHITE, fill: { color: TEAL }, fontFace: BODY, fontSize: 12 };
  const c = (t, o = {}) => ({ text: t, options: { fontFace: BODY, fontSize: 11.5, color: INK, ...o } });
  const rows = [
    [{ text: "Criterion", options: hdr }, { text: "Weight", options: { ...hdr, align: "center" } }, { text: "Evidence you can open", options: hdr }],
    [c("AI / Technical execution"), c("25%", { align: "center", bold: true }), c("Gemini reads handwriting to JSON; function-calling assistant; multilingual alerts; OpenCV clean-up; 22-page evaluation")],
    [c("Problem–solution fit"), c("20%", { align: "center", bold: true }), c("Targets the audit-documented gap: DVDMS vs registers, at the pharmacist's end-of-day moment")],
    [c("Depth & reach across India"), c("20%", { align: "center", bold: true }), c("All 75 UP districts, 3,948 facilities, villages far from care; 16 languages; config-driven for other states")],
    [c("Deployability & scalability"), c("20%", { align: "center", bold: true }), c("Runs on Cloud Run; installable phone app; DVDMS bulk-entry output; four-week pilot plan")],
    [c("Impact potential"), c("15%", { align: "center", bold: true }), c("Stock-outs and expiry losses (reported in crores) at the source; expiry transfers with officer approval")],
  ];
  s.addTable(rows, { x: 0.5, y: 1.3, w: 9.05, colW: [2.6, 0.9, 5.55], rowH: [0.38, 0.62, 0.62, 0.62, 0.62, 0.62], border: { type: "solid", color: LINE, pt: 0.75 }, fill: { color: WHITE }, valign: "middle", margin: [0.04, 0.1, 0.04, 0.1] });
  s.addText("Deliverables: source code repository · demo video (3–5 min) · this deck · live prototype link.", { x: 0.5, y: 4.85, w: 9, h: 0.4, fontFace: BODY, fontSize: 12, color: MUTED, margin: 0, isTextBox: true });
  s.addNotes("For the judges: each criterion points to something openable. The accuracy evaluation and its caveats are in the repository.");
}

// ---------- 12. Close ----------
{
  const s = pres.addSlide();
  s.background = { color: DARK };
  s.addText("Your register already knows.\nNow DVDMS will too.", { x: 0.6, y: 1.2, w: 6.2, h: 1.6, fontFace: HEAD, fontSize: 34, bold: true, color: WHITE, margin: 0, isTextBox: true, valign: "top" });
  s.addText("One photo a day keeps the district's numbers true.", { x: 0.6, y: 3.0, w: 6.0, h: 0.5, fontFace: BODY, fontSize: 16, color: MINT, margin: 0, isTextBox: true });
  s.addText("Register Lens · Build with AI: Code for Communities 2.0 · Track 3", { x: 0.6, y: 4.6, w: 7, h: 0.35, fontFace: BODY, fontSize: 12, color: "A9E5D7", margin: 0, isTextBox: true });
  s.addShape(pres.shapes.OVAL, { x: 6.95, y: 1.35, w: 2.7, h: 2.7, fill: { color: WHITE }, line: { color: WHITE, width: 0 } });
  s.addImage({ path: art("all-checked_d3u6"), x: 7.2, y: 1.6, w: 2.2, h: 2.2, sizing: { type: "contain", w: 2.2, h: 2.2 } });
  s.addNotes("Thank you. Register Lens: your register already knows, now DVDMS will too.");
}

pres.writeFile({ fileName: path.join(__dirname, "Register-Lens-pitch-deck.pptx") }).then((f) => console.log("wrote", f));
