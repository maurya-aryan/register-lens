import { useRef, useState } from "react";

export default function BeforeAfter({ before, after, labelBefore = "Original photo", labelAfter = "Cleaned for AI", className = "" }: { before: string; after: string; labelBefore?: string; labelAfter?: string; className?: string }) {
  const [pos, setPos] = useState(50);
  const box = useRef<HTMLDivElement>(null);
  const drag = useRef(false);
  const move = (clientX: number) => {
    const r = box.current!.getBoundingClientRect();
    setPos(Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100)));
  };
  return (
    <div
      ref={box}
      className={`relative overflow-hidden rounded-2xl select-none touch-none bg-brand-50 ${className}`}
      onPointerDown={(e) => { drag.current = true; (e.target as HTMLElement).setPointerCapture?.(e.pointerId); move(e.clientX); }}
      onPointerMove={(e) => drag.current && move(e.clientX)}
      onPointerUp={() => (drag.current = false)}
      style={{ cursor: "ew-resize" }}
    >
      <img src={after} alt={labelAfter} className="block w-full h-full object-contain" draggable={false} />
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        <img src={before} alt={labelBefore} className="block w-full h-full object-contain" draggable={false} />
      </div>
      <div className="absolute top-0 bottom-0" style={{ left: `${pos}%` }}>
        <div className="absolute -translate-x-1/2 top-0 bottom-0 w-[3px] bg-white shadow-[0_0_0_1px_rgba(20,102,92,.4)]" />
        <div className="absolute -translate-x-1/2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white shadow-pop grid place-items-center text-brand-700 font-black">⇆</div>
      </div>
      <span className="chip absolute left-3 top-3 bg-white/90 text-ink">{labelBefore}</span>
      <span className="chip absolute right-3 top-3 bg-brand-600 text-white">{labelAfter}</span>
    </div>
  );
}
