"use client";

import { useAccount, useReadContract } from "wagmi";
import { CHROMACLASH_ADDRESS, CHROMACLASH_ABI } from "@/lib/contracts";

const SAMPLE = [
  "0x0000000000000000000000000000000000000001",
  "0x0000000000000000000000000000000000000002",
  "0x0000000000000000000000000000000000000003",
];

export default function Scoreboard() {
  const { address } = useAccount();
  const contract = CHROMACLASH_ADDRESS;

  const { data: epoch } = useReadContract({ address: contract, abi: CHROMACLASH_ABI, functionName: "currentEpoch" });
  const { data: epochStart } = useReadContract({ address: contract, abi: CHROMACLASH_ABI, functionName: "epochStart" });
  const { data: myPixels } = useReadContract({
    address: contract, abi: CHROMACLASH_ABI, functionName: "getPlayerPixels",
    args: address ? [address] : undefined,
  });

  // Days remaining in epoch
  const epochDuration = 7 * 24 * 3600;
  const elapsed = epochStart ? Math.floor(Date.now() / 1000) - Number(epochStart) : 0;
  const remaining = Math.max(0, epochDuration - elapsed);
  const daysLeft = Math.floor(remaining / 86400);
  const hoursLeft = Math.floor((remaining % 86400) / 3600);

  return (
    <div className="space-y-4">
      <div className="bg-pink-900/20 border border-pink-700 rounded-2xl p-4">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs text-pink-400 uppercase tracking-wide">Current Battle</p>
            <p className="text-2xl font-bold text-white mt-1">Epoch #{epoch?.toString() ?? "0"}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Ends in</p>
            <p className="text-sm font-bold text-pink-400">{daysLeft}d {hoursLeft}h</p>
          </div>
        </div>
        {address && (
          <div className="mt-3 pt-3 border-t border-pink-800/40">
            <p className="text-xs text-gray-400">Your claimed pixels this epoch</p>
            <p className="text-xl font-bold text-pink-300">{myPixels?.toString() ?? "0"}</p>
          </div>
        )}
      </div>

      <div className="bg-gray-900 rounded-2xl p-4 space-y-2">
        <p className="text-sm font-semibold text-white mb-3">How scoring works</p>
        <div className="space-y-2 text-xs text-gray-400">
          <p>• Each pixel you own on the canvas = 1 point</p>
          <p>• Opponents can paint over your pixels to reclaim them</p>
          <p>• Defend your territory or paint more</p>
          <p>• Free: 1 pixel every 5 minutes</p>
          <p>• Paid: 0.01 USDM for immediate placement (30s cooldown)</p>
          <p>• Batch: 0.04 USDM for 5 pixels at once</p>
          <p>• Top painter at epoch end wins from the fee pool</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-800">
          <p className="text-sm font-semibold text-white">Leaderboard</p>
        </div>
        <div className="divide-y divide-gray-800">
          {SAMPLE.map((addr, i) => (
            <div key={addr} className="flex items-center gap-3 px-4 py-3">
              <span className="text-lg font-bold text-gray-500">#{i + 1}</span>
              <p className="flex-1 text-sm font-mono text-gray-300">{addr.slice(0, 6)}…{addr.slice(-4)}</p>
              <p className="text-white font-bold">— <span className="text-xs text-gray-400 font-normal">pixels</span></p>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-600 px-4 py-2 text-center">Leaderboard updates from on-chain events</p>
      </div>
    </div>
  );
}
