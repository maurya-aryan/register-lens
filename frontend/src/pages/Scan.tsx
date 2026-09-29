import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Camera, UploadCloud, ImagePlus, Loader2, CheckCheck, AlertTriangle, ArrowRight, ArrowLeft, Download, Send,
  FileSpreadsheet, Copy, RotateCcw, Truck, Sparkles, ChevronRight, Info,
} from "lucide-react";
import { Alert, api, Phc, Recon, Row, Scan as ScanT, Flag } from "../api";

type Phase = "capture" | "reading" | "review" | "reconcile" | "sync";
const STEPS: { k: Phase; label: string }[] = [
  { k: "capture", label: "Capture" },
  { k: "review", label: "Review" },
  { k: "reconcile", label: "Reconcile" },
  { k: "sync", label: "Sync & Alert" },
];
const idx = (p: Phase) => (p === "reading" ? 0 : STEPS.findIndex((s) => s.k === p));

function Stepper({ phase }: { phase: Phase }) {
  const cur = idx(phase);
  return (
    <ol className="flex items-center gap-2 sm:gap-3 justify-center flex-wrap">
      {STEPS.map((s, i) => (
        <li key={s.k} className="flex items-center gap-2 sm:gap-3">
          <div className={`flex items-center gap-2 rounded-full pl-1.5 pr-4 py-1.5 font-bold text-sm transition-all ${i === cur ? "bg-brand-600 text-white shadow-card" : i < cur ? "bg-brand-100 text-brand-800" : "bg-white text-muted border border-line"}`}>
            <span className={`h-7 w-7 rounded-full grid place-items-center text-xs font-extrabold ${i === cur ? "bg-white/25" : i < cur ? "bg-brand-600 text-white" : "bg-brand-50"}`}>
              {i < cur ? <CheckCheck size={15} /> : i + 1}
            </span>
            {s.label}
          </div>
          {i < STEPS.length - 1 && <ChevronRight size={16} className="text-brand-300" />}
        </li>
      ))}
    </ol>
  );
}

function recomputeFlags(r: Row): Flag[] {
  const keep = r.flags.filter((f) => !["balance", "over_issue", "missing_qty"].includes(f.code));
  const { opening: o, received: rc, issued: i, closing: c } = r;
  if (o == null || i == null || c == null) keep.push({ code: "missing_qty", level: "warn", msg: "A quantity is missing." });
  else {
    const exp = o + (rc || 0) - i;
    if (exp !== c) keep.push({ code: "balance", level: "error", msg: `Does not add up: ${o} + ${rc || 0} - ${i} = ${exp}, but closing is ${c}.` });
    if (i > o + (rc || 0)) keep.push({ code: "over_issue", level: "error", msg: "Issued more than was in stock." });
  }
  return keep;
}

const numOrNull = (v: string) => (v.trim() === "" ? null : Number.isFinite(Number(v)) ? Math.round(Number(v)) : null);

