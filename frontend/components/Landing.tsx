"use client";

import { useEffect, useMemo, useState } from "react";
import { useReadContract } from "wagmi";
import { CHROMACLASH_ADDRESS, CHROMACLASH_ABI, PALETTE } from "@/lib/contracts";
import { fmtLeft } from "@/lib/format";
import { useTheme } from "@/lib/theme";
import Logo, { Wordmark } from "./Logo";

export default function Landing({
  onEnterGame, onOpenConnect, onOpenHowTo,
}: {
  onEnterGame: () => void;
  onOpenConnect: () => void;
  onOpenHowTo: () => void;
}) {
  const { theme, toggleTheme } = useTheme();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const { data: epoch } = useReadContract({ address: CHROMACLASH_ADDRESS, abi: CHROMACLASH_ABI, functionName: "currentEpoch" });
  const { data: epochStart } = useReadContract({ address: CHROMACLASH_ADDRESS, abi: CHROMACLASH_ABI, functionName: "epochStart" });

  const epochEndMs = epochStart ? (Number(epochStart) + 7 * 86400) * 1000 : 0;
  const epochLeftMs = epochEndMs ? epochEndMs - now : 0;

  const heroPixels = useMemo(() => Array.from({ length: 196 }, () => {
    const on = Math.random() < 0.55;
    return {
      bg: on ? PALETTE[Math.floor(Math.random() * PALETTE.length)] : "rgba(128,128,128,0.12)",
      dur: `${(2 + Math.random() * 4).toFixed(1)}s`,
      delay: `${(Math.random() * 3).toFixed(1)}s`,
    };
  }), []);

  return (
    <div className="mx-auto max-w-[1120px] px-6 pb-20">
      <div className="flex flex-wrap items-center justify-between gap-4 py-5">
        <div className="flex items-center gap-3">
          <Logo size={32} />
          <Wordmark size="text-[17px]" />
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={toggleTheme}
            className="h-[38px] w-[38px] rounded-lg border text-[15px]"
            style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
          >
            {theme === "dark" ? "☀" : "☾"}
          </button>
          <button
            onClick={onOpenHowTo}
            className="h-[38px] rounded-lg border px-3.5 text-sm font-semibold"
            style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
          >
            How it works
          </button>
          <button
            onClick={onEnterGame}
            className="font-display h-[38px] rounded-lg px-[18px] text-xs"
            style={{ background: "var(--accent)", color: "var(--accent-ink)" }}
          >
            LAUNCH APP
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-12 py-10 pb-8">
        <div className="animate-fade-up min-w-[300px] flex-[1_1_440px]">
          <div
            className="inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold tracking-wide"
            style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--muted)" }}
          >
            <span className="animate-blink inline-block h-2 w-2" style={{ background: "#4ADE80", borderRadius: "50%" }} />
            LIVE ON CELO · EPOCH {epoch?.toString() ?? "—"}
          </div>
          <h1 className="font-display my-5 text-[clamp(34px,5.4vw,58px)] font-bold leading-[1.12]">
            10,000 PIXELS.<br />ZERO MERCY.
          </h1>
          <p className="mb-7 max-w-[460px] text-[17px] leading-relaxed" style={{ color: "var(--muted)" }}>
            A live pixel war on a shared 100×100 canvas. Paint for free, steal territory from strangers, and hold the most ground when the epoch ends to win the prize pool.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={onOpenConnect}
              className="font-display h-[52px] rounded-[10px] px-[26px] text-sm"
              style={{ background: "var(--accent)", color: "var(--accent-ink)" }}
            >
              CONNECT WALLET →
            </button>
            <button
              onClick={onOpenHowTo}
              className="h-[52px] rounded-[10px] border px-[22px] text-[15px] font-semibold"
              style={{ borderColor: "var(--border2)", color: "var(--text)" }}
            >
              How it works
            </button>
          </div>
          <div className="mt-9 flex flex-wrap gap-7">
            <div>
              <div className="font-display text-xl">100×100</div>
              <div className="text-[13px]" style={{ color: "var(--muted)" }}>shared canvas</div>
            </div>
            <div>
              <div className="font-display text-xl">FREE</div>
              <div className="text-[13px]" style={{ color: "var(--muted)" }}>1 pixel / 5 min</div>
            </div>
            <div>
              <div className="font-display text-xl">7 DAYS</div>
              <div className="text-[13px]" style={{ color: "var(--muted)" }}>per epoch, then reset</div>
            </div>
          </div>
        </div>

        <div className="animate-fade-up min-w-[280px] flex-[0_1_380px]" style={{ animationDelay: "0.12s" }}>
          <div className="rounded-2xl border p-[18px]" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
            <div className="grid grid-cols-[repeat(14,1fr)] gap-[3px]">
              {heroPixels.map((hp, i) => (
                <div key={i} className="aspect-square" style={{ background: hp.bg, animation: `ccPixelPulse ${hp.dur} ${hp.delay} infinite` }} />
              ))}
            </div>
            <div className="font-display mt-3.5 flex justify-between text-xs" style={{ color: "var(--muted)" }}>
              <span>EPOCH ENDS {fmtLeft(epochLeftMs).toUpperCase()}</span>
              <span style={{ color: "#4ADE80" }}>● LIVE</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4">
        <div
          className="animate-fade-up rounded-2xl border p-[26px] transition-transform hover:-translate-y-1"
          style={{ borderColor: "var(--border)", background: "var(--surface)", animationDelay: "0.15s" }}
        >
          <div className="font-display mb-3 text-[13px]" style={{ color: "#94E044" }}>01 · PAINT</div>
          <div className="mb-2 text-lg font-bold">Free pixel every 5 minutes</div>
          <div className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>Pick from 16 colors and drop a pixel anywhere. No wallet balance needed to start fighting.</div>
        </div>
        <div
          className="animate-fade-up rounded-2xl border p-[26px] transition-transform hover:-translate-y-1"
          style={{ borderColor: "var(--border)", background: "var(--surface)", animationDelay: "0.28s" }}
        >
          <div className="font-display mb-3 text-[13px]" style={{ color: "#00D3DD" }}>02 · CLAIM</div>
          <div className="mb-2 text-lg font-bold">Paint over anyone</div>
          <div className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>Every pixel has an owner. Cover an opponent&apos;s pixel and it counts for you — until they take it back.</div>
        </div>
        <div
          className="animate-fade-up rounded-2xl border p-[26px] transition-transform hover:-translate-y-1"
          style={{ borderColor: "var(--border)", background: "var(--surface)", animationDelay: "0.41s" }}
        >
          <div className="font-display mb-3 text-[13px]" style={{ color: "#CF6EE4" }}>03 · CONQUER</div>
          <div className="mb-2 text-lg font-bold">Hold ground, win the pool</div>
          <div className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>Your score is the pixels you own when the 7-day epoch ends. Top holder takes the fee pool. Then the canvas wipes.</div>
        </div>
      </div>

      <div
        className="mt-10 flex flex-wrap items-center justify-between gap-6 rounded-2xl border p-[26px]"
        style={{ borderColor: "var(--border)", background: "var(--surface)" }}
      >
        <div>
          <div className="font-display mb-1.5 text-[13px]" style={{ color: "var(--muted)" }}>NEED PIXELS FASTER?</div>
          <div className="text-base font-semibold">
            Instant pixel <span className="font-normal" style={{ color: "var(--muted)" }}>0.01 USDM · 30s cooldown</span>
            {" "}·{" "}
            Batch <span className="font-normal" style={{ color: "var(--muted)" }}>sign once, every 5th pixel free</span>
          </div>
        </div>
        <button
          onClick={onEnterGame}
          className="font-display h-11 rounded-[10px] border px-5 text-xs"
          style={{ borderColor: "var(--border2)", color: "var(--text)" }}
        >
          START FREE
        </button>
      </div>
    </div>
  );
}
