import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Camera, ScanText, CheckCheck, FileSpreadsheet, ArrowRight, Sparkles, ShieldCheck, Languages, Bell,
  ImagePlus, HeartPulse, Pill, Truck, Calculator, BookOpen, Smartphone, MapPin, Bot, Map as MapIcon, Mic, Check, Minus,
} from "lucide-react";
import HeroArt from "../components/HeroArt";
import { Counter, Reveal } from "../components/Reveal";

gsap.registerPlugin(ScrollTrigger);

const MEDS = ["Paracetamol", "ORS", "Metformin", "Amlodipine", "Iron + Folic Acid", "Amoxicillin", "Zinc", "Cetirizine", "Albendazole", "Azithromycin", "Losartan", "Pantoprazole"];

const steps = [
  { icon: Camera, t: "Snap", d: "Take one photo of the day's register page. No typing, no new forms.", c: "bg-sky-100 text-sky-700" },
  { icon: ScanText, t: "Read", d: "Gemini reads the handwriting, Hindi and English, and says how sure it is about every cell.", c: "bg-brand-100 text-brand-700" },
  { icon: CheckCheck, t: "Confirm", d: "The pharmacist taps only the uncertain cells. Nothing moves without a human yes.", c: "bg-amber-100 text-amber-700" },
  { icon: FileSpreadsheet, t: "Sync", d: "A DVDMS-ready bulk entry and a Hindi + English alert for the district officer.", c: "bg-rose-100 text-rose-600" },
];

