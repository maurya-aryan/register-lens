from pathlib import Path

p = Path(__file__).resolve().parents[1] / "frontend" / "src" / "pages" / "Home.tsx"
s = p.read_text(encoding="utf-8")
s = s.replace("  ImagePlus, HeartPulse, Pill, Truck, Calculator, BookOpen, Smartphone, MapPin,\n} from \"lucide-react\";",
              "  ImagePlus, HeartPulse, Pill, Truck, Calculator, BookOpen, Smartphone, MapPin, Bot, Map as MapIcon, Mic, Check, Minus,\n} from \"lucide-react\";")
s = s.replace('''          <div className="eyebrow mb-3">Roadmap</div>
          <h2 className="section-title">Where we go next</h2>''', '''          <div className="eyebrow mb-3">Three phases, all live</div>
          <h2 className="section-title">From one register to the whole district</h2>''')
s = s.replace('<span className="chip bg-sky-100 text-sky-700">Phase 2 · Coming soon</span>', '<span className="chip bg-brand-600 text-white">Phase 2 · Live now</span>')
s = s.replace('''<p className="text-muted mt-2 leading-relaxed">Alerts and screens in the PHC's own state language.</p>''',
              '''<p className="text-muted mt-2 leading-relaxed">District alerts in 16 Indian languages, picked by state. For Uttar Pradesh: Hindi, Urdu and English.</p>''')
s = s.replace('{["தமிழ்", "తెలుగు", "বাংলা", "मराठी", "ଓଡ଼ିଆ", "ಕನ್ನಡ", "ગુજરાતી", "മലയാളം", "ਪੰਜਾਬੀ"]',
              '{["हिन्दी", "اردو", "भोजपुरी", "अवधी", "தமிழ்", "తెలుగు", "বাংলা", "मराठी", "ଓଡ଼ିଆ", "ಕನ್ನಡ", "ગુજરાતી", "മലയാളം", "ਪੰਜਾਬੀ"]')
s = s.replace('<span className="chip bg-amber-100 text-amber-700">Phase 3 · Planned</span>', '<span className="chip bg-brand-600 text-white">Phase 3 · Live now</span>')
s = s.replace('''<p className="text-muted mt-2 leading-relaxed">Medicines about to expire go to the nearby clinic or store that urgently needs them. The district officer approves every move.</p>''',
              '''<p className="text-muted mt-2 leading-relaxed">Batches that would expire unused are matched to the nearest facility running short. The district officer approves every move and downloads transfer orders.</p>
              <Link to="/redistribute" className="mt-3 inline-flex items-center gap-1 font-extrabold text-brand-700">Open transfers <ArrowRight size={16} /></Link>''')
s = s.replace('''<p className="text-muted mt-2 leading-relaxed">Photo to a checked table, DVDMS drift and days of stock, a bulk-entry file and a Hindi + English district alert.</p>''',
              '''<p className="text-muted mt-2 leading-relaxed">Photo to a checked table, DVDMS drift and days of stock, and a DVDMS bulk-entry file.</p>
              <Link to="/scan" className="mt-3 inline-flex items-center gap-1 font-extrabold text-brand-700">Scan a register <ArrowRight size={16} /></Link>''')

