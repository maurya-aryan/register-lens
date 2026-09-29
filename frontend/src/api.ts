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
  phc: { id: string; name: string; district: string; state: string } | null;
  items: Item[];
  summary: { medicines: number; critical: number; warning: number; phantom: number; expiring: number; units_overstated: number };
};
export type Phc = { id: string; name: string; block: string; district: string; state: string };
export type Alert = { en: string; hi: string; source: string };
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
  phcs: () => fetch("/api/phcs").then((r) => j<Phc[]>(r)),
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
  alert: (reconciliation: Recon) =>
    fetch("/api/alert", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reconciliation }) }).then((r) => j<Alert>(r)),
  exportXlsx: async (phc_id: string, rows: Row[]) => {
    const r = await fetch("/api/export", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phc_id, rows }) });
    if (!r.ok) throw new Error("Export failed");
    return r.blob();
  },
  dashboard: () => fetch("/api/dashboard").then((r) => j<Dash>(r)),
};
