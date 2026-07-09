"use client";

import { useAccount, useReadContract } from "wagmi";
import { CHROMACLASH_ADDRESS, CHROMACLASH_ABI, PALETTE } from "@/lib/contracts";

function shortAddr(a: string) {
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

export default function Leaderboard({
  counts, onPreviewWinner,
}: {
  counts: Map<string, number>;
  onPreviewWinner: () => void;
}) {
  const { address } = useAccount();
  const { data: feeBalance } = useReadContract({
    address: CHROMACLASH_ADDRESS, abi: CHROMACLASH_ABI, functionName: "platformFeeBalance",
    query: { refetchInterval: 10000 },
  });

  const rows = [...counts.entries()]
    .map(([owner, n]) => ({ owner, n, color: PALETTE[Math.abs(hashCode(owner)) % PALETTE.length] }))
    .sort((a, b) => b.n - a.n)
    .slice(0, 5);

  const prizePool = feeBalance !== undefined ? (Number(feeBalance) / 1e18).toFixed(2) : "0.00";

  return (
    <div className="rounded-2xl border p-4" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
      <div className="mb-3 flex items-center justify-between">
        <div className="font-display text-[11px]" style={{ color: "var(--muted)" }}>LEADERBOARD</div>
        <div className="text-xs" style={{ color: "var(--muted)" }}>
          prize pool <span className="font-bold" style={{ color: "var(--text)" }}>{prizePool} USDM</span>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        {rows.length === 0 && (
          <p className="py-3 text-center text-xs" style={{ color: "var(--muted)" }}>No pixels placed yet this epoch</p>
        )}
        {rows.map((r, i) => {
          const you = address && r.owner.toLowerCase() === address.toLowerCase();
          return (
            <div
              key={r.owner}
              className="flex items-center gap-2.5 rounded-lg border px-2.5 py-2"
              style={{ background: you ? "var(--surface2)" : "transparent", borderColor: you ? "var(--border2)" : "transparent" }}
            >
              <span className="font-display w-[18px] text-[11px]" style={{ color: "var(--muted)" }}>#{i + 1}</span>
              <span className="h-3 w-3 flex-shrink-0" style={{ background: r.color }} />
              <span className="flex-1 truncate text-sm font-semibold">{you ? "You" : shortAddr(r.owner)}</span>
              <span className="font-display text-xs">{r.n}</span>
            </div>
          );
        })}
      </div>
      <button
        onClick={onPreviewWinner}
        className="mt-3 h-9 w-full rounded-lg border border-dashed text-xs font-semibold"
        style={{ borderColor: "var(--border2)", color: "var(--muted)" }}
      >
        Preview epoch end →
      </button>
    </div>
  );
}

function hashCode(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i) | 0;
  return h;
}