function Bar({ label, value, max, color, delay }: { label: string; value: number; max: number; color: string; delay: number }) {
  return (
    <div>
      <div className="flex justify-between text-sm font-bold mb-1.5"><span>{label}</span><span>{value}</span></div>
      <div className="h-5 rounded-full bg-brand-50 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          whileInView={{ width: `${(value / max) * 100}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1.3, delay, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}

export default function Home() {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(".how-line", { scaleX: 0 }, { scaleX: 1, ease: "none", transformOrigin: "left center", scrollTrigger: { trigger: "#how", start: "top 65%", end: "bottom 75%", scrub: 0.6 } });
      gsap.utils.toArray<HTMLElement>(".step-card").forEach((el, i) => {
        gsap.from(el, { y: 60, opacity: 0, duration: 0.8, delay: i * 0.05, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 88%" } });
      });
      gsap.utils.toArray<HTMLElement>(".parallax").forEach((el) => {
        const s = Number(el.dataset.speed || 0.2);
        gsap.to(el, { yPercent: -30 * s * 5, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } });
      });
      gsap.utils.toArray<HTMLElement>(".pop").forEach((el) => {
        gsap.from(el, { scale: 0.85, opacity: 0, duration: 0.7, ease: "back.out(1.6)", scrollTrigger: { trigger: el, start: "top 88%" } });
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={root} className="overflow-x-clip">
      {/* HERO */}
      <section className="relative mx-auto max-w-7xl px-5 pt-8 pb-10 lg:pt-14 grid lg:grid-cols-[1.12fr_1fr] gap-8 items-center">
        <div className="parallax absolute -left-24 top-10 h-72 w-72 rounded-full bg-brand-100/70 blur-3xl -z-10" data-speed="0.3" />
        <div className="parallax absolute right-0 bottom-0 h-64 w-64 rounded-full bg-sky-100/80 blur-3xl -z-10" data-speed="0.15" />
        <div>
          <motion.span initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="chip bg-brand-100 text-brand-800 mb-5">
            <HeartPulse size={14} /> Smart Health &amp; Supply Chain Resilience
          </motion.span>
          <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.7 }} className="text-[clamp(2.2rem,4vw,3.55rem)] font-extrabold leading-[1.05] tracking-tight">
            Your register<br /> already knows.<br />
            <span className="bg-gradient-to-r from-brand-600 to-sky-500 bg-clip-text text-transparent">Now DVDMS will too.</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.7 }} className="mt-5 text-lg text-muted max-w-xl leading-relaxed">
            Take one photo of the handwritten stock register. Gemini reads it, the pharmacist confirms it, and the system finally matches what is really on the shelf.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32, duration: 0.7 }} className="mt-8 flex flex-wrap gap-3">
            <Link to="/scan" className="btn btn-primary text-lg !px-7 !py-4"><Camera size={22} /> Scan a Register</Link>
            <Link to="/scan?sample=1" className="btn btn-ghost text-lg !px-7 !py-4"><ImagePlus size={22} /> Try a sample page</Link>
          </motion.div>
          <motion.ul initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm font-bold text-muted">
            <li className="flex items-center gap-2"><Languages size={17} className="text-brand-600" /> Hindi + English handwriting</li>
            <li className="flex items-center gap-2"><ShieldCheck size={17} className="text-brand-600" /> Pharmacist approves every line</li>
            <li className="flex items-center gap-2"><Sparkles size={17} className="text-brand-600" /> No extra typing</li>
          </motion.ul>
        </div>
        <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }} className="relative">
          <HeroArt />
        </motion.div>
      </section>

      {/* MARQUEE */}
      <div className="border-y border-line bg-white/70 overflow-hidden">
        <div className="marquee flex w-max gap-4 py-4">
          {[...MEDS, ...MEDS].map((m, i) => (
            <span key={i} className="chip !text-sm !py-2 !px-4 bg-brand-50 text-brand-800 border border-brand-100"><Pill size={15} /> {m}</span>
          ))}
        </div>
      </div>

      {/* PROBLEM */}
      <section id="problem" className="mx-auto max-w-7xl px-5 pt-24 grid lg:grid-cols-2 gap-10 items-center">
        <Reveal>
          <div className="eyebrow mb-3">The problem</div>
          <h2 className="section-title">The notebook is right. The screen is out of date.</h2>
          <p className="mt-4 text-muted text-lg leading-relaxed">
            A PHC pharmacist sees a hundred patients a day and keeps a paper register as the rules ask. There is simply no time to type it all into DVDMS as well. So the district sees stock that is not really there.
          </p>
          <div className="card mt-6 p-5 flex gap-4 items-start bg-amber-50/60 border-amber-100 relative">

            <div className="h-12 w-12 shrink-0 rounded-2xl bg-amber-100 grid place-items-center text-amber-700"><BookOpen /></div>
            <div>
              <div className="font-extrabold">Think of a kirana shop and its khata book</div>
              <p className="text-muted mt-1 leading-relaxed">The shopkeeper writes every sale in the book, but the wholesaler only restocks from the app, and the app was never updated. Register Lens is the helper who photographs the book every evening and updates the app. The shopkeeper does no extra work.</p>
            </div>
            <img src="/img/art/taking-notes_oyqz.svg" alt="" aria-hidden className="hidden xl:block w-36 shrink-0 self-center -my-3" />
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="card p-7">
            <div className="flex items-center justify-between mb-5">
              <div className="font-extrabold text-lg">Oral Rehydration Salts (sachets)</div>
              <span className="chip bg-rose-100 text-rose-600">Illustrative</span>
            </div>
            <div className="space-y-5">
              <Bar label="What DVDMS shows" value={400} max={400} color="linear-gradient(90deg,#f0a23b,#f6c56f)" delay={0.1} />
              <Bar label="What the register says" value={118} max={400} color="linear-gradient(90deg,#167f71,#3fb8a3)" delay={0.4} />
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-amber-50 p-4"><div className="text-xs font-bold text-amber-700">DVDMS thinks</div><div className="text-2xl font-extrabold">40 days</div></div>
              <div className="rounded-2xl bg-rose-50 p-4"><div className="text-xs font-bold text-rose-600">Reality</div><div className="text-2xl font-extrabold">6 days</div></div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* STATS */}
      <section className="mx-auto max-w-7xl px-5 pt-14 grid md:grid-cols-3 gap-5">
        {[
          { n: 14.52, p: "₹", s: " crore", d: "of expired drugs reported lying in Haryana's warehouses and hospitals", dec: 2 },
          { n: 23.03, p: "₹", s: " crore", d: "of expired drugs reported in Karnataka (2019–22), stored with regular stock", dec: 2 },
          { n: 16, p: "", s: "", d: "health institutions compared by auditors, where DVDMS stock showed variations from the stock registers", dec: 0 },
        ].map((x, i) => (
          <Reveal key={i} delay={i * 0.08}>
            <div className="card p-6 h-full">
              <Counter to={x.n} prefix={x.p} suffix={x.s} decimals={x.dec} className="text-4xl font-extrabold text-brand-700" />
              <p className="text-muted mt-2 leading-relaxed">{x.d}</p>
            </div>
          </Reveal>
        ))}
        <p className="md:col-span-3 text-xs text-muted">
          Sources: CAG audit findings as reported in{" "}
          <a className="underline" href="https://www.tribuneindia.com/news/haryana/haryana-bought-drugs-from-blacklisted-firm-cag/amp" target="_blank" rel="noreferrer">The Tribune (Haryana)</a>,{" "}
          <a className="underline" href="https://www.deccanherald.com/amp/story/india%2Fkarnataka%2Fcag-report-highlights-glaring-shortages-in-essential-drug-stocks-in-karnataka-3321784" target="_blank" rel="noreferrer">Deccan Herald (Karnataka)</a> and the{" "}
          <a className="underline" href="https://cag.gov.in/uploads/icisa_it_reports/e-Aushadhi-063622732a5c9d1-91268077.pdf" target="_blank" rel="noreferrer">CAG e-Aushadhi IT audit</a>. Bars above are illustrative.
        </p>
      </section>

      {/* HOW */}
      <section id="how" className="mx-auto max-w-7xl px-5 pt-28 scroll-mt-20">
        <Reveal className="text-center max-w-2xl mx-auto">
          <div className="eyebrow mb-3">How it works</div>
          <h2 className="section-title">Four steps. One photo. Zero extra typing.</h2>
        </Reveal>
        <div className="relative mt-14">
          <div className="hidden lg:block absolute left-[12%] right-[12%] top-[46px] h-1 rounded bg-brand-100" />
          <div className="how-line hidden lg:block absolute left-[12%] right-[12%] top-[46px] h-1 rounded bg-gradient-to-r from-brand-500 to-sky-400" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <div key={s.t} className="step-card card p-6 text-center relative bg-white">
                <div className={`mx-auto h-[74px] w-[74px] rounded-3xl grid place-items-center ${s.c} shadow-card`}>
                  <s.icon size={34} />
                </div>
                <div className="mt-4 text-xs font-extrabold tracking-widest text-muted">STEP {i + 1}</div>
                <div className="text-xl font-extrabold mt-1">{s.t}</div>
                <p className="text-muted mt-2 leading-relaxed text-[0.95rem]">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
        <Reveal className="mt-10 text-center">
          <Link to="/scan" className="btn btn-primary text-lg !px-8 !py-4">Start scanning <ArrowRight size={20} /></Link>
        </Reveal>
      </section>

      {/* DEMO CLEANUP */}
      <section className="mx-auto max-w-7xl px-5 pt-28 grid lg:grid-cols-[1fr_1.1fr] gap-10 items-center">
        <Reveal>
          <div className="eyebrow mb-3">Before Gemini sees it</div>
          <h2 className="section-title">Photos are messy. We clean them first.</h2>
          <p className="mt-4 text-muted text-lg leading-relaxed">
            A phone photo has shadows, a tilted page and a wooden desk in the corner. Our image clean-up flattens the page, removes shadows and boosts faint ink, so Gemini reads it more reliably. Here is the same page, before and after.
          </p>
          <ul className="mt-5 space-y-2 font-bold text-ink">
            {["Finds and flattens the page", "Straightens tilted rows", "Removes shadows and glare", "Sharpens faint pen ink"].map((t) => (
              <li key={t} className="flex items-center gap-2"><CheckCheck size={18} className="text-brand-600" />{t}</li>
            ))}
          </ul>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center">
            <figure className="card p-2.5">
              <div className="rounded-xl overflow-hidden bg-brand-50 aspect-[4/5]"><img src="/img/demo_before.jpg" alt="Original phone photo of a register page" className="h-full w-full object-cover object-top" /></div>
              <figcaption className="text-center text-sm font-extrabold mt-2 text-muted">Your phone photo</figcaption>
            </figure>
            <div className="h-11 w-11 rounded-full bg-brand-600 text-white grid place-items-center shadow-card"><ArrowRight size={20} /></div>
            <figure className="card p-2.5 ring-2 ring-brand-200">
              <div className="rounded-xl overflow-hidden bg-brand-50 aspect-[4/5]"><img src="/img/demo_after.jpg" alt="Cleaned page as seen by Gemini" className="h-full w-full object-cover object-top" /></div>
              <figcaption className="text-center text-sm font-extrabold mt-2 text-brand-700">What Gemini sees</figcaption>
            </figure>
          </div>
        </Reveal>
      </section>

      {/* WHERE AI */}
      <section className="mx-auto max-w-7xl px-5 pt-28">
        <Reveal className="grid md:grid-cols-[1.3fr_1fr] gap-6 items-center">
          <div>
            <div className="eyebrow mb-3">Where Gemini works</div>
            <h2 className="section-title">AI reads and writes. Plain code does the maths.</h2>
            <p className="mt-3 text-muted text-lg">Every number you see after the reading is worked out by ordinary, checkable code, never guessed by the AI.</p>
          </div>
          <img src="/img/art/ai-data-extraction_soxc.svg" alt="" aria-hidden className="w-full max-h-56 object-contain" />
        </Reveal>
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {[
            { i: ScanText, t: "Reads handwriting", d: "Turns the photo into a clean table, with a confidence score for every cell.", c: "text-brand-700 bg-brand-100" },
            { i: Pill, t: "Understands names", d: "Knows PCM, Paracetamol and पैरासिटामोल are the same medicine.", c: "text-sky-700 bg-sky-100" },
            { i: Bell, t: "Writes the alert", d: "Drafts a short district alert in Hindi and English from the real numbers.", c: "text-amber-700 bg-amber-100" },
            { i: Calculator, t: "Code checks it", d: "Balances, days of stock and DVDMS drift are calculated, not generated.", c: "text-rose-600 bg-rose-100" },
          ].map((x, i) => (
            <div key={x.t} className="pop card p-6" style={{ transitionDelay: `${i * 60}ms` }}>
              <div className={`h-12 w-12 rounded-2xl grid place-items-center ${x.c}`}><x.i size={24} /></div>
              <div className="font-extrabold text-lg mt-4">{x.t}</div>
              <p className="text-muted mt-1.5 leading-relaxed">{x.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ROADMAP */}
      <section id="roadmap" className="mx-auto max-w-7xl px-5 pt-28 scroll-mt-20">
        <Reveal className="text-center max-w-2xl mx-auto">
          <div className="eyebrow mb-3">Three phases, all live</div>
          <h2 className="section-title">From one register to the whole district</h2>
        </Reveal>
        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          <Reveal>
            <div className="card p-7 h-full border-brand-300 ring-2 ring-brand-100">
              <span className="chip bg-brand-600 text-white">Phase 1 · Live now</span>
              <div className="mt-4 h-12 w-12 rounded-2xl bg-brand-100 grid place-items-center text-brand-700"><Smartphone /></div>
              <div className="font-extrabold text-xl mt-3">Scan, read, reconcile</div>
              <p className="text-muted mt-2 leading-relaxed">Photo to a checked table, DVDMS drift and days of stock, and a DVDMS bulk-entry file.</p>
              <Link to="/scan" className="mt-3 inline-flex items-center gap-1 font-extrabold text-brand-700">Scan a register <ArrowRight size={16} /></Link>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="card p-7 h-full">
              <span className="chip bg-brand-600 text-white">Phase 2 · Live now</span>
              <div className="mt-4 h-12 w-12 rounded-2xl bg-sky-100 grid place-items-center text-sky-700"><Languages /></div>
              <div className="font-extrabold text-xl mt-3">Regional languages</div>
              <p className="text-muted mt-2 leading-relaxed">District alerts in 16 Indian languages, picked by state. For Uttar Pradesh: Hindi, Urdu and English.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {["हिन्दी", "اردو", "भोजपुरी", "अवधी", "தமிழ்", "తెలుగు", "বাংলা", "मराठी", "ଓଡ଼ିଆ", "ಕನ್ನಡ", "ગુજરાતી", "മലയാളം", "ਪੰਜਾਬੀ"].map((l) => (
                  <span key={l} className="chip bg-sky-50 text-sky-800 border border-sky-100 hi">{l}</span>
                ))}
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="card p-7 h-full">
              <span className="chip bg-brand-600 text-white">Phase 3 · Live now</span>
              <div className="mt-4 h-12 w-12 rounded-2xl bg-amber-100 grid place-items-center text-amber-700"><Truck /></div>
              <div className="font-extrabold text-xl mt-3">Expiry redistribution</div>
              <p className="text-muted mt-2 leading-relaxed">Batches that would expire unused are matched to the nearest facility running short. The district officer approves every move and downloads transfer orders.</p>
              <Link to="/redistribute" className="mt-3 inline-flex items-center gap-1 font-extrabold text-brand-700">Open transfers <ArrowRight size={16} /></Link>
              <svg viewBox="0 0 260 90" className="mt-4 w-full">
                <g fill="none" stroke="#f0a23b" strokeWidth="2.5" strokeDasharray="4 6" strokeLinecap="round">
                  <path d="M50 60 C90 10 130 10 170 40" /><path d="M170 40 C200 60 220 60 232 30" />
                </g>
                {[[50, 60, "#e5484d"], [170, 40, "#2f9e6b"], [232, 30, "#3b9ce2"]].map(([x, y, c], i) => (
                  <g key={i}><circle cx={x as number} cy={y as number} r="13" fill={c as string} opacity=".18" /><circle cx={x as number} cy={y as number} r="6" fill={c as string} /></g>
                ))}
                <text x="50" y="84" textAnchor="middle" fontSize="10" fontWeight="700" fill="#5b7780">near expiry</text>
                <text x="170" y="72" textAnchor="middle" fontSize="10" fontWeight="700" fill="#5b7780">running out</text>
              </svg>
            </div>
          </Reveal>
        </div>
      </section>

      {/* UP SCALE */}
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

      {/* FINAL CTA */}
      <section className="mx-auto max-w-5xl px-5 pt-28">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-600 to-brand-800 p-10 md:p-14 text-white text-center shadow-pop">
            <div className="absolute -right-10 -top-10 h-56 w-56 rounded-full bg-white/10" />
            <div className="absolute -left-14 -bottom-14 h-64 w-64 rounded-full bg-white/10" />
            <MapPin className="mx-auto opacity-80" />
            <h2 className="mt-3 text-3xl md:text-4xl font-extrabold leading-tight">Ready to see today's register in action?</h2>
            <p className="mt-3 text-brand-100 text-lg">Upload a photo or try a ready sample page. It takes under a minute.</p>
            <div className="mt-7 flex flex-wrap gap-3 justify-center">
              <Link to="/scan" className="btn bg-white text-brand-800 hover:-translate-y-0.5 !px-7 !py-4 text-lg"><Camera size={22} /> Scan a Register</Link>
              <Link to="/scan?sample=1" className="btn border-white/50 text-white hover:bg-white/10 !px-7 !py-4 text-lg"><ImagePlus size={22} /> Try a sample</Link>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
