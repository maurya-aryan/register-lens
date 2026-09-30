import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { MapContainer, TileLayer, CircleMarker, Polyline, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { motion } from "framer-motion";
import { Check, X, Download, Truck, Loader2, MapPin, ShieldCheck, ArrowRight, Info, Undo2 } from "lucide-react";
import { api, Redist, Transfer } from "../api";
import { Counter } from "../components/Reveal";

function Fit({ pts }: { pts: [number, number][] }) {
  const map = useMap();
  useEffect(() => { if (pts.length) map.fitBounds(L.latLngBounds(pts), { padding: [30, 30] }); }, [pts, map]);
  return null;
}

export default function Redistribute() {
  const [sp, setSp] = useSearchParams();
  const [districts, setDistricts] = useState<string[]>([]);
  const district = sp.get("district") || "Barabanki";
  const [data, setData] = useState<Redist | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [err, setErr] = useState("");
  const [showAll, setShowAll] = useState(false);

  useEffect(() => { api.districts().then(setDistricts).catch(() => undefined); }, []);
  useEffect(() => { setData(null); api.redistribution(district).then(setData).catch((e) => setErr(e.message)); }, [district]);

  const decide = async (t: Transfer, decision: string) => {
    await api.decide(t.id, decision);
    setData((d) => d && { ...d, transfers: d.transfers.map((x) => (x.id === t.id ? { ...x, decision: decision === "pending" ? null : decision } : x)) });
  };
  const tsAll = (data?.transfers ?? []).filter((t) => filter === "all" || (filter === "pending" ? !t.decision : t.decision === filter));
  const ts = showAll ? tsAll : tsAll.slice(0, 25);
  const approved = (data?.transfers ?? []).filter((t) => t.decision === "approved");
  const pts = useMemo<[number, number][]>(() => (data?.transfers ?? []).slice(0, 25).flatMap((t) => [[t.from.lat, t.from.lon], [t.to.lat, t.to.lon]] as [number, number][]), [data]);

  return (
    <div className="mx-auto max-w-[1500px] px-4 pt-5 pb-6">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div>
          <div className="eyebrow mb-1 flex items-center gap-2">Phase 3 · Expiry redistribution</div>
          <h1 className="text-3xl md:text-[2.1rem] font-extrabold tracking-tight">Move medicines before they expire</h1>
          <p className="text-muted mt-1 max-w-3xl">Batches that will expire before a facility can use them are matched to nearby facilities that are running short. The district officer approves every move.</p>
        </div>
        <div className="flex gap-2 items-center">
          <select value={district} onChange={(e) => setSp({ district: e.target.value })} className="rounded-xl border border-line bg-white px-3 py-2.5 font-bold focus:outline-none focus:border-brand-400">
            {(districts.length ? districts : [district]).map((d) => <option key={d}>{d}</option>)}
          </select>
          <a href={`/api/redistribution/orders?district=${encodeURIComponent(district)}`} className={`btn btn-primary !py-2.5 ${approved.length ? "" : "pointer-events-none opacity-50"}`}><Download size={17} /> Transfer orders ({approved.length})</a>
        </div>
      </div>
      {err && <div className="mb-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 p-3 font-bold">{err}</div>}
      {!data ? <div className="py-24 grid place-items-center text-brand-600"><Loader2 className="animate-spin" size={36} /></div> : (
        <>
          <div className="grid sm:grid-cols-4 gap-3 mb-4">
            <div className="rounded-3xl p-4 bg-brand-50 text-brand-800"><Counter to={data.totals.transfers} className="text-3xl font-extrabold" /><div className="text-xs font-bold opacity-80">suggested transfers</div></div>
            <div className="rounded-3xl p-4 bg-amber-50 text-amber-700"><Counter to={data.totals.units} className="text-3xl font-extrabold" /><div className="text-xs font-bold opacity-80">units saved from expiry</div></div>
            <div className="rounded-3xl p-4 bg-rose-50 text-rose-600"><Counter to={data.totals.value} prefix="₹" className="text-3xl font-extrabold" /><div className="text-xs font-bold opacity-80">indicative value saved</div></div>
            <div className="rounded-3xl p-4 bg-green-50 text-green-700"><Counter to={approved.length} className="text-3xl font-extrabold" /><div className="text-xs font-bold opacity-80">approved by officer</div></div>
          </div>
          <div className="grid lg:grid-cols-[1.1fr_1fr] gap-4">
            <div className="card overflow-hidden h-[64vh] min-h-[480px] relative">
              <MapContainer center={[26.9, 81.2]} zoom={9} className="h-full w-full" preferCanvas>
                <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" className="tiles-soft" maxZoom={19} attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' />
                <Fit pts={pts} />
                {ts.map((t) => {
                  const on = hover === t.id;
                  const col = t.decision === "approved" ? "#2f9e6b" : t.decision === "rejected" ? "#b8c4c7" : "#f0a23b";
                  return (
                    <Polyline key={t.id} positions={[[t.from.lat, t.from.lon], [t.to.lat, t.to.lon]]}
                      pathOptions={{ color: col, weight: on ? 6 : 3, opacity: on ? 1 : 0.75, dashArray: t.decision ? undefined : "6 7" }}
                      eventHandlers={{ mouseover: () => setHover(t.id), mouseout: () => setHover(null) }}>
                      <Tooltip sticky>{t.qty} {t.unit} {t.med_name} · {t.km} km</Tooltip>
                    </Polyline>
                  );
                })}
                {ts.flatMap((t) => [
                  <CircleMarker key={t.id + "f"} center={[t.from.lat, t.from.lon]} radius={6} pathOptions={{ color: "#fff", weight: 1.5, fillColor: "#e5484d", fillOpacity: 0.95 }}><Tooltip>{t.from.name}: near-expiry stock</Tooltip></CircleMarker>,
                  <CircleMarker key={t.id + "t"} center={[t.to.lat, t.to.lon]} radius={6} pathOptions={{ color: "#fff", weight: 1.5, fillColor: "#1f9d8a", fillOpacity: 0.95 }}><Tooltip>{t.to.name}: running short</Tooltip></CircleMarker>,
                ])}
              </MapContainer>
              <div className="absolute left-3 bottom-3 z-[450] card !rounded-2xl px-3 py-2 text-[11px] font-bold text-muted space-y-1">
                <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-[#e5484d]" /> has stock expiring soon</div>
                <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-[#1f9d8a]" /> running short</div>
                <div className="flex items-center gap-2"><span className="w-5 border-t-2 border-dashed border-amber-500" /> suggested · <span className="w-5 border-t-2 border-green-600" /> approved</div>
              </div>
            </div>
            <div className="card p-4 flex flex-col h-[64vh] min-h-[480px]">
              <div className="flex flex-wrap gap-2 mb-3">
                {(["all", "pending", "approved", "rejected"] as const).map((f) => (
                  <button key={f} onClick={() => setFilter(f)} className={`chip !text-sm !py-1.5 !px-4 capitalize ${filter === f ? "bg-brand-600 text-white" : "bg-white border border-line text-brand-800"}`}>{f}</button>
                ))}
              </div>
              <div className="flex-1 overflow-auto -mr-2 pr-2 space-y-2.5">
                {ts.length === 0 && <div className="text-muted text-center py-10">No transfers in this view.</div>}
                {!showAll && tsAll.length > 25 && <div className="text-xs font-bold text-muted px-1">Showing the 25 highest-value of {tsAll.length}. <button className="underline text-brand-700" onClick={() => setShowAll(true)}>Show all</button></div>}
                {ts.map((t, i) => (
                  <motion.div key={t.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 10) * 0.03 }}
                    onMouseEnter={() => setHover(t.id)} onMouseLeave={() => setHover(null)}
                    className={`rounded-2xl border p-3.5 transition-all ${hover === t.id ? "border-brand-400 shadow-card" : "border-line"} ${t.decision === "approved" ? "bg-green-50/60" : t.decision === "rejected" ? "bg-slate-50 opacity-70" : "bg-white"}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-extrabold leading-tight">{t.qty.toLocaleString("en-IN")} {t.unit} · {t.med_name}</div>
                      <span className="chip bg-amber-100 text-amber-800 shrink-0">expires in {t.days_to_expiry} d</span>
                    </div>
                    <div className="mt-1.5 text-sm flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-rose-600">{t.from.name}</span><ArrowRight size={14} className="text-muted" /><span className="font-bold text-brand-700">{t.to.name}</span>
                    </div>
                    <div className="mt-1 text-xs text-muted flex flex-wrap gap-x-3"><span><MapPin size={11} className="inline" /> {t.km} km</span><span>batch {t.batch}</span><span>≈ ₹{t.value.toLocaleString("en-IN")} saved</span><span>covers {t.stockout_days_avoided} days of need</span></div>
                    <div className="mt-2.5 flex gap-2">
                      {t.decision ? (
                        <>
                          <span className={`chip ${t.decision === "approved" ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-600"}`}>{t.decision === "approved" ? <><ShieldCheck size={13} /> Approved</> : "Rejected"}</span>
                          <button onClick={() => decide(t, "pending")} className="chip bg-white border border-line text-muted cursor-pointer"><Undo2 size={12} /> Undo</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => decide(t, "approved")} className="btn btn-primary !py-1.5 !px-4 text-sm"><Check size={15} /> Approve</button>
                          <button onClick={() => decide(t, "rejected")} className="btn btn-ghost !py-1.5 !px-4 text-sm"><X size={15} /> Reject</button>
                        </>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="mt-3 rounded-2xl bg-sky-50 border border-sky-100 text-sky-800 p-3 text-xs font-semibold flex gap-2"><Info size={15} className="shrink-0 mt-0.5" />
                Rules: batch expires within {data.rules.expiry_window_days} days and won't be used up in time; receiver has under {data.rules.short_days} days of stock; top-up to {data.rules.target_days} days; within {data.rules.max_km} km; receiver must be able to use it before expiry. Values are indicative. Stock is simulated except for scanned facilities.</div>
            </div>
          </div>
          <div className="mt-4 text-sm text-muted flex items-center gap-2"><Truck size={16} /> See where these facilities sit on the <Link className="underline font-bold text-brand-700" to={`/map?district=${encodeURIComponent(district)}`}>district map</Link>.</div>
        </>
      )}
    </div>
  );
}
