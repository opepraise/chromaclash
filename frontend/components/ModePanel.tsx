"use client";

import { PALETTE } from "@/lib/contracts";

const COOLDOWN_TOTAL = 5;

export default function ModePanel({
  selectedColor, setSelectedColor, cooldownRemaining,
}: {
  selectedColor: number;
  setSelectedColor: (i: number) => void;
  cooldownRemaining: number;
}) {
  const cdActive = cooldownRemaining > 0;
  const cdPct = Math.round((cooldownRemaining / COOLDOWN_TOTAL) * 100);

  return (
    <div className="rounded-2xl border p-4" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
      <div className="font-display mb-2.5 text-[11px]" style={{ color: "var(--muted)" }}>PAINT — 100% FREE</div>

      {cdActive ? (
        <div>
          <div className="mb-1.5 flex justify-between text-xs" style={{ color: "var(--muted)" }}>
            <span>Cooldown</span>
            <span className="font-display">{cooldownRemaining}s</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full" style={{ background: "var(--surface2)" }}>
            <div className="h-full transition-all" style={{ background: "var(--accent)", width: `${cdPct}%` }} />
          </div>
        </div>
      ) : (
        <div className="text-sm font-semibold" style={{ color: "var(--ok)" }}>
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
