import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { AlertTriangle, Camera, Loader2, MapPin, Info } from "lucide-react";
import { api, Dash } from "../api";
import { Counter } from "../components/Reveal";

const risk = {
  high: { chip: "bg-rose-100 text-rose-600", bar: "from-rose-500 to-rose-300", label: "High risk" },
  medium: { chip: "bg-amber-100 text-amber-700", bar: "from-amber-500 to-amber-300", label: "Watch" },
  low: { chip: "bg-green-100 text-green-700", bar: "from-green-600 to-green-400", label: "Stable" },
} as const;

export default function Dashboard() {
  const [d, setD] = useState<Dash | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => { api.dashboard().then(setD).catch((e) => setErr(e.message)); }, []);
  const tot = d?.phcs.reduce((a, p) => ({ crit: a.crit + p.critical, ph: a.ph + p.phantom, high: a.high + (p.risk === "high" ? 1 : 0) }), { crit: 0, ph: 0, high: 0 });
  return (
    <div className="mx-auto max-w-7xl px-5 pt-8 pb-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="eyebrow mb-2">District view</div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Barabanki district, at a glance</h1>
          <p className="text-muted mt-2 text-lg max-w-2xl">Which health centres are closest to running out, and where DVDMS is most out of step with reality.</p>
        </div>
        <img src="/img/art/medical-representative_k331.svg" alt="" aria-hidden className="hidden lg:block h-40 -mb-2" />
        <Link to="/scan" className="btn btn-primary"><Camera size={20} /> Scan a register</Link>
      </div>
      <div className="mt-5 rounded-2xl bg-sky-50 border border-sky-100 text-sky-800 p-3.5 text-sm font-semibold flex gap-2"><Info size={18} className="shrink-0 mt-0.5" /> {d?.note ?? "Illustrative data for the demo."}</div>

      {err && <div className="mt-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 p-4 font-bold flex gap-2"><AlertTriangle /> {err}</div>}
      {!d && !err && <div className="py-24 grid place-items-center text-brand-600"><Loader2 className="animate-spin" size={36} /></div>}

      {d && tot && (
        <>
          <div className="mt-6 grid sm:grid-cols-3 gap-4">
            {[
              { l: "Health centres at high risk", v: tot.high, c: "bg-rose-50 text-rose-600" },
              { l: "Medicines running out (≤ 7 days)", v: tot.crit, c: "bg-amber-50 text-amber-700" },
              { l: "Lines where DVDMS is overstated", v: tot.ph, c: "bg-sky-50 text-sky-700" },
            ].map((x) => (
              <div key={x.l} className={`rounded-3xl p-5 ${x.c}`}>
                <Counter to={x.v} className="text-4xl font-extrabold" />
                <div className="text-sm font-bold opacity-80">{x.l}</div>
              </div>
            ))}
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {d.phcs.map((p, i) => {
              const r = risk[p.risk];
              return (
                <motion.div key={p.id} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.045 }} className="card p-5 hover:-translate-y-1 hover:shadow-pop transition-all">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-extrabold text-lg leading-tight">{p.name}</div>
                      <div className="text-sm text-muted flex items-center gap-1 mt-0.5"><MapPin size={13} /> {p.block} block</div>
                    </div>
                    <span className={`chip ${r.chip}`}>{r.label}</span>
                  </div>
                  <div className="mt-4 h-3 rounded-full bg-brand-50 overflow-hidden">
                    <motion.div className={`h-full rounded-full bg-gradient-to-r ${r.bar}`} initial={{ width: 0 }} animate={{ width: `${Math.min(100, (p.critical / 12) * 100)}%` }} transition={{ duration: 1, delay: 0.2 + i * 0.04 }} />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-center">
                    <div className="rounded-2xl bg-rose-50 py-2"><div className="text-2xl font-extrabold text-rose-600">{p.critical}</div><div className="text-[11px] font-bold text-muted">running out</div></div>
                    <div className="rounded-2xl bg-sky-50 py-2"><div className="text-2xl font-extrabold text-sky-700">{p.phantom}</div><div className="text-[11px] font-bold text-muted">DVDMS overstated</div></div>
                  </div>
                  {p.worst && <div className="mt-3 text-sm text-muted">Most urgent: <b className="text-ink">{p.worst[0]}</b> · about {p.worst[1]} days left</div>}
                </motion.div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
