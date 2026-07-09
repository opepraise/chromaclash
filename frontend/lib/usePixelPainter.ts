"use client";

import { useEffect, useState } from "react";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { celo } from "wagmi/chains";
import { CHROMACLASH_ADDRESS, CHROMACLASH_ABI } from "./contracts";
import { useToast } from "./toast";

const COOLDOWN_SECS = 5;

export function usePixelPainter(pixels: Map<number, { colorIdx: number; owner: `0x${string}` }>) {
  const { address, isConnected } = useAccount();
  const { showToast } = useToast();
  const { writeContractAsync } = useWriteContract();

  const [selectedColor, setSelectedColor] = useState(5);
  const [optimistic, setOptimistic] = useState<Map<number, number>>(new Map());
  const [sending, setSending] = useState(false);
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));

  useEffect(() => {
    const id = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(id);
  }, []);

  // Once the authoritative event-sourced grid catches up, drop the optimistic overlay for that cell.
  useEffect(() => {
    if (optimistic.size === 0) return;
    setOptimistic(prev => {
      let changed = false;
      const next = new Map(prev);
      for (const idx of next.keys()) {
        if (pixels.has(idx)) { next.delete(idx); changed = true; }
      }
      return changed ? next : prev;
    });
  }, [pixels]); // eslint-disable-line react-hooks/exhaustive-deps

  const { data: currentEpoch } = useReadContract({
    address: CHROMACLASH_ADDRESS, abi: CHROMACLASH_ABI, functionName: "currentEpoch",
  });
  const { data: lastPlaced, refetch: refetchLastPlaced } = useReadContract({
    address: CHROMACLASH_ADDRESS, abi: CHROMACLASH_ABI, functionName: "lastPlaced",
    args: currentEpoch !== undefined && address ? [currentEpoch, address] : undefined,
    query: { refetchInterval: 2000 },
  });
  const { data: myPixels } = useReadContract({
    address: CHROMACLASH_ADDRESS, abi: CHROMACLASH_ABI, functionName: "getPlayerPixels",
    args: address ? [address] : undefined,
    query: { refetchInterval: 6000 },
  });

  const last = lastPlaced ? Number(lastPlaced) : 0;
  const cooldownRemaining = last === 0 ? 0 : Math.max(0, last + COOLDOWN_SECS - now);

  async function paintCell(x: number, y: number) {
    if (!isConnected) return "needs-connect" as const;
    if (cooldownRemaining > 0) { showToast(`Cooldown active — ${cooldownRemaining}s left`, "#FF5C5C"); return; }

    const idx = y * 100 + x;
    setSending(true);
    try {
      await writeContractAsync({
        address: CHROMACLASH_ADDRESS, abi: CHROMACLASH_ABI, functionName: "placePixel",
        args: [x, y, selectedColor], chainId: celo.id,
      });
      setOptimistic(prev => new Map(prev).set(idx, selectedColor));
      refetchLastPlaced();
    } catch {
      showToast("Transaction failed or rejected", "#FF5C5C");
    } finally {
      setSending(false);
    }
  }

  return {
    selectedColor, setSelectedColor,
    optimistic, paintCell, sending,
    myPixels: myPixels ?? 0,
    cooldownRemaining,
    currentEpoch,
  };
}
