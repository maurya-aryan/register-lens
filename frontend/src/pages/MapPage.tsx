import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { MapContainer, TileLayer, GeoJSON, CircleMarker, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Camera, Info, Loader2, MapPin, Search, Truck, X, Home as HomeIcon, Layers } from "lucide-react";
import { api, DistrictData, FacDetail, FacSum, Overview } from "../api";
import { Counter } from "../components/Reveal";

const UP_BOUNDS: L.LatLngBoundsExpression = [[23.8, 77.0], [30.5, 84.7]];
const RISK = { high: "#e5484d", medium: "#f0a23b", low: "#1f9d8a" } as const;
const KIND_R = { DH: 10, CHC: 8, PHC: 6.5, HWC: 4 } as const;
const KIND_NAME = { DH: "District hospital", CHC: "Community Health Centre", PHC: "Primary Health Centre", HWC: "Health & Wellness Centre" } as const;

function shade(p: number) {
  // teal (low) -> amber -> rose (high), p in %
  if (p < 5) return "#bfe9df";
  if (p < 8) return "#8fd8c6";
  if (p < 11) return "#f6d58e";
  if (p < 14) return "#f3b36b";
  return "#ec8a7f";
}

function FitTo({ bounds }: { bounds: L.LatLngBoundsExpression | null }) {
  const map = useMap();
  useEffect(() => { if (bounds) map.flyToBounds(bounds, { padding: [30, 30], duration: 0.8 }); }, [bounds, map]);
  return null;
}

