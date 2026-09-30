import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, Mic, MicOff, Send, Sparkles, X, Wrench } from "lucide-react";
import { api, ChatMsg } from "../api";

// Other screens can share what the user is looking at (e.g. the latest reconciliation).
let screenContext: Record<string, unknown> = {};
export function setChatContext(c: Record<string, unknown>) { screenContext = { ...screenContext, ...c }; }

const SUGGEST = [
  "Which UP districts are most at risk?",
  "Barabanki mein kaun se PHC mein dawai khatam ho rahi hai?",
  "Where can PHC Banki get ORS nearby?",
  "Show the expiry transfer plan for Lucknow",
];
const TOOL_LABEL: Record<string, string> = {
  statewide_overview: "UP overview", district_status: "district data", facility_status: "facility stock",
  find_medicine_nearby: "nearby stock search", expiry_transfer_plan: "transfer plan",
};

type SR = { lang: string; interimResults: boolean; onresult: (e: { results: { 0: { transcript: string } }[] }) => void; onend: () => void; start: () => void; stop: () => void };

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [lang, setLang] = useState<"hi-IN" | "en-IN">("en-IN");
  const loc = useLocation();
  const endRef = useRef<HTMLDivElement>(null);
  const recRef = useRef<SR | null>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, busy]);

  const send = async (t: string) => {
    const q = t.trim();
    if (!q || busy) return;
    const next: ChatMsg[] = [...msgs, { role: "user", text: q }];
    setMsgs(next); setText(""); setBusy(true);
    try {
      const params = Object.fromEntries(new URLSearchParams(loc.search));
      const r = await api.chat(next, { page: loc.pathname, ...params, ...screenContext });
      setMsgs([...next, { role: "assistant", text: r.text, tools: r.tools_used }]);
    } catch (e) {
      setMsgs([...next, { role: "assistant", text: "Sorry, I could not reach the assistant. " + (e as Error).message }]);
    }
    setBusy(false);
  };

  const Ctor = (window as unknown as { SpeechRecognition?: new () => SR; webkitSpeechRecognition?: new () => SR }).SpeechRecognition
    || (window as unknown as { webkitSpeechRecognition?: new () => SR }).webkitSpeechRecognition;
  const toggleMic = () => {
    if (!Ctor) return;
    if (listening) { recRef.current?.stop(); return; }
    const r = new Ctor();
    r.lang = lang; r.interimResults = false;
    r.onresult = (e) => { const t = e.results[0][0].transcript; setText(t); send(t); };
    r.onend = () => setListening(false);
    recRef.current = r; setListening(true); r.start();
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 20, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.96 }}
            className="fixed right-5 bottom-24 z-[1000] w-[400px] max-w-[calc(100vw-40px)] h-[580px] max-h-[calc(100vh-130px)] card !rounded-[1.6rem] flex flex-col overflow-hidden shadow-pop">
            <div className="bg-gradient-to-r from-brand-600 to-brand-800 text-white px-5 py-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-white/15 grid place-items-center"><Bot size={22} /></div>
              <div className="flex-1">
                <div className="font-extrabold leading-tight">Register Lens Assistant</div>
                <div className="text-xs text-brand-100">Gemini · answers from live app data · Hindi or English</div>
              </div>
              <button onClick={() => setOpen(false)} className="h-8 w-8 rounded-full hover:bg-white/15 grid place-items-center" aria-label="Close chat"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-auto p-4 space-y-3 bg-brand-50/40">
              {msgs.length === 0 && (
                <div>
                  <div className="rounded-2xl bg-white border border-line p-3.5 text-sm leading-relaxed">
                    Namaste! Ask me about medicine stock at any health centre in Uttar Pradesh, which districts need attention, where to find a medicine nearby, or the expiry transfer plan. आप हिन्दी में भी पूछ सकते हैं।
                  </div>
                  <div className="mt-3 flex flex-col gap-2">
                    {SUGGEST.map((s) => (
                      <button key={s} onClick={() => send(s)} className="text-left rounded-2xl border border-brand-200 bg-white px-3.5 py-2 text-sm font-semibold text-brand-800 hover:bg-brand-50 flex items-center gap-2 hi">
                        <Sparkles size={14} className="shrink-0 text-brand-500" /> {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {msgs.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap hi ${m.role === "user" ? "bg-brand-600 text-white rounded-br-md" : "bg-white border border-line rounded-bl-md"}`}>
                    {m.text.replace(/\*\*/g, "")}
                    {m.tools && m.tools.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">{m.tools.map((t, k) => <span key={k} className="chip !text-[10px] bg-brand-50 text-brand-700"><Wrench size={10} /> {TOOL_LABEL[t] ?? t}</span>)}</div>
                    )}
                  </div>
                </div>
              ))}
              {busy && <div className="flex gap-1.5 px-2">{[0, 1, 2].map((k) => <motion.span key={k} className="h-2 w-2 rounded-full bg-brand-400" animate={{ y: [0, -5, 0] }} transition={{ duration: 0.8, repeat: Infinity, delay: k * 0.15 }} />)}</div>}
              <div ref={endRef} />
            </div>
            <form onSubmit={(e) => { e.preventDefault(); send(text); }} className="p-3 border-t border-line bg-white flex items-center gap-2">
              {Ctor && (
                <>
                  <button type="button" onClick={() => setLang(lang === "en-IN" ? "hi-IN" : "en-IN")} className="chip !text-xs bg-brand-50 text-brand-800 cursor-pointer" title="Voice language">{lang === "en-IN" ? "EN" : "हि"}</button>
                  <button type="button" onClick={toggleMic} className={`h-10 w-10 rounded-full grid place-items-center shrink-0 ${listening ? "bg-rose-500 text-white animate-pulse" : "bg-brand-50 text-brand-700"}`} aria-label="Speak">{listening ? <MicOff size={18} /> : <Mic size={18} />}</button>
                </>
              )}
              <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Ask about stock, districts, transfers…" className="flex-1 rounded-full border border-line px-4 py-2.5 text-sm focus:outline-none focus:border-brand-400 hi" />
              <button type="submit" disabled={busy || !text.trim()} className="h-10 w-10 rounded-full bg-brand-600 text-white grid place-items-center disabled:opacity-40" aria-label="Send"><Send size={17} /></button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.button onClick={() => setOpen(!open)} whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.95 }}
        className="fixed right-5 bottom-5 z-[1000] h-16 w-16 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-pop grid place-items-center" aria-label="Open assistant">
        {open ? <X size={26} /> : <Bot size={28} />}
        {!open && <span className="absolute -top-1 -right-1 chip !text-[10px] !px-2 bg-amber-400 text-ink">AI</span>}
      </motion.button>
    </>
  );
}
