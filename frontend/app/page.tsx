"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import Canvas from "@/components/Canvas";
import Scoreboard from "@/components/Scoreboard";

type View = "canvas" | "scoreboard";

export default function Home() {
  const { isConnected } = useAccount();
  const [view, setView] = useState<View>("canvas");

  if (!isConnected) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <h1 className="text-2xl font-bold text-pink-400">ChromaClash</h1>
        <p className="text-gray-400 text-sm">Opening in MiniPay...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-md mx-auto px-4 pb-8">
      <header className="pt-5 pb-3 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-pink-400">ChromaClash</h1>
          <p className="text-xs text-gray-500">Paint pixels. Claim the canvas.</p>
        </div>
        <button onClick={() => setView(v => v === "scoreboard" ? "canvas" : "scoreboard")}
          className="text-xs text-gray-400 border border-gray-700 px-3 py-1.5 rounded-lg">
          {view === "scoreboard" ? "← Canvas" : "Scores"}
        </button>
      </header>

      <nav className="flex bg-gray-900 rounded-xl p-1 mb-4 gap-1">
        {([["canvas", "Canvas"], ["scoreboard", "Scores"]] as [View, string][]).map(([id, label]) => (
          <button key={id} onClick={() => setView(id)}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors ${view === id ? "bg-pink-600 text-white" : "text-gray-400"}`}>
            {label}
          </button>
        ))}
      </nav>

      {view === "canvas" && <Canvas />}
      {view === "scoreboard" && <Scoreboard />}
    </div>
  );
}
