import { Link } from "react-router-dom";
import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-line bg-white/70">
      <div className="mx-auto max-w-7xl px-5 py-10 grid gap-8 md:grid-cols-3 text-sm">
        <div>
          <div className="flex items-center gap-3 mb-3"><Logo size={34} /><b className="text-brand-800 text-lg">Register Lens</b></div>
          <p className="text-muted leading-relaxed">
            Read the paper register the PHC already keeps, and keep DVDMS honest. Built for Build with AI: Code for Communities (Track 3, Smart Health &amp; Supply Chain Resilience).
          </p>
        </div>
        <div className="space-y-2">
          <div className="font-extrabold text-ink">Explore</div>
          <Link className="block text-muted hover:text-brand-700" to="/scan">Scan a register</Link>
          <Link className="block text-muted hover:text-brand-700" to="/map">UP map</Link>
          <Link className="block text-muted hover:text-brand-700" to="/redistribute">Expiry transfers</Link>
          <Link className="block text-muted hover:text-brand-700" to="/#how">How it works</Link>
          <Link className="block text-muted hover:text-brand-700" to="/#roadmap">Roadmap</Link>
        </div>
        <div className="space-y-2">
          <div className="font-extrabold text-ink">Good to know</div>
          <p className="text-muted leading-relaxed">This is a prototype. All stock data and register pages shown are <b>synthetic samples</b>. It is not an official government portal and is not connected to the real DVDMS.</p>
          <p className="text-muted">Powered by Google Gemini. Maps © OpenStreetMap contributors, © CARTO.</p>
        </div>
      </div>
    </footer>
  );
}
