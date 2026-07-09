"use client";

import { useMemo } from "react";
import { useReadContract } from "wagmi";
import { CHROMACLASH_ADDRESS, CHROMACLASH_ABI, PALETTE } from "@/lib/contracts";
import Modal from "./Modal";

function shortAddr(a: string) {
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

function hashCode(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i) | 0;
  return h;
}

export default function WinnerModal({
  counts, currentEpoch, onClose,
}: {
  counts: Map<string, number>;
  currentEpoch: bigint | undefined;
  onClose: () => void;
}) {
  const { data: feeBalance } = useReadContract({
    address: CHROMACLASH_ADDRESS, abi: CHROMACLASH_ABI, functionName: "platformFeeBalance",
  });

  const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  const prizePool = feeBalance !== undefined ? Number(feeBalance) / 1e18 : 0;

  const confetti = useMemo(() => Array.from({ length: 22 }, () => ({
    left: `${(Math.random() * 96).toFixed(1)}%`,
    size: `${(5 + Math.random() * 6).toFixed(0)}px`,
    color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
    dur: `${(2.2 + Math.random() * 2.5).toFixed(1)}s`,
    delay: `${(Math.random() * 2.5).toFixed(1)}s`,
  })), []);

  return (
    <Modal onClose={onClose} maxWidth={420}>
      <div className="relative overflow-hidden text-center">
        <div className="pointer-events-none absolute inset-0">
          {confetti.map((cf, i) => (
            <span
              key={i}
              className="absolute top-0"
              style={{
                left: cf.left, width: cf.size, height: cf.size, background: cf.color,
                animation: `ccFall ${cf.dur} ${cf.delay} linear infinite`,
              }}
            />
          ))}
        </div>

        <svg width="56" height="56" viewBox="0 0 20 20" className="animate-bounce-in mx-auto">
          <rect x="4" y="2" width="4" height="4" fill="#FCFF52" /><rect x="8" y="2" width="4" height="4" fill="#FCFF52" /><rect x="12" y="2" width="4" height="4" fill="#FCFF52" />
          <rect x="2" y="6" width="4" height="4" fill="#E59500" /><rect x="14" y="6" width="4" height="4" fill="#E59500" />
          <rect x="6" y="6" width="8" height="8" fill="#FCFF52" />
          <rect x="6" y="14" width="8" height="4" fill="#E59500" />
        </svg>

        <div className="font-display mt-3.5 text-[15px]">EPOCH {currentEpoch?.toString() ?? "—"} STANDINGS</div>
        <div className="mb-[18px] text-[13px]" style={{ color: "var(--muted)" }}>Live preview — final result locks when the epoch ends</div>

        <div className="mb-3.5 rounded-xl border p-4" style={{ borderColor: "var(--border)", background: "var(--surface2)" }}>
          {top ? (
            <>
              <div className="mb-1.5 flex items-center justify-center gap-2.5">
                <span className="inline-block h-3.5 w-3.5" style={{ background: PALETTE[Math.abs(hashCode(top[0])) % PALETTE.length] }} />
                <span className="text-base font-bold">{shortAddr(top[0])}</span>
              </div>
              <div className="text-[13px]" style={{ color: "var(--muted)" }}>
                {top[1]} pixels held · would win{" "}
                <span className="font-bold" style={{ color: "var(--text)" }}>{(prizePool * 0.6).toFixed(2)} USDM</span>
              </div>
            </>
          ) : (
            <div className="text-sm" style={{ color: "var(--muted)" }}>No pixels claimed yet this epoch</div>
          )}
        </div>
        <div className="mb-[18px] text-[12.5px]" style={{ color: "var(--muted)" }}>
          When the 7-day epoch ends, the canvas wipes clean. Same 10,000 pixels. Fresh war.
        </div>

        <button
          onClick={onClose}
          className="h-10 w-full rounded-xl border text-sm font-semibold"
          style={{ borderColor: "var(--border)", color: "var(--muted)" }}
        >
          Close
        </button>
      </div>
    </Modal>
  );
}