/* ------------------------------ CAPTURE ------------------------------ */
function Capture({ phcs, phc, setPhc, onFile, onSample, samples, highlightSamples }: {
  phcs: Phc[]; phc: string; setPhc: (v: string) => void; onFile: (f: File) => void; onSample: (n: string) => void;
  samples: { name: string; url: string; thumb: string }[]; highlightSamples: boolean;
}) {
  const [drag, setDrag] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const sampleRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (highlightSamples) setTimeout(() => sampleRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 350); }, [highlightSamples]);
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-5xl mx-auto">
      <div className="grid md:grid-cols-[1fr_260px] gap-5 items-stretch">
        <div
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files?.[0]; if (f) onFile(f); }}
          onClick={() => input.current?.click()}
          className={`relative cursor-pointer rounded-[1.6rem] border-2 border-dashed p-10 text-center transition-all bg-white ${drag ? "border-brand-500 bg-brand-50 scale-[1.01]" : "border-brand-200 hover:border-brand-400 hover:bg-brand-50/40"}`}
        >
          <input ref={input} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
          <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 2.6, repeat: Infinity }} className="mx-auto h-20 w-20 rounded-3xl bg-brand-100 grid place-items-center text-brand-700">
            <UploadCloud size={38} />
          </motion.div>
          <div className="mt-5 text-2xl font-extrabold">Drop a photo of the register page</div>
          <p className="text-muted mt-1">or click to choose a file. On a phone this opens the camera.</p>
          <div className="mt-5 inline-flex btn btn-primary"><Camera size={20} /> Choose photo</div>
          <p className="text-xs text-muted mt-4">JPG or PNG · up to 15 MB · flat page in good light works best</p>
        </div>
        <div className="card p-5 flex flex-col gap-3">
          <label className="text-sm font-extrabold">Which health centre?</label>
          <select value={phc} onChange={(e) => setPhc(e.target.value)} className="rounded-xl border border-line bg-white px-3 py-3 font-bold focus:outline-none focus:border-brand-400">
            {phcs.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
          </select>
          <div className="text-sm text-muted leading-relaxed">
            {phcs.find((p) => p.id === phc)?.district} district, {phcs.find((p) => p.id === phc)?.state}. Sample data for the demo.
          </div>
          <img src="/img/art/doctors-orders_a8sv.svg" alt="" aria-hidden className="hidden md:block h-28 mx-auto mt-1" />
          <div className="mt-auto rounded-2xl bg-brand-50 p-3 text-sm text-brand-800 flex gap-2"><Info size={18} className="shrink-0 mt-0.5" /> The pharmacist always reviews the result before anything is used.</div>
        </div>
      </div>

      <div ref={sampleRef} className={`mt-8 card p-6 transition-shadow ${highlightSamples ? "ring-4 ring-brand-200" : ""}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-2xl bg-amber-100 grid place-items-center text-amber-700"><ImagePlus size={20} /></div>
          <div>
            <div className="font-extrabold text-lg leading-tight">No register handy? Try a sample page</div>
            <div className="text-sm text-muted">Synthetic handwritten pages, some clean and some tricky. Pick one.</div>
          </div>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {samples.slice(0, 12).map((s) => (
            <button key={s.name} onClick={() => onSample(s.name)} className="group relative rounded-2xl overflow-hidden border border-line bg-brand-50 aspect-[3/4] hover:shadow-pop hover:-translate-y-1 transition-all">
              <img src={s.thumb} alt={s.name} loading="lazy" className="h-full w-full object-cover object-top" />
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent text-white text-[11px] font-bold p-1.5 text-left">
                {s.name.replace(/\.jpg|\.png/g, "").replace("reg_", "Page ").replace("_", " · ")}
              </span>
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/* ------------------------------ READING ------------------------------ */
const READ_STEPS = ["Cleaning up the photo", "Gemini is reading the handwriting", "Matching medicine names", "Checking every balance"];
function Reading({ preview }: { preview: string | null }) {
  const [i, setI] = useState(0);
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((x) => Math.min(READ_STEPS.length - 1, x + 1)), 2600);
    const s = setInterval(() => setSecs((x) => x + 1), 1000);
    return () => { clearInterval(t); clearInterval(s); };
  }, []);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-4xl mx-auto card p-8 grid md:grid-cols-[260px_1fr] gap-8 items-center">
      <div className="relative rounded-2xl overflow-hidden bg-brand-50 aspect-[3/4]">
        {preview ? <img src={preview} alt="register" className="h-full w-full object-cover object-top" /> : <div className="shimmer h-full w-full" />}
        <motion.div className="absolute inset-x-0 h-16 bg-gradient-to-b from-transparent via-brand-400/50 to-transparent" animate={{ top: ["-10%", "90%", "-10%"] }} transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }} />
        <motion.div className="absolute inset-x-0 h-[3px] bg-brand-500" animate={{ top: ["3%", "97%", "3%"] }} transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }} />
      </div>
      <div>
        <div className="flex items-center gap-3"><Loader2 className="animate-spin text-brand-600" /><div className="text-2xl font-extrabold">Reading your register…</div></div>
        <ul className="mt-6 space-y-3">
          {READ_STEPS.map((s, k) => (
            <li key={s} className={`flex items-center gap-3 font-bold transition-all ${k <= i ? "text-ink" : "text-muted/50"}`}>
              <span className={`h-7 w-7 rounded-full grid place-items-center ${k < i ? "bg-brand-600 text-white" : k === i ? "bg-brand-100 text-brand-700" : "bg-brand-50"}`}>
                {k < i ? <CheckCheck size={15} /> : k === i ? <Loader2 size={14} className="animate-spin" /> : k + 1}
              </span>
              {s}
            </li>
          ))}
        </ul>
        <p className="mt-6 text-sm text-muted">{secs}s · A full page usually takes 10–40 seconds. Please don't close this tab.</p>
      </div>
    </motion.div>
  );
}

/* ------------------------------ REVIEW ------------------------------ */
function Review({ scan, phcName, rows, setRows, confirmed, setConfirmed, onNext, onBack }: {
  scan: ScanT; phcName: string; rows: Row[]; setRows: (r: Row[]) => void; confirmed: Set<number>; setConfirmed: (s: Set<number>) => void; onNext: () => void; onBack: () => void;
}) {
  const thr = scan.low_conf_threshold;
  const [view, setView] = useState<"clean" | "orig">("clean");
  const needs = (r: Row) => r.flags.some((f) => f.level !== "info") || Object.values(r.confidence).some((v) => v < thr);
  const pending = rows.filter((r) => needs(r) && !confirmed.has(r.id));
  const setField = (id: number, patch: Partial<Row>, group?: keyof Row["confidence"]) => {
    setRows(rows.map((r) => {
      if (r.id !== id) return r;
      const n = { ...r, ...patch, confidence: { ...r.confidence, ...(group ? { [group]: 1 } : {}) } };
      n.flags = recomputeFlags(n);
      return n;
    }));
    const s = new Set(confirmed); s.add(id); setConfirmed(s);
  };
  const lowCls = (r: Row, g: keyof Row["confidence"]) => (r.confidence[g] < thr ? "cell-low" : "");
  const errCls = (r: Row) => (r.flags.some((f) => f.code === "balance" || f.code === "over_issue") ? "cell-err" : "");
  const flagged = rows.filter(needs).length;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
      <div className="grid xl:grid-cols-[minmax(320px,0.9fr)_1.6fr] gap-6 items-start">
        <div className="card p-4 xl:sticky xl:top-24">
          <div className="flex gap-2 mb-3">
            {([["clean", "What Gemini saw"], ["orig", "Original photo"]] as const).map(([k, l]) => (
              <button key={k} onClick={() => setView(k)} className={`chip !text-sm !py-1.5 !px-4 ${view === k ? "bg-brand-600 text-white" : "bg-brand-50 text-brand-800"}`}>{l}</button>
            ))}
          </div>
          <div className="rounded-2xl overflow-auto max-h-[64vh] bg-brand-50"><img src={view === "clean" ? scan.clean_url : scan.original_url} alt="register" className="w-full" /></div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {scan.steps.map((s) => (<span key={s} className="chip bg-brand-50 text-brand-800">{s}</span>))}
          </div>
          <div className="mt-3 text-xs text-muted">Read by <b>{scan.meta.model}</b>{scan.meta.escalated ? " (Pro re-check)" : ""}{scan.meta.cached ? " · cached result" : ""} · {scan.page_date ? `page dated ${scan.page_date}` : "no date on page"}</div>
        </div>

        <div className="card p-5">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="text-xl font-extrabold mr-auto">Check what Gemini read</div>
            <span className="chip bg-brand-100 text-brand-800">{rows.length} lines</span>
            <span className={`chip ${pending.length ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}>
              {pending.length ? <><AlertTriangle size={13} /> {pending.length} need a look</> : <><CheckCheck size={13} /> all checked</>}
            </span>
          </div>
          {scan.phc_switched && (
            <div className="mb-3 rounded-xl bg-sky-50 border border-sky-100 text-sky-800 px-3 py-2 text-sm font-semibold flex gap-2"><Info size={16} className="shrink-0 mt-0.5" /> {scan.facility_written ? `The page is headed “${scan.facility_written}”, so I matched it to ${phcName}.` : `Using the health centre this page belongs to: ${phcName}.`}</div>
          )}
          <p className="text-sm text-muted mb-3">Yellow cells are ones Gemini was unsure about. Red means the numbers do not add up. Amber notes come from checking the batch against DVDMS. Click any cell to fix it, or confirm the line as it is.</p>
          <div className="overflow-auto max-h-[62vh] rounded-xl border border-line">
            <table className="reg w-full text-sm min-w-[820px]">
              <thead><tr>
                <th className="w-[26%]">Medicine</th><th>Batch</th><th>Expiry</th><th>Open</th><th>Recv</th><th>Issued</th><th>Close</th><th className="w-[90px]"></th>
              </tr></thead>
              <tbody>
                {rows.map((r) => {
                  const isPending = needs(r) && !confirmed.has(r.id);
                  return (
                    <tr key={r.id} className={isPending ? "bg-amber-50/40" : ""}>
                      <td>
                        <input className={`cell-input ${lowCls(r, "drug")}`} value={r.drug_name_raw} onChange={(e) => setField(r.id, { drug_name_raw: e.target.value }, "drug")} />
                        <div className="px-2 text-[11px] font-bold">
                          {r.med_name ? <span className="text-brand-700">→ {r.med_name}{r.matched_by === "gemini" ? " (AI matched)" : ""}</span> : <span className="text-amber-700">not matched</span>}
                        </div>
                        {r.flags.filter((f) => f.level !== "info").map((f) => (
                          <div key={f.code} className={`px-2 mt-0.5 text-[11px] leading-snug font-semibold ${f.level === "error" ? "text-rose-600" : "text-amber-700"}`}>⚠ {f.msg}</div>
                        ))}
                      </td>
                      <td><input className={`cell-input ${lowCls(r, "batch")}`} value={r.batch ?? ""} onChange={(e) => setField(r.id, { batch: e.target.value }, "batch")} /></td>
                      <td><input className={`cell-input ${lowCls(r, "expiry")}`} value={r.expiry ?? ""} placeholder="YYYY-MM" onChange={(e) => setField(r.id, { expiry: e.target.value }, "expiry")} /></td>
                      {(["opening", "received", "issued", "closing"] as const).map((k) => (
                        <td key={k}><input inputMode="numeric" className={`cell-input ${lowCls(r, "qty")} ${k === "closing" ? errCls(r) : ""}`} value={r[k] ?? ""} onChange={(e) => setField(r.id, { [k]: numOrNull(e.target.value) } as Partial<Row>, "qty")} /></td>
                      ))}
                      <td className="text-right pr-2">
                        {isPending ? (
                          <button onClick={() => { const s = new Set(confirmed); s.add(r.id); setConfirmed(s); }} className="chip !text-xs bg-amber-100 text-amber-800 hover:bg-amber-200 cursor-pointer">Confirm</button>
                        ) : needs(r) ? (
                          <span className="chip bg-green-100 text-green-700"><CheckCheck size={12} /> OK</span>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-5 flex flex-wrap gap-3 items-center justify-between">
            <button className="btn btn-ghost" onClick={onBack}><ArrowLeft size={18} /> Start over</button>
            <div className="flex gap-3 flex-wrap">
              {pending.length > 0 && (
                <button className="btn btn-ghost" onClick={() => setConfirmed(new Set(rows.map((r) => r.id)))}><CheckCheck size={18} /> Confirm all {flagged ? `(${pending.length})` : ""}</button>
              )}
              <button className="btn btn-primary" disabled={pending.length > 0} onClick={onNext} title={pending.length ? "Confirm the highlighted lines first" : ""}>
                Compare with DVDMS <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ------------------------------ RECONCILE ------------------------------ */
const statusStyle = {
  critical: { bg: "bg-rose-50", ring: "border-rose-200", chip: "bg-rose-100 text-rose-600", label: "Running out" },
  warning: { bg: "bg-amber-50", ring: "border-amber-200", chip: "bg-amber-100 text-amber-700", label: "Getting low" },
  ok: { bg: "bg-white", ring: "border-line", chip: "bg-green-100 text-green-700", label: "OK" },
} as const;

function Reconcile({ rec, onNext, onBack }: { rec: Recon; onNext: () => void; onBack: () => void }) {
  const [filter, setFilter] = useState<"all" | "critical" | "warning" | "ok">("all");
  const items = rec.items.filter((i) => filter === "all" || i.status === filter);
  const s = rec.summary;
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-6xl mx-auto">
      <div className="grid sm:grid-cols-4 gap-4">
        {[
          { l: "Running out (≤ 7 days)", v: s.critical, c: "text-rose-600 bg-rose-50" },
          { l: "Getting low (≤ 15 days)", v: s.warning, c: "text-amber-700 bg-amber-50" },
          { l: "DVDMS overstated", v: s.phantom, c: "text-sky-700 bg-sky-50" },
          { l: "Expiring in 60 days", v: s.expiring, c: "text-brand-700 bg-brand-50" },
        ].map((x, i) => (
          <motion.div key={x.l} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} className={`rounded-3xl p-5 ${x.c}`}>
            <div className="text-4xl font-extrabold">{x.v}</div>
            <div className="text-sm font-bold opacity-80">{x.l}</div>
          </motion.div>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <div className="text-xl font-extrabold mr-auto">DVDMS vs the register · {rec.phc?.name}</div>
        {(["all", "critical", "warning", "ok"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`chip !text-sm !py-1.5 !px-4 capitalize ${filter === f ? "bg-brand-600 text-white" : "bg-white border border-line text-brand-800"}`}>{f === "all" ? "All" : statusStyle[f].label}</button>
        ))}
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((it, i) => {
          const st = statusStyle[it.status];
          const max = Math.max(it.dvdms_qty, it.register_closing, 1);
          return (
            <motion.div key={it.med_code} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 12) * 0.04 }} className={`rounded-3xl border p-5 ${st.bg} ${st.ring} shadow-card`}>
              <div className="flex items-start justify-between gap-2">
                <div className="font-extrabold leading-tight">{it.med_name}</div>
                <span className={`chip shrink-0 ${st.chip}`}>{st.label}</span>
              </div>
              <div className="mt-4 space-y-2.5">
                <div>
                  <div className="flex justify-between text-xs font-bold text-muted"><span>DVDMS shows</span><span>{it.dvdms_qty.toLocaleString("en-IN")} {it.unit}</span></div>
                  <div className="h-3 rounded-full bg-white/80 overflow-hidden"><motion.div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-300" initial={{ width: 0 }} animate={{ width: `${(it.dvdms_qty / max) * 100}%` }} transition={{ duration: 0.9, delay: 0.1 }} /></div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-bold text-muted"><span>Register says</span><span>{it.register_closing.toLocaleString("en-IN")} {it.unit}</span></div>
                  <div className="h-3 rounded-full bg-white/80 overflow-hidden"><motion.div className="h-full rounded-full bg-gradient-to-r from-brand-600 to-brand-400" initial={{ width: 0 }} animate={{ width: `${(it.register_closing / max) * 100}%` }} transition={{ duration: 0.9, delay: 0.25 }} /></div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-center">
                <div className="rounded-2xl bg-white/80 py-2"><div className="text-[11px] font-bold text-muted">DVDMS thinks</div><div className="text-xl font-extrabold text-amber-700">{it.days_dvdms} d</div></div>
                <div className="rounded-2xl bg-white/80 py-2"><div className="text-[11px] font-bold text-muted">Reality</div><div className={`text-xl font-extrabold ${it.status === "critical" ? "text-rose-600" : "text-brand-700"}`}>{it.days_real} d</div></div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {it.phantom_stock && <span className="chip bg-sky-100 text-sky-700">DVDMS overstated by {it.drift_pct}%</span>}
                {it.expiring_soon && <span className="chip bg-brand-100 text-brand-800">Expires {it.expiry}</span>}
              </div>
              <div className="mt-2 text-[11px] text-muted">Uses ~{it.daily_use}/day ({it.daily_use_source === "register" ? "from today's register" : "typical for this centre"})</div>
            </motion.div>
          );
        })}
      </div>
      <div className="mt-8 flex justify-between flex-wrap gap-3">
        <button className="btn btn-ghost" onClick={onBack}><ArrowLeft size={18} /> Back to review</button>
        <button className="btn btn-primary" onClick={onNext}>Prepare DVDMS entry & alert <ArrowRight size={18} /></button>
      </div>
    </motion.div>
  );
}

/* ------------------------------ SYNC ------------------------------ */
function Sync({ rec, rows, phcId, onAgain }: { rec: Recon; rows: Row[]; phcId: string; onAgain: () => void }) {
  const [alert, setAlert] = useState<Alert | null>(null);
  const [alertErr, setAlertErr] = useState("");
  const [lang, setLang] = useState<"en" | "hi">("hi");
  const [sent, setSent] = useState(false);
  const [dl, setDl] = useState(false);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    let live = true;
    api.alert(rec).then((a) => live && setAlert(a)).catch((e) => live && setAlertErr(e.message));
    return () => { live = false; };
  }, [rec]);
  const download = async () => {
    const blob = await api.exportXlsx(phcId, rows);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `dvdms_bulk_entry_${phcId}.xlsx`;
    a.click();
    setDl(true);
  };
  const text = alert ? alert[lang] : "";
  const expiring = rec.items.filter((i) => i.expiring_soon);
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-5xl mx-auto grid md:grid-cols-2 gap-6">
      <div className="card p-6 flex flex-col">
        <div className="flex items-start justify-between">
          <div className="h-12 w-12 rounded-2xl bg-brand-100 text-brand-700 grid place-items-center"><FileSpreadsheet /></div>
          <img src="/img/art/document-ready_o5d5.svg" alt="" aria-hidden className="h-24 -mt-2" />
        </div>
        <div className="text-xl font-extrabold mt-1">DVDMS bulk-entry file</div>
        <p className="text-muted mt-1 leading-relaxed">All {rows.filter((r) => r.med_code).length} confirmed lines in a ready-to-upload sheet: facility, drug code, batch, expiry, opening, received, issued and closing stock.</p>
        <div className="mt-auto pt-5">
          <button className="btn btn-primary w-full" onClick={download}><Download size={18} /> {dl ? "Download again" : "Download Excel file"}</button>
          {dl && <div className="text-sm text-green-700 font-bold mt-2 flex items-center gap-1"><CheckCheck size={16} /> Saved. Review it, then upload to DVDMS.</div>}
          <div className="text-xs text-muted mt-2">DVDMS-compatible template. Not connected to the live system in this prototype.</div>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-amber-100 text-amber-700 grid place-items-center"><Sparkles /></div>
          <div className="text-xl font-extrabold mr-auto">District alert</div>
          <div className="flex rounded-full bg-brand-50 p-1">
            {(["hi", "en"] as const).map((l) => (
              <button key={l} onClick={() => setLang(l)} className={`px-4 py-1.5 rounded-full text-sm font-extrabold transition-all ${lang === l ? "bg-white shadow text-brand-700" : "text-muted"}`}>{l === "hi" ? "हिन्दी" : "English"}</button>
            ))}
          </div>
        </div>
        <div className={`mt-4 rounded-2xl border border-line bg-brand-50/50 p-4 min-h-[190px] whitespace-pre-wrap leading-relaxed ${lang === "hi" ? "hi" : ""}`}>
          {alert ? text : alertErr ? <span className="text-rose-600">Could not write the alert: {alertErr}</span> : (
            <div className="space-y-3"><div className="shimmer h-4 rounded w-3/4" /><div className="shimmer h-4 rounded" /><div className="shimmer h-4 rounded w-5/6" /><div className="shimmer h-4 rounded w-2/3" /><div className="text-sm text-muted flex items-center gap-2"><Loader2 size={15} className="animate-spin" /> Gemini is writing the alert…</div></div>
          )}
        </div>
        {alert && <div className="text-xs text-muted mt-1.5">Written by {alert.source.replace("gemini:", "Gemini · ")} from the numbers above, nothing invented.</div>}
        <div className="mt-4 flex gap-3">
          <button className="btn btn-ghost" disabled={!alert} onClick={() => { navigator.clipboard?.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}><Copy size={17} /> {copied ? "Copied" : "Copy"}</button>
          <button className="btn btn-primary flex-1" disabled={!alert || sent} onClick={() => setSent(true)}><Send size={17} /> {sent ? "Sent to district (demo)" : "Send to district officer"}</button>
        </div>
        <AnimatePresence>{sent && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-3 rounded-2xl bg-green-50 text-green-800 p-3 text-sm font-bold flex gap-2"><CheckCheck size={18} /> Simulated: in the full product this goes to the District Drug Store Officer.</motion.div>
        )}</AnimatePresence>
      </div>

      {expiring.length > 0 && (
        <div className="md:col-span-2 card p-6 border-amber-200 bg-amber-50/50 flex flex-wrap gap-5 items-center">
          <div className="h-12 w-12 rounded-2xl bg-amber-100 text-amber-700 grid place-items-center"><Truck /></div>
          <div className="flex-1 min-w-[240px]">
            <div className="font-extrabold">{expiring.length} batch{expiring.length > 1 ? "es" : ""} expire within 60 days <span className="chip bg-amber-100 text-amber-700 ml-2">Phase 3</span></div>
            <p className="text-muted text-sm mt-1">Coming soon: send these to a nearby clinic or store that urgently needs them, with the district officer's approval. {expiring.map((e) => e.med_name.split(" ")[0]).join(", ")}.</p>
          </div>
        </div>
      )}

      <div className="md:col-span-2 flex flex-wrap gap-3 justify-between">
        <button className="btn btn-ghost" onClick={onAgain}><RotateCcw size={18} /> Scan another page</button>
        <Link to="/dashboard" className="btn btn-ghost">See district view <ArrowRight size={18} /></Link>
      </div>
    </motion.div>
  );
}

/* ------------------------------ PAGE ------------------------------ */
export default function ScanPage() {
  const [sp] = useSearchParams();
  const [phase, setPhase] = useState<Phase>("capture");
  const [phcs, setPhcs] = useState<Phc[]>([]);
  const [phc, setPhc] = useState("P09");
  const [samples, setSamples] = useState<{ name: string; url: string; thumb: string }[]>([]);
  const [scan, setScan] = useState<ScanT | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [confirmed, setConfirmed] = useState<Set<number>>(new Set());
  const [rec, setRec] = useState<Recon | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.phcs().then((p) => { setPhcs(p); if (!p.find((x) => x.id === "P09") && p[0]) setPhc(p[0].id); }).catch((e) => setErr(e.message));
    api.samples().then(setSamples).catch(() => undefined);
  }, []);

  useEffect(() => { window.scrollTo({ top: 0, behavior: "auto" }); }, [phase]);

  const begin = useCallback((s: ScanT) => {
    setScan(s); setRows(s.rows); setConfirmed(new Set());
    if (s.phc_switched) setPhc(s.phc_id);
    setPhase("review");
  }, []);
  const fail = (e: Error) => { setErr(e.message); setPhase("capture"); };
  const onFile = (f: File) => {
    setErr(""); setPreview(URL.createObjectURL(f)); setPhase("reading");
    api.scanFile(f, phc).then(begin).catch(fail);
  };
  const onSample = (name: string) => {
    setErr(""); setPreview(`/api/sample-image/${name}`); setPhase("reading");
    api.scanSample(name, phc).then(begin).catch(fail);
  };
  const toReconcile = async () => {
    setBusy(true); setErr("");
    try { setRec(await api.reconcile(phc, rows)); setPhase("reconcile"); }
    catch (e) { setErr((e as Error).message); }
    setBusy(false);
  };
  const reset = () => { setPhase("capture"); setScan(null); setRows([]); setRec(null); setPreview(null); setErr(""); };

  const head = useMemo(() => ({
    capture: ["Scan a register page", "Upload a photo, or try a sample page. It takes under a minute."],
    reading: ["Reading…", "Sit tight while Gemini reads the page."],
    review: ["Review the reading", "Fix anything that looks wrong. You are always in charge."],
    reconcile: ["What DVDMS says vs reality", "Numbers below are worked out by code from your confirmed table."],
    sync: ["Ready to sync", "Download the DVDMS entry and send the district alert."],
  }[phase]), [phase]);

  return (
    <div className="mx-auto max-w-7xl px-5 pt-8 pb-8">
      <div className="text-center mb-7">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{head[0]}</h1>
        <p className="text-muted mt-2 text-lg">{head[1]}</p>
      </div>
      <div className="mb-8"><Stepper phase={phase} /></div>
      <AnimatePresence>
        {err && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="max-w-3xl mx-auto mb-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 p-4 font-bold flex gap-3">
            <AlertTriangle className="shrink-0" /> <div>{err}<div className="font-normal text-sm mt-1">Nothing was lost. You can try again or pick a sample page.</div></div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence mode="wait">
        {phase === "capture" && <Capture key="c" phcs={phcs} phc={phc} setPhc={setPhc} onFile={onFile} onSample={onSample} samples={samples} highlightSamples={sp.get("sample") === "1"} />}
        {phase === "reading" && <Reading key="r" preview={preview} />}
        {phase === "review" && scan && <Review key="v" scan={scan} phcName={phcs.find((p) => p.id === phc)?.name ?? ""} rows={rows} setRows={setRows} confirmed={confirmed} setConfirmed={setConfirmed} onNext={toReconcile} onBack={reset} />}
        {phase === "reconcile" && rec && <Reconcile key="x" rec={rec} onBack={() => setPhase("review")} onNext={() => setPhase("sync")} />}
        {phase === "sync" && rec && <Sync key="s" rec={rec} rows={rows} phcId={phc} onAgain={reset} />}
      </AnimatePresence>
      {busy && <div className="fixed inset-0 bg-white/60 backdrop-blur-sm grid place-items-center z-50"><Loader2 className="animate-spin text-brand-600" size={40} /></div>}
    </div>
  );
}