function FacilityDrawer({ id, onClose }: { id: string; onClose: () => void }) {
  const [d, setD] = useState<FacDetail | null>(null);
  useEffect(() => { setD(null); api.facility(id).then(setD).catch(() => undefined); }, [id]);
  return (
    <motion.div initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 40, opacity: 0 }}
      className="absolute right-3 top-3 bottom-3 w-[360px] max-w-[calc(100%-24px)] z-[500] card p-5 overflow-auto">
      <button onClick={onClose} className="absolute right-3 top-3 h-8 w-8 rounded-full bg-brand-50 grid place-items-center text-brand-700" aria-label="Close"><X size={16} /></button>
      {!d ? <div className="py-20 grid place-items-center text-brand-600"><Loader2 className="animate-spin" /></div> : (
        <>
          <div className="text-xs font-extrabold tracking-widest text-muted">{KIND_NAME[d.kind]}</div>
          <div className="text-xl font-extrabold leading-tight pr-8 mt-1">{d.name}</div>
          <div className="text-sm text-muted mt-1 flex items-center gap-1"><MapPin size={13} /> {d.village || d.block || ""}{d.village || d.block ? ", " : ""}{d.district}</div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <span className="chip" style={{ background: RISK[d.risk] + "22", color: RISK[d.risk] }}>{d.risk === "high" ? "High risk" : d.risk === "medium" ? "Watch" : "Stable"}</span>
            {d.scanned ? <span className="chip bg-green-100 text-green-700">Register scanned</span> : <span className="chip bg-sky-50 text-sky-700">Simulated stock</span>}
            {d.demo && <span className="chip bg-amber-100 text-amber-700">Demo PHC</span>}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-2xl bg-rose-50 py-2"><div className="text-xl font-extrabold text-rose-600">{d.critical}</div><div className="text-[10px] font-bold text-muted">running out</div></div>
            <div className="rounded-2xl bg-sky-50 py-2"><div className="text-xl font-extrabold text-sky-700">{d.phantom}</div><div className="text-[10px] font-bold text-muted">DVDMS overstated</div></div>
            <div className="rounded-2xl bg-amber-50 py-2"><div className="text-xl font-extrabold text-amber-700">₹{d.expiry_value.toLocaleString("en-IN")}</div><div className="text-[10px] font-bold text-muted">may expire</div></div>
          </div>
          <div className="mt-4 text-sm font-extrabold">Lowest stock</div>
          <div className="mt-2 space-y-1.5">
            {d.lines.slice(0, 10).map((l) => (
              <div key={l.med_code} className="rounded-xl border border-line px-3 py-2">
                <div className="flex justify-between gap-2 text-sm font-bold"><span className="truncate">{l.med_name}</span>
                  <span className={l.status === "critical" ? "text-rose-600" : l.status === "warning" ? "text-amber-700" : "text-brand-700"}>{l.days_real} d</span></div>
                <div className="text-[11px] text-muted">DVDMS shows {l.days_dvdms} d · {l.register.toLocaleString("en-IN")} {l.unit} on shelf</div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <Link to={`/scan?fid=${d.id}&district=${encodeURIComponent(d.district)}`} className="btn btn-primary flex-1 !py-2.5 text-sm"><Camera size={16} /> Scan this register</Link>
            <Link to={`/redistribute?district=${encodeURIComponent(d.district)}`} className="btn btn-ghost !py-2.5 text-sm"><Truck size={16} /></Link>
          </div>
        </>
      )}
    </motion.div>
  );
}

export default function MapPage() {
  const [sp, setSp] = useSearchParams();
  const district = sp.get("district");
  const [geo, setGeo] = useState<GeoJSON.FeatureCollection | null>(null);
  const [ov, setOv] = useState<Overview | null>(null);
  const [dd, setDd] = useState<DistrictData | null>(null);
  const [sel, setSel] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [layers, setLayers] = useState({ HWC: true, gaps: true });
  const [err, setErr] = useState("");
  const geoKey = useRef(0);

  useEffect(() => {
    api.geojson().then(setGeo).catch((e) => setErr(e.message));
    api.overview().then(setOv).catch((e) => setErr(e.message));
  }, []);
  useEffect(() => {
    setSel(null); setDd(null);
    if (district) api.district(district).then(setDd).catch((e) => setErr(e.message));
  }, [district]);

  const byName = useMemo(() => Object.fromEntries((ov?.districts ?? []).map((d) => [d.district, d])), [ov]);
  const bounds = useMemo<L.LatLngBoundsExpression | null>(() => {
    if (!geo) return null;
    if (!district) return UP_BOUNDS;
    const f = geo.features.find((x) => x.properties?.name === district);
    return f ? L.geoJSON(f as GeoJSON.Feature).getBounds() : UP_BOUNDS;
  }, [geo, district]);
  geoKey.current += 0;

  const list = (ov?.districts ?? []).filter((d) => d.district.toLowerCase().includes(q.toLowerCase())).sort((a, b) => b.high_pct - a.high_pct);
  const facs: FacSum[] = (dd?.facilities ?? []).filter((f) => f.lat != null && (layers.HWC || f.kind !== "HWC"));
  const cur = district ? byName[district] : null;

  return (
    <div className="mx-auto max-w-[1500px] px-4 pt-5 pb-6">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div>
          <div className="eyebrow mb-1">{district ? "District view" : "Uttar Pradesh"}</div>
          <h1 className="text-3xl md:text-[2.1rem] font-extrabold tracking-tight">{district ? `${district} district` : "Every public health facility in UP, on one map"}</h1>
          <p className="text-muted mt-1">{district ? "Click a facility to see its stock. Red means medicines are running out." : "75 districts · real facility locations from OpenStreetMap. Click a district to zoom in."}</p>
        </div>
        <div className="flex gap-2">
          {district && <button onClick={() => setSp({})} className="btn btn-ghost !py-2.5"><ArrowLeft size={17} /> All of UP</button>}
          {district && <Link to={`/redistribute?district=${encodeURIComponent(district)}`} className="btn btn-primary !py-2.5"><Truck size={17} /> Expiry transfers</Link>}
        </div>
      </div>
      {err && <div className="mb-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 p-3 font-bold">{err}</div>}

      <div className="grid lg:grid-cols-[1fr_340px] gap-4">
        <div className="relative card overflow-hidden h-[70vh] min-h-[520px]">
          <MapContainer bounds={UP_BOUNDS} className="h-full w-full" preferCanvas zoomSnap={0.25} scrollWheelZoom>
            <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>' />
            <FitTo bounds={bounds} />
            {geo && ov && (
              <GeoJSON key={`g-${district ?? "all"}-${ov.totals.facilities}`} data={geo}
                style={(f) => {
                  const n = f?.properties?.name as string;
                  const r = byName[n];
                  const active = district === n;
                  return district
                    ? { color: active ? "#14665c" : "#9cc9bf", weight: active ? 2.5 : 0.8, fillColor: active ? "#ffffff" : "#e8f4f1", fillOpacity: active ? 0.05 : 0.55 }
                    : { color: "#ffffff", weight: 1, fillColor: shade(r?.high_pct ?? 0), fillOpacity: 0.78 };
                }}
                onEachFeature={(f, layer) => {
                  const n = f.properties?.name as string;
                  const r = byName[n];
                  layer.bindTooltip(`<b>${n}</b><br/>${r?.facilities ?? 0} facilities · ${r?.high_pct ?? 0}% high risk`, { sticky: true });
                  layer.on({ click: () => setSp({ district: n }), mouseover: (e) => (e.target as L.Path).setStyle({ weight: 2.5 }), mouseout: (e) => (e.target as L.Path).setStyle({ weight: district === n ? 2.5 : district ? 0.8 : 1 }) });
                }} />
            )}
            {district && layers.gaps && dd?.access?.far_places.map((p, i) => (
              <CircleMarker key={`v${i}`} center={[p.lat, p.lon]} radius={3} pathOptions={{ color: "#7c5cd6", weight: 1, fillColor: "#a58df0", fillOpacity: 0.8 }}>
                <Tooltip>{p.name} ({p.kind}) · {p.km} km to nearest PHC/CHC</Tooltip>
              </CircleMarker>
            ))}
            {facs.map((f) => (
              <CircleMarker key={f.id} center={[f.lat!, f.lon!]} radius={KIND_R[f.kind]}
                pathOptions={{ color: f.demo ? "#16323a" : "#ffffff", weight: f.demo ? 2.5 : 1.2, fillColor: RISK[f.risk], fillOpacity: 0.92 }}
                eventHandlers={{ click: () => setSel(f.id) }}>
                <Tooltip><b>{f.name}</b><br />{KIND_NAME[f.kind]} · {f.critical} running out{f.villages_served ? ` · ~${f.villages_served} villages nearest` : ""}</Tooltip>
              </CircleMarker>
            ))}
          </MapContainer>
          {district && !dd && <div className="absolute inset-0 z-[400] grid place-items-center bg-white/40"><Loader2 className="animate-spin text-brand-600" size={36} /></div>}
          <AnimatePresence>{sel && <FacilityDrawer key={sel} id={sel} onClose={() => setSel(null)} />}</AnimatePresence>
          <div className="absolute left-3 bottom-3 z-[450] card !rounded-2xl px-3 py-2 text-[11px] font-bold text-muted space-y-1">
            {district ? (
              <>
                <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ background: RISK.high }} /> 3+ medicines running out</div>
                <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ background: RISK.medium }} /> 1–2 running out</div>
                <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ background: RISK.low }} /> stable</div>
                <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full border-2 border-ink" /> demo PHC with register data</div>
                {dd?.access && <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: "#a58df0" }} /> village &gt; 8 km from PHC/CHC</div>}
              </>
            ) : (
              <>
                <div>Share of facilities at high risk</div>
                <div className="flex items-center gap-1">{["#bfe9df", "#8fd8c6", "#f6d58e", "#f3b36b", "#ec8a7f"].map((c) => <span key={c} className="h-3 w-6 rounded" style={{ background: c }} />)}</div>
                <div className="flex justify-between"><span>low</span><span>high</span></div>
              </>
            )}
          </div>
        </div>

        <aside className="space-y-4">
          {!district && ov && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-3xl p-4 bg-brand-50 text-brand-800"><Counter to={ov.totals.facilities} className="text-3xl font-extrabold" /><div className="text-xs font-bold opacity-80">facilities mapped</div></div>
                <div className="rounded-3xl p-4 bg-rose-50 text-rose-600"><Counter to={ov.totals.high_risk} className="text-3xl font-extrabold" /><div className="text-xs font-bold opacity-80">at high risk</div></div>
                <div className="rounded-3xl p-4 bg-amber-50 text-amber-700 col-span-2"><Counter to={ov.totals.expiry_value} prefix="₹" className="text-3xl font-extrabold" /><div className="text-xs font-bold opacity-80">medicine value at risk of expiring unused (next 90 days)</div></div>
              </div>
              <div className="card p-4">
                <div className="relative mb-3"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a district" className="w-full rounded-xl border border-line pl-9 pr-3 py-2.5 font-semibold focus:outline-none focus:border-brand-400" /></div>
                <div className="max-h-[42vh] overflow-auto -mr-2 pr-2 space-y-1">
                  {list.map((d) => (
                    <button key={d.district} onClick={() => setSp({ district: d.district })} className="w-full text-left rounded-xl px-3 py-2 hover:bg-brand-50 flex items-center gap-3">
                      <span className="h-3 w-3 rounded-sm shrink-0" style={{ background: shade(d.high_pct) }} />
                      <span className="font-bold flex-1 truncate">{d.district}</span>
                      <span className="text-xs text-muted">{d.facilities}</span>
                      <span className="text-xs font-extrabold w-12 text-right">{d.high_pct}%</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
          {district && (
            <>
              <div className="card p-4">
                <div className="grid grid-cols-2 gap-2">
                  {(["DH", "CHC", "PHC", "HWC"] as const).map((k) => (
                    <div key={k} className="rounded-2xl bg-brand-50 px-3 py-2"><div className="text-xl font-extrabold text-brand-800">{cur?.kinds[k] ?? 0}</div><div className="text-[11px] font-bold text-muted">{KIND_NAME[k]}s</div></div>
                  ))}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="rounded-2xl bg-rose-50 px-3 py-2"><div className="text-xl font-extrabold text-rose-600">{cur?.high_risk ?? 0}</div><div className="text-[11px] font-bold text-muted">high-risk facilities</div></div>
                  <div className="rounded-2xl bg-amber-50 px-3 py-2"><div className="text-xl font-extrabold text-amber-700">₹{(cur?.expiry_value ?? 0).toLocaleString("en-IN")}</div><div className="text-[11px] font-bold text-muted">may expire unused</div></div>
                </div>
              </div>
              {dd?.access && (
                <div className="card p-4">
                  <div className="font-extrabold flex items-center gap-2"><HomeIcon size={17} className="text-brand-600" /> Villages and towns</div>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-2xl bg-brand-50 py-2"><div className="text-lg font-extrabold">{dd.access.villages.toLocaleString("en-IN")}</div><div className="text-[10px] font-bold text-muted">villages</div></div>
                    <div className="rounded-2xl bg-brand-50 py-2"><div className="text-lg font-extrabold">{dd.access.towns}</div><div className="text-[10px] font-bold text-muted">towns</div></div>
                    <div className="rounded-2xl bg-brand-50 py-2"><div className="text-lg font-extrabold">{dd.access.median_km} km</div><div className="text-[10px] font-bold text-muted">median to care</div></div>
                  </div>
                  <p className="text-sm text-muted mt-2"><b className="text-violet-700">{dd.access.over_8km.toLocaleString("en-IN")}</b> villages are more than 8 km (straight line) from the nearest PHC, CHC or district hospital. They are shown in purple on the map.</p>
                </div>
              )}
              <div className="card p-4">
                <div className="font-extrabold flex items-center gap-2 mb-2"><Layers size={17} className="text-brand-600" /> Layers</div>
                <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={layers.HWC} onChange={(e) => setLayers({ ...layers, HWC: e.target.checked })} /> Health & Wellness Centres</label>
                {dd?.access && <label className="flex items-center gap-2 text-sm font-semibold mt-1"><input type="checkbox" checked={layers.gaps} onChange={(e) => setLayers({ ...layers, gaps: e.target.checked })} /> Villages far from care</label>}
              </div>
              <div className="card p-4">
                <div className="font-extrabold mb-2">Most at risk</div>
                <div className="space-y-1 max-h-[26vh] overflow-auto -mr-2 pr-2">
                  {(dd?.facilities ?? []).slice(0, 12).map((f) => (
                    <button key={f.id} onClick={() => setSel(f.id)} className="w-full text-left rounded-xl px-2 py-1.5 hover:bg-brand-50 flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: RISK[f.risk] }} />
                      <span className="text-sm font-bold flex-1 truncate">{f.name}</span><span className="text-xs text-rose-600 font-extrabold">{f.critical}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
          <div className="rounded-2xl bg-sky-50 border border-sky-100 text-sky-800 p-3 text-xs font-semibold flex gap-2"><Info size={15} className="shrink-0 mt-0.5" />
            Facility locations and villages: © OpenStreetMap contributors. Stock figures are simulated for demo, except facilities that have scanned a register.</div>
        </aside>
      </div>
    </div>
  );
}
