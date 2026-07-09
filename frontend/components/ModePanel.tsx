"use client";

import { PALETTE } from "@/lib/contracts";
import type { Mode } from "@/lib/usePixelPainter";

const MODES: Array<{ id: Mode; label: string; sub: string }> = [
  { id: "free", label: "FREE", sub: "1 / 5 min" },
  { id: "instant", label: "INSTANT", sub: "0.01 USDM" },
  { id: "batch", label: "BATCH", sub: "every 5th free" },
];

export default function ModePanel({
  mode, setMode, selectedColor, setSelectedColor, freeRemaining, paidRemaining,
}: {
  mode: Mode;
  setMode: (m: Mode) => void;
  selectedColor: number;
  setSelectedColor: (i: number) => void;
  freeRemaining: number;
  paidRemaining: number;
}) {
  const cdActive = mode === "free" ? freeRemaining > 0 : mode === "instant" ? paidRemaining > 0 : false;
  const cdRemaining = mode === "free" ? freeRemaining : paidRemaining;
  const cdTotal = mode === "free" ? 300 : 30;
  const cdPct = Math.round((cdRemaining / cdTotal) * 100);

  return (
    <div className="rounded-2xl border p-4" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
      <div className="font-display mb-2.5 text-[11px]" style={{ color: "var(--muted)" }}>PAINT MODE</div>
      <div className="grid grid-cols-3 gap-1.5">
        {MODES.map(m => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className="rounded-lg border px-1.5 py-2.5 text-center"
            style={{
              borderColor: mode === m.id ? "var(--accent)" : "var(--border)",
              background: mode === m.id ? "var(--accent)" : "var(--surface2)",
              color: mode === m.id ? "var(--accent-ink)" : "var(--text)",
            }}
          >
            <div className="font-display text-[10px]">{m.label}</div>
            <div className="mt-0.5 text-[11px] opacity-75">{m.sub}</div>
          </button>
        ))}
      </div>

      {cdActive ? (
        <div className="mt-3">
          <div className="mb-1.5 flex justify-between text-xs" style={{ color: "var(--muted)" }}>
            <span>Cooldown</span>
            <span className="font-display">{cdRemaining}s</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full" style={{ background: "var(--surface2)" }}>
            <div className="h-full transition-all" style={{ background: "var(--accent)", width: `${cdPct}%` }} />
          </div>
        </div>
      ) : (
        <div className="mt-3 text-sm font-semibold" style={{ color: "var(--ok)" }}>
          ● Ready — click the canvas to paint
        </div>
      )}

      <div className="font-display mb-2.5 mt-4 text-[11px]" style={{ color: "var(--muted)" }}>PALETTE · 16</div>
      <div className="grid grid-cols-8 gap-1.5">
        {PALETTE.map((hex, i) => (
          <button
            key={hex}
            onClick={() => setSelectedColor(i)}
            title={hex}
            className="aspect-square rounded-md border-2 p-0 transition-transform"
            style={{
              background: hex,
              borderColor: selectedColor === i ? "var(--text)" : "var(--border)",
              transform: selectedColor === i ? "scale(1.12)" : "scale(1)",
            }}
          />
        ))}
      </div>
    </div>
  );
}
