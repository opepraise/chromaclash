"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { PALETTE } from "@/lib/contracts";
import type { FeedItem } from "@/lib/useChromaClash";

export default function LiveFeed({ feed }: { feed: FeedItem[] }) {
  const { address } = useAccount();
  const [, forceTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => forceTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="rounded-2xl border p-4" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
      <div className="font-display mb-2.5 text-[11px]" style={{ color: "var(--muted)" }}>LIVE FEED</div>
      <div className="flex flex-col gap-2">
        {feed.length === 0 && (
          <p className="py-2 text-xs" style={{ color: "var(--muted)" }}>Waiting for the first pixel…</p>
        )}
        {feed.map(f => {
          const you = address && f.placer.toLowerCase() === address.toLowerCase();
          const secs = Math.max(0, Math.round((Date.now() - f.t) / 1000));
          return (
            <div key={f.key} className="animate-pop flex items-center gap-2 text-[12.5px]">
              <span className="h-2.5 w-2.5 flex-shrink-0" style={{ background: PALETTE[f.colorIdx] }} />
              <span className="whitespace-nowrap font-semibold" style={{ color: you ? "var(--brand)" : "var(--text)" }}>
                {you ? "You" : `${f.placer.slice(0, 6)}…${f.placer.slice(-4)}`}
              </span>
              <span className="flex-1 truncate" style={{ color: "var(--muted)" }}>
                claimed ({f.x},{f.y})
              </span>
              <span className="text-[11px]" style={{ color: "var(--muted)" }}>{secs}s</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
