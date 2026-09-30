export type Flag = { code: string; level: "info" | "warn" | "error"; msg: string };
export type Conf = { drug: number; batch: number; expiry: number; qty: number };
export type Row = {
  id: number;
  drug_name_raw: string;
  strength_raw?: string | null;
  batch?: string | null;
  expiry?: string | null;
  opening?: number | null;
  received?: number | null;
  issued?: number | null;
  closing?: number | null;
  confidence: Conf;
  note?: string | null;
  med_code: string | null;
  med_name: string | null;
  unit: string | null;
  match_score: number;
  matched_by: string | null;
  flags: Flag[];
};
export type Scan = {
  phc_id: string;
  phc_switched: boolean;
  scan_id: string;
  original_url: string;
  clean_url: string;
  steps: string[];
  page_date: string | null;
  facility_written: string | null;
  rows: Row[];
  meta: { model: string; escalated: boolean; cached: boolean; seconds?: number; total_seconds: number; low_conf_share: number };
  low_conf_threshold: number;
};
export type Item = {
  med_code: string; med_name: string; unit: string; batch?: string; expiry?: string;
  register_closing: number; dvdms_qty: number; drift: number; drift_pct: number;
  daily_use: number; daily_use_source: string; days_real: number; days_dvdms: number;
  status: "critical" | "warning" | "ok"; expiring_soon: boolean; phantom_stock: boolean;
};
export type Recon = {
  phc: { id: string; name: string; district: string; state: string; kind?: string } | null;
  items: Item[];
  summary: { medicines: number; critical: number; warning: number; phantom: number; expiring: number; units_overstated: number };
};
export type Phc = { id: string; name: string; block: string; district: string; state: string; kind: string; lat: number | null; lon: number | null; demo: boolean; village: string };
export type Alert = { texts: Record<string, string>; source: string; missing?: string[] };
export type FacSum = {
  id: string; name: string; kind: "DH" | "CHC" | "PHC" | "HWC"; district: string; lat: number | null; lon: number | null; demo: boolean;
  village: string; block: string; critical: number; warning: number; phantom: number; worst: [string, number] | null;
  risk: "high" | "medium" | "low"; expiry_units: number; expiry_value: number; scanned: boolean; villages_served?: number | null;
};
export type DistrictRow = { district: string; facilities: number; high_risk: number; high_pct: number; critical_lines: number; phantom_lines: number; expiry_value: number; kinds: Record<string, number> };
export type Overview = { totals: { districts: number; facilities: number; high_risk: number; critical_lines: number; expiry_value: number }; districts: DistrictRow[] };
export type Access = { villages: number; towns: number; median_km: number; over_5km: number; over_8km: number; over_12km: number; far_places: { name: string; kind: string; lat: number; lon: number; km: number }[] };
export type DistrictData = { district: string; facilities: FacSum[]; access: Access | null; note: string };
export type FacLine = { med_code: string; med_name: string; unit: string; register: number; dvdms: number; daily: number; days_real: number; days_dvdms: number; source: string; status: string; next_expiry: string | null };
export type FacDetail = FacSum & { lines: FacLine[] };
export type End = { id: string; name: string; kind: string; lat: number; lon: number };
export type Transfer = { id: string; med_code: string; med_name: string; unit: string; qty: number; batch: string; expiry: string; days_to_expiry: number; from: End; to: End; km: number; value: number; stockout_days_avoided: number; decision: string | null };
export type Redist = { district: string; transfers: Transfer[]; totals: { transfers: number; units: number; value: number; approved: number }; rules: Record<string, number> };
export type Lang = { code: string; name: string; native: string };
export type ChatMsg = { role: "user" | "assistant"; text: string; tools?: string[] };
export type Dash = { note: string; phcs: { id: string; name: string; block: string; district: string; critical: number; phantom: number; worst: [string, number] | null; risk: "high" | "medium" | "low" }[] };

async function j<T>(r: Response): Promise<T> {
  if (!r.ok) {
    let msg = r.statusText;
    try { const d = await r.json(); msg = d.detail || msg; } catch { /* ignore */ }
    throw new Error(msg);
  }
  return r.json();
}

export const api = {
  phcs: (district?: string, q?: string) => fetch(`/api/phcs?${new URLSearchParams({ ...(district ? { district } : {}), ...(q ? { q } : {}) })}`).then((r) => j<Phc[]>(r)),
  districts: () => fetch("/api/districts").then((r) => j<string[]>(r)),
  overview: () => fetch("/api/up/overview").then((r) => j<Overview>(r)),
  geojson: () => fetch("/api/up/districts.geojson").then((r) => j<GeoJSON.FeatureCollection>(r)),
  district: (name: string) => fetch(`/api/up/district/${encodeURIComponent(name)}`).then((r) => j<DistrictData>(r)),
  facility: (id: string) => fetch(`/api/facility/${id}`).then((r) => j<FacDetail>(r)),
  redistribution: (district: string) => fetch(`/api/redistribution?district=${encodeURIComponent(district)}`).then((r) => j<Redist>(r)),
  decide: (transfer_id: string, decision: string) =>
    fetch("/api/redistribution/decision", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ transfer_id, decision }) }).then((r) => j<{ ok: boolean }>(r)),
  languages: () => fetch("/api/languages").then((r) => j<{ languages: Lang[]; state_defaults: Record<string, string[]> }>(r)),
  chat: (messages: ChatMsg[], context?: unknown) =>
    fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages, context }) }).then((r) => j<{ text: string; model: string | null; tools_used: string[]; error?: string }>(r)),
  samples: () => fetch("/api/samples").then((r) => j<{ name: string; url: string; thumb: string }[]>(r)),
  scanFile: (file: File, phc_id: string) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("phc_id", phc_id);
    return fetch("/api/scan", { method: "POST", body: fd }).then((r) => j<Scan>(r));
  },
  scanSample: (name: string, phc_id: string) => {
    const fd = new FormData();
    fd.append("name", name);
    fd.append("phc_id", phc_id);
    return fetch("/api/scan-sample", { method: "POST", body: fd }).then((r) => j<Scan>(r));
  },
  reconcile: (phc_id: string, rows: Row[]) =>
    fetch("/api/reconcile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phc_id, rows }) }).then((r) => j<Recon>(r)),
  alert: (reconciliation: Recon, languages?: string[]) =>
    fetch("/api/alert", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reconciliation, languages }) }).then((r) => j<Alert>(r)),
  exportXlsx: async (phc_id: string, rows: Row[]) => {
    const r = await fetch("/api/export", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phc_id, rows }) });
    if (!r.ok) throw new Error("Export failed");
    return r.blob();
  },
};
