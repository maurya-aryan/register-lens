import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Camera } from "lucide-react";
import Logo from "./Logo";

const links = [
  { to: "/#how", label: "How it works" },
  { to: "/map", label: "UP Map" },
  { to: "/redistribute", label: "Expiry transfers" },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const loc = useLocation();
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 12);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <header
      className={`sticky top-0 z-50 transition-all ${scrolled ? "bg-white/85 backdrop-blur-md shadow-[0_6px_24px_-14px_rgba(20,102,92,.5)]" : "bg-transparent"}`}
    >
      <div className="mx-auto max-w-7xl px-5 h-[72px] flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-3 group">
          <Logo />
          <div className="leading-tight">
            <div className="font-extrabold text-lg text-brand-800">Register Lens</div>
            <div className="text-[11px] text-muted font-semibold tracking-wide">Smart health supply chain</div>
          </div>
        </Link>
        <nav className="hidden md:flex items-center gap-1">
          <NavLink to="/" end className={({ isActive }) => `px-4 py-2 rounded-full font-bold text-sm ${isActive && !loc.hash ? "text-brand-700 bg-brand-50" : "text-muted hover:text-brand-700"}`}>
            Home
          </NavLink>
          {links.map((l) => (
            <Link key={l.to} to={l.to} className={`px-4 py-2 rounded-full font-bold text-sm ${(loc.pathname + loc.hash === l.to || (!l.to.includes('#') && loc.pathname === l.to)) ? "text-brand-700 bg-brand-50" : "text-muted hover:text-brand-700"}`}>
              {l.label}
            </Link>
          ))}
        </nav>
        <Link to="/scan" className="btn btn-primary !py-2.5 !px-5 relative">
          <span className="absolute inset-0 rounded-full bg-brand-400 pulse-ring -z-10" aria-hidden />
          <Camera size={18} /> Scan Register
        </Link>
      </div>
    </header>
  );
}
