import { motion } from "framer-motion";

const Capsule = ({ x, y, r = 0, a = "#f0a23b", b = "#fff", s = 1, delay = 0 }: { x: number; y: number; r?: number; a?: string; b?: string; s?: number; delay?: number }) => (
  <motion.g
    initial={{ opacity: 0, scale: 0.4 }}
    animate={{ opacity: 1, scale: 1, y: [0, -12, 0] }}
    transition={{ opacity: { delay: 0.5 + delay, duration: 0.5 }, scale: { delay: 0.5 + delay, duration: 0.6 }, y: { delay: 1 + delay, duration: 4 + delay, repeat: Infinity, ease: "easeInOut" } }}
    style={{ transformBox: "fill-box", transformOrigin: "center" }}
  >
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
      <rect x="-26" y="-11" width="52" height="22" rx="11" fill={b} stroke="#dcebe7" strokeWidth="1.5" />
      <path d="M-26 0a11 11 0 0 1 11-11H0v22h-15a11 11 0 0 1-11-11z" fill={a} />
      <rect x="-20" y="-6" width="18" height="3" rx="1.5" fill="#fff" opacity=".55" />
    </g>
  </motion.g>
);

const Plus = ({ x, y, d = 0, c = "#72d0bd" }: { x: number; y: number; d?: number; c?: string }) => (
  <motion.g
    animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.15, 0.8], rotate: [0, 90, 0] }}
    transition={{ duration: 3.2, repeat: Infinity, delay: d }}
    style={{ transformBox: "fill-box", transformOrigin: "center" }}
  >
    <path d={`M${x} ${y - 9}v18M${x - 9} ${y}h18`} stroke={c} strokeWidth="4" strokeLinecap="round" />
  </motion.g>
);

