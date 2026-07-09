"use client";

import { useEffect, useState } from "react";
import { useAccount, useReadContract } from "wagmi";
import { CHROMACLASH_ADDRESS, CHROMACLASH_ABI } from "@/lib/contracts";
import { fmtLeft } from "@/lib/format";
import { useTheme } from "@/lib/theme";
import { useChromaClash } from "@/lib/useChromaClash";
import { usePixelPainter } from "@/lib/usePixelPainter";
import Logo, { Wordmark } from "./Logo";
import Canvas from "./Canvas";
import ModePanel from "./ModePanel";
import Leaderboard from "./Leaderboard";
import LiveFeed from "./LiveFeed";
import ConnectModal from "./ConnectModal";
import HowToModal from "./HowToModal";
import WinnerModal from "./WinnerModal";

type Modal = "connect" | "howto" | "winner" | null;

export default function GameScreen({ onGoLanding }: { onGoLanding: () => void }) {
  const { theme, toggleTheme } = useTheme();
  const { address, isConnected } = useAccount();
  const [modal, setModal] = useState<Modal>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const { data: epochStart } = useReadContract({
    address: CHROMACLASH_ADDRESS, abi: CHROMACLASH_ABI, functionName: "epochStart",
    query: { refetchInterval: 30000 },
  });
  const { data: currentEpoch } = useReadContract({
    address: CHROMACLASH_ADDRESS, abi: CHROMACLASH_ABI, functionName: "currentEpoch",
  });

  const { pixels, feed, counts, paintedCount } = useChromaClash(currentEpoch);
  const painter = usePixelPainter(pixels);

  const epochEndMs = epochStart ? (Number(epochStart) + 7 * 86400) * 1000 : 0;
  const epochLeftMs = epochEndMs ? epochEndMs - now : 0;

  function handleCellClick(x: number, y: number) {
    painter.paintCell(x, y).then(result => {
      if (result === "needs-connect") setModal("connect");
    });
  }

  return (
    <div className="animate-fade-up mx-auto max-w-[1240px] px-4 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-3 py-3.5">
        <div className="flex cursor-pointer items-center gap-2.5" onClick={onGoLanding}>
          <Logo size={28} />
          <Wordmark />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div
            className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: "var(--border)", background: "var(--surface)" }}
          >
            <span className="font-semibold" style={{ color: "var(--muted)" }}>
              EPOCH {painter.currentEpoch?.toString() ?? "—"}
            </span>
            <span className="font-display text-xs">ends in {fmtLeft(epochLeftMs)}</span>
          </div>
          <div
            className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: "var(--border)", background: "var(--surface)" }}
          >
            <span
              className="inline-block h-2.5 w-2.5 border"
              style={{ background: "#FCFF52", borderColor: "var(--border2)" }}
            />
            <span className="font-display text-xs">{painter.myPixels.toString()}</span>
            <span style={{ color: "var(--muted)" }}>owned</span>
          </div>
          {isConnected && address ? (
            <div
              className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: "var(--border)", background: "var(--surface)" }}
            >
              <span className="font-display text-[11px]" style={{ color: "var(--muted)" }}>
                {address.slice(0, 6)}…{address.slice(-4)}
              </span>
            </div>
          ) : (
            <button
              onClick={() => setModal("connect")}
              className="font-display h-9 rounded-lg px-3.5 text-[11px]"
              style={{ background: "var(--accent)", color: "var(--accent-ink)" }}
            >
              CONNECT WALLET
            </button>
          )}
          <button
            onClick={() => setModal("howto")}
            className="h-9 w-9 rounded-lg border font-bold"
            style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--muted)" }}
          >
            ?
          </button>
          <button
            onClick={toggleTheme}
            className="h-9 w-9 rounded-lg border"
            style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
          >
            {theme === "dark" ? "☀" : "☾"}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-start gap-4">
        <div className="min-w-[300px] flex-[1_1_520px]">
          <Canvas
            pixels={pixels}
            optimistic={painter.optimistic}
            onCellClick={handleCellClick}
            paintedCount={paintedCount}
          />
        </div>

        <div className="flex min-w-[280px] max-w-[380px] flex-[1_1_300px] flex-col gap-3">
          <ModePanel
            selectedColor={painter.selectedColor}
            setSelectedColor={painter.setSelectedColor}
            cooldownRemaining={painter.cooldownRemaining}
          />
          <Leaderboard counts={counts} onPreviewWinner={() => setModal("winner")} />
          <LiveFeed feed={feed} />
        </div>
      </div>

      {modal === "connect" && <ConnectModal onClose={() => setModal(null)} />}
      {modal === "howto" && <HowToModal onClose={() => setModal(null)} />}
      {modal === "winner" && (
        <WinnerModal counts={counts} currentEpoch={painter.currentEpoch} onClose={() => setModal(null)} />
      )}
    </div>
  );
}
