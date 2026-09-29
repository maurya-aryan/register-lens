"""End-to-end API check: scan -> reconcile -> export -> alert."""
import json
import sys
import urllib.parse
import urllib.request

BASE = "http://localhost:8000"


def post_json(path, body):
    req = urllib.request.Request(BASE + path, data=json.dumps(body).encode(), headers={"Content-Type": "application/json"})
    return urllib.request.urlopen(req, timeout=180)


def post_form(path, fields):
    req = urllib.request.Request(BASE + path, data=urllib.parse.urlencode(fields).encode())
    return json.load(urllib.request.urlopen(req, timeout=300))


sample = sys.argv[1] if len(sys.argv) > 1 else "reg_02_easy.jpg"
phc = sys.argv[2] if len(sys.argv) > 2 else "P09"
scan = post_form("/api/scan-sample", {"name": sample, "phc_id": phc})
rows = scan["rows"]
print("scan rows", len(rows), "| unmatched", sum(1 for r in rows if not r["med_code"]),
      "| flagged", sum(1 for r in rows if r["flags"]), "| meta", scan["meta"])
for r in rows:
    if r["flags"]:
        print("  flag:", r["drug_name_raw"], [f["code"] for f in r["flags"]])
rec = json.load(post_json("/api/reconcile", {"phc_id": phc, "rows": rows}))
print("summary", rec["summary"])
for i in rec["items"][:5]:
    print("  ", i["med_name"], "reg", i["register_closing"], "dvdms", i["dvdms_qty"], "days real", i["days_real"], "dvdms", i["days_dvdms"], i["status"])
x = post_json("/api/export", {"phc_id": phc, "rows": rows}).read()
print("export bytes", len(x), x[:2])
al = json.load(post_json("/api/alert", {"reconciliation": rec}))
print("alert source", al["source"])
print(al["en"])
print(al["hi"])