export default function HeroArt() {
  return (
    <svg viewBox="0 0 580 520" className="w-full h-auto drop-shadow-sm" role="img" aria-label="A handwritten register being scanned by a phone and synced to DVDMS">
      <defs>
        <linearGradient id="beam" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3fb8a3" stopOpacity="0" />
          <stop offset=".5" stopColor="#3fb8a3" stopOpacity=".55" />
          <stop offset="1" stopColor="#3fb8a3" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="screen" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f2fbf9" />
          <stop offset="1" stopColor="#dff3ee" />
        </linearGradient>
        <clipPath id="pageClip"><rect x="58" y="128" width="262" height="228" rx="6" /></clipPath>
        <filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="14" stdDeviation="12" floodColor="#14665c" floodOpacity=".22" /></filter>
      </defs>

      {/* blobs */}
      <motion.path
        d="M300 30c92-10 190 40 220 130s-6 190-84 252-190 70-268 20S38 300 50 210 190 40 300 30z"
        fill="#d5f3ec"
        animate={{ rotate: [0, 6, 0], scale: [1, 1.03, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "300px 260px" }}
      />
      <motion.path
        d="M420 60c50 8 96 52 100 108s-40 96-96 96-104-44-104-100 50-112 100-104z"
        fill="#dcecfa"
        animate={{ y: [0, -14, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      />
      <ellipse cx="290" cy="478" rx="200" ry="16" fill="#14665c" opacity=".1" />

      {/* register book */}
      <motion.g initial={{ opacity: 0, y: 40, rotate: -12 }} animate={{ opacity: 1, y: 0, rotate: -6 }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }} style={{ transformOrigin: "190px 240px" }} filter="url(#soft)">
        <g className="floaty" style={{ ["--r" as string]: "0deg" }}>
          <rect x="44" y="112" width="290" height="258" rx="14" fill="#14665c" />
          <rect x="52" y="120" width="274" height="242" rx="10" fill="#fbfdfc" />
          {/* header + rules */}
          <rect x="70" y="136" width="120" height="10" rx="5" fill="#a9e5d7" />
          <rect x="230" y="136" width="70" height="10" rx="5" fill="#d5f3ec" />
          <g stroke="#cfe3de" strokeWidth="1.6">
            {[172, 198, 224, 250, 276, 302, 328].map((y) => (<path key={y} d={`M64 ${y}H314`} />))}
            {[168, 206, 246, 284].map((x) => (<path key={x} d={`M${x} 158V350`} />))}
          </g>
          {/* handwriting squiggles */}
          <g fill="none" stroke="#2b4bb5" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" opacity=".85">
            {[168, 194, 220, 246, 272, 298, 324].map((y, i) => (
              <g key={y}>
                <motion.path
                  d={`M72 ${y + 14}c6-12 10 8 16-2s10-6 16 0 10 6 16-4 8 2 14 0`}
                  initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.9 + i * 0.18, duration: 0.9 }}
                />
                <motion.path d={`M178 ${y + 12}h14M216 ${y + 12}h14M254 ${y + 12}h16M292 ${y + 12}h12`} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 1.1 + i * 0.18, duration: 0.7 }} />
              </g>
            ))}
          </g>
          {/* scanning beam */}
          <g clipPath="url(#pageClip)">
            <g className="scan-line">
              <rect x="52" y="120" width="274" height="46" fill="url(#beam)" />
              <rect x="52" y="141" width="274" height="3" fill="#1f9d8a" opacity=".8" />
            </g>
          </g>
          {/* spiral rings */}
          {[150, 190, 230, 270, 310].map((y) => (<rect key={y} x="36" y={y} width="20" height="8" rx="4" fill="#0b3f39" />))}
        </g>
      </motion.g>

      {/* phone */}
      <motion.g initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4, duration: 0.9, ease: [0.22, 1, 0.36, 1] }} filter="url(#soft)">
        <g transform="translate(380 150) rotate(7)">
          <g className="floaty" style={{ ["--r" as string]: "0deg", animationDelay: "-1.5s" }}>
            <rect x="0" y="0" width="150" height="280" rx="24" fill="#16323a" />
            <rect x="8" y="10" width="134" height="260" rx="18" fill="url(#screen)" />
            <rect x="52" y="14" width="46" height="8" rx="4" fill="#16323a" />
            {/* viewfinder */}
            <g stroke="#167f71" strokeWidth="4" strokeLinecap="round" fill="none">
              <path d="M26 58v-16h16M124 58v-16h-16M26 168v16h16M124 168v16h-16" />
            </g>
            <rect x="34" y="66" width="82" height="96" rx="6" fill="#fff" stroke="#cfe3de" />
            {[78, 92, 106, 120, 134, 148].map((y) => (<rect key={y} x="42" y={y} width={y % 3 ? 66 : 48} height="5" rx="2.5" fill="#cfe3de" />))}
            <motion.rect x="34" y="66" width="82" height="4" fill="#1f9d8a" animate={{ y: [66, 158, 66] }} transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }} />
            {/* result chip */}
            <motion.g initial={{ opacity: 0, y: 10 }} animate={{ opacity: [0, 1, 1, 0], y: [10, 0, 0, -6] }} transition={{ duration: 5, repeat: Infinity, times: [0, 0.15, 0.85, 1], delay: 1.6 }}>
              <rect x="22" y="196" width="106" height="52" rx="14" fill="#fff" stroke="#a9e5d7" />
              <circle cx="44" cy="222" r="12" fill="#2f9e6b" />
              <path d="M38 222l5 5 9-10" stroke="#fff" strokeWidth="3.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              <rect x="62" y="211" width="52" height="7" rx="3.5" fill="#16323a" opacity=".75" />
              <rect x="62" y="225" width="36" height="6" rx="3" fill="#a9e5d7" />
            </motion.g>
          </g>
        </g>
      </motion.g>

      {/* DVDMS card + data path */}
      <path id="datapath" d="M150 372C170 430 300 452 388 440" fill="none" stroke="#3fb8a3" strokeWidth="3" strokeDasharray="2 10" strokeLinecap="round" />
      <circle r="6" fill="#1f9d8a">
        <animateMotion dur="2.6s" repeatCount="indefinite" path="M150 372C170 430 300 452 388 440" />
      </circle>
      <motion.g initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2, duration: 0.8 }} filter="url(#soft)">
        <rect x="388" y="410" width="150" height="62" rx="16" fill="#fff" stroke="#a9e5d7" />
        <rect x="402" y="424" width="34" height="34" rx="10" fill="#167f71" />
        <path d="M410 446l6 6 12-14" stroke="#fff" strokeWidth="3.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <text x="446" y="437" fontSize="15" fontWeight="800" fill="#14665c">DVDMS</text>
        <text x="446" y="455" fontSize="11.5" fontWeight="700" fill="#5b7780">up to date</text>
      </motion.g>

      {/* bottle */}
      <motion.g initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8, duration: 0.8 }}>
        <g transform="translate(34 388) rotate(-8)" className="floaty" style={{ ["--r" as string]: "-8deg", animationDelay: "-2s" }}>
          <rect x="6" y="0" width="34" height="14" rx="4" fill="#fff" stroke="#dcebe7" strokeWidth="1.5" />
          <rect x="0" y="12" width="46" height="66" rx="10" fill="#f0a23b" />
          <rect x="6" y="30" width="34" height="30" rx="5" fill="#fff" />
          <path d="M23 36v18M14 45h18" stroke="#e5484d" strokeWidth="4" strokeLinecap="round" />
        </g>
      </motion.g>

      {/* ECG card */}
      <motion.g initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.0, duration: 0.7 }} filter="url(#soft)">
        <g transform="translate(306 40)">
          <rect width="140" height="62" rx="16" fill="#fff" stroke="#dcebe7" />
          <motion.path d="M96 24c0-8-12-9-12 0 0 8 12 14 12 14s12-6 12-14c0-9-12-8-12 0z" fill="#e5484d" animate={{ scale: [1, 1.18, 1] }} transition={{ duration: 1.1, repeat: Infinity }} style={{ transformBox: "fill-box", transformOrigin: "center" }} />
          <motion.path d="M14 40h20l6-16 10 30 8-20 6 6h14" fill="none" stroke="#1f9d8a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: [0, 1, 1, 0] }} transition={{ duration: 3.4, repeat: Infinity, times: [0, 0.5, 0.85, 1] }} />
        </g>
      </motion.g>

      <Capsule x={100} y={72} r={-24} a="#3b9ce2" delay={0.1} />
      <Capsule x={520} y={300} r={35} a="#e5484d" s={0.9} delay={0.4} />
      <Capsule x={344} y={396} r={-14} a="#2f9e6b" s={0.8} delay={0.7} />
      <Plus x={60} y={210} d={0.2} />
      <Plus x={548} y={128} d={1.2} c="#3b9ce2" />
      <Plus x={262} y={96} d={0.7} c="#f0a23b" />
      <Plus x={480} y={488} d={1.6} />
    </svg>
  );
}