NEW = '''      {/* UP SCALE */}
      <section className="mx-auto max-w-7xl px-5 pt-28">
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-700 to-brand-800 text-white p-8 md:p-12">
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10" />
          <div className="grid lg:grid-cols-[1.1fr_1fr] gap-8 items-center relative">
            <Reveal>
              <div className="text-xs font-extrabold tracking-[.2em] text-brand-200">ALL OF UTTAR PRADESH</div>
              <h2 className="mt-3 text-3xl md:text-4xl font-extrabold leading-tight">Every public health facility, on one map</h2>
              <p className="mt-3 text-brand-100 text-lg leading-relaxed">District hospitals, CHCs, PHCs and Health &amp; Wellness Centres at their real locations, with villages that are far from care, so the district office sees where medicines run out first.</p>
              <Link to="/map" className="btn bg-white text-brand-800 mt-6 !px-6 !py-3.5"><MapIcon size={20} /> Open the UP map</Link>
            </Reveal>
            <div className="grid grid-cols-2 gap-3">
              {[{ n: 3948, l: "health facilities mapped" }, { n: 75, l: "districts covered" }, { n: 16, l: "alert languages" }, { n: 5, l: "data tools the AI assistant uses" }].map((x) => (
                <div key={x.l} className="rounded-3xl bg-white/10 border border-white/15 p-5">
                  <Counter to={x.n} className="text-4xl font-extrabold" />
                  <div className="text-sm text-brand-100 font-semibold mt-1">{x.l}</div>
                </div>
              ))}
            </div>
          </div>
          <p className="relative mt-6 text-xs text-brand-200">Locations: © OpenStreetMap contributors. Stock figures are simulated for the demo, except facilities that scan a register.</p>
        </div>
      </section>

      {/* ASSISTANT + MOBILE */}
      <section className="mx-auto max-w-7xl px-5 pt-20 grid lg:grid-cols-2 gap-6">
        <Reveal>
          <div className="card p-7 h-full">
            <div className="h-12 w-12 rounded-2xl bg-brand-100 text-brand-700 grid place-items-center"><Bot /></div>
            <div className="font-extrabold text-2xl mt-4">Ask in Hindi or English</div>
            <p className="text-muted mt-2 leading-relaxed">The Gemini assistant answers from the app's own data. It looks up districts, facilities, nearby stock and transfer plans before it replies, so it never guesses a number. Speak or type.</p>
            <div className="mt-4 space-y-2">
              <div className="rounded-2xl bg-brand-600 text-white px-4 py-2.5 text-sm font-semibold w-fit ml-auto hi">Barabanki mein kaun se PHC mein dawai khatam ho rahi hai?</div>
              <div className="rounded-2xl bg-brand-50 border border-line px-4 py-2.5 text-sm w-fit max-w-[90%] hi">PHC Banki: Iron &amp; Folic Acid, 0.9 din ka stock. PHC Suratganj: Amoxicillin, 1.1 din…</div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2"><span className="chip bg-brand-50 text-brand-800"><Mic size={12} /> voice input</span><span className="chip bg-brand-50 text-brand-800">function calling</span><span className="chip bg-brand-50 text-brand-800">replies in your language</span></div>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="card p-7 h-full">
            <div className="h-12 w-12 rounded-2xl bg-amber-100 text-amber-700 grid place-items-center"><Smartphone /></div>
            <div className="font-extrabold text-2xl mt-4">Works on the pharmacist's phone</div>
            <p className="text-muted mt-2 leading-relaxed">No app store needed. Open the link in Chrome and tap “Install app”. Register Lens gets its own icon, opens full screen, and Scan opens the phone camera directly.</p>
            <ol className="mt-4 space-y-2 text-sm font-semibold">
              {["Open the link on your phone", "Menu ⋮ → Install app / Add to Home screen", "Tap Scan → photograph today's page"].map((t, i) => (
                <li key={t} className="flex items-center gap-3"><span className="h-7 w-7 rounded-full bg-brand-600 text-white grid place-items-center text-xs font-extrabold shrink-0">{i + 1}</span>{t}</li>
              ))}
            </ol>
          </div>
        </Reveal>
      </section>

      {/* COMPARISON */}
      <section className="mx-auto max-w-7xl px-5 pt-20">
        <Reveal className="text-center max-w-2xl mx-auto">
          <div className="eyebrow mb-3">How it compares</div>
          <h2 className="section-title">Others build dashboards. We fix the data underneath.</h2>
          <p className="mt-3 text-muted text-lg">Typical approaches versus Register Lens.</p>
        </Reveal>
        <Reveal>
          <div className="mt-8 card overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead><tr className="text-left">
                <th className="p-4 font-extrabold">Capability</th>
                <th className="p-4 font-extrabold text-muted">Stock dashboards / forecasters</th>
                <th className="p-4 font-extrabold text-muted">Complaint and chatbot apps</th>
                <th className="p-4 font-extrabold text-brand-700 bg-brand-50">Register Lens</th>
              </tr></thead>
              <tbody>
                {([
                  ["Gets real consumption without extra typing", false, false, true],
                  ["Reads handwritten Hindi + English registers", false, false, true],
                  ["Shows where DVDMS is wrong (drift, phantom stock)", false, false, true],
                  ["Catches misreads by cross-checking DVDMS batches", false, false, true],
                  ["Moves near-expiry stock to facilities running short", "some", false, true],
                  ["Every public facility in the state on one map", "some", false, true],
                  ["Assistant answers from live data, in Indian languages", false, "some", true],
                  ["Human approves every change", "some", "some", true],
                ] as [string, boolean | string, boolean | string, boolean | string][]).map(([f, a, b, c]) => (
                  <tr key={f} className="border-t border-line">
                    <td className="p-4 font-semibold">{f}</td>
                    {[a, b, c].map((v, i) => (
                      <td key={i} className={`p-4 ${i === 2 ? "bg-brand-50/60" : ""}`}>
                        {v === true ? <Check className="text-brand-600" size={20} /> : v === "some" ? <span className="text-xs font-bold text-muted">partly</span> : <Minus className="text-slate-300" size={20} />}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>
      </section>

      {/* FINAL CTA */}'''
assert "{/* FINAL CTA */}" in s
s = s.replace("      {/* FINAL CTA */}", NEW, 1)
p.write_text(s, encoding="utf-8")
print("patched", s.count("Live now"))
