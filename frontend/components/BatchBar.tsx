"use client";

import { MAX_BATCH } from "@/lib/usePixelPainter";

export default function BatchBar({
  queueLength, batchCost, sending, onClear, onConfirm,
}: {
  queueLength: number;
  batchCost: bigint;
  sending: boolean;
  onClear: () => void;
  onConfirm: () => void;
}) {
  if (queueLength === 0) return null;

  return (
    <div
      className="animate-pop mt-2.5 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3"
      style={{ borderColor: "var(--border2)", background: "var(--surface2)" }}
    >
      <div className="text-sm">
        <span className="font-display">{queueLength}/{MAX_BATCH}</span>{" "}
        <span style={{ color: "var(--muted)" }}>pixels queued — click canvas to add</span>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onClear}
          className="h-9 rounded-lg border px-3.5 text-sm font-semibold"
          style={{ borderColor: "var(--border2)", color: "var(--text)" }}
        >
          Clear
        </button>
        <button
          onClick={onConfirm}
          disabled={sending}
          className="font-display h-9 rounded-lg px-4 text-[11px] disabled:opacity-50"
          style={{ background: "var(--accent)", color: "var(--accent-ink)" }}
        >
          {sending ? "SENDING…" : `PAINT ALL · ${(Number(batchCost) / 1e18).toFixed(2)} USDM`}
        </button>
      </div>
    </div>
  );
}
