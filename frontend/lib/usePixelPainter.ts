"use client";

import { useEffect, useRef, useState } from "react";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { celo } from "wagmi/chains";
import { CHROMACLASH_ADDRESS, CHROMACLASH_ABI, ERC20_ABI, USDM_ADDRESS } from "./contracts";
import { useToast } from "./toast";

export const MAX_BATCH = 20;
const PIXEL_COST = BigInt("10000000000000000"); // 0.01 USDM
const APPROVAL_COST = PIXEL_COST * BigInt(MAX_BATCH) * 5n; // covers several batches so the user isn't re-approving every time

export type Mode = "free" | "instant" | "batch";

export function usePixelPainter(pixels: Map<number, { colorIdx: number; owner: `0x${string}` }>) {
  const { address, isConnected } = useAccount();
  const { showToast } = useToast();
  const { writeContractAsync } = useWriteContract();

  const [mode, setModeState] = useState<Mode>("free");
  const [selectedColor, setSelectedColor] = useState(5);
  const [queue, setQueue] = useState<Array<{ i: number; c: number }>>([]);
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
    query: { refetchInterval: 4000 },
  });
  const { data: myPixels } = useReadContract({
    address: CHROMACLASH_ADDRESS, abi: CHROMACLASH_ABI, functionName: "getPlayerPixels",
    args: address ? [address] : undefined,
    query: { refetchInterval: 6000 },
  });
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: USDM_ADDRESS as `0x${string}`, abi: ERC20_ABI, functionName: "allowance",
    args: address ? [address, CHROMACLASH_ADDRESS] : undefined,
  });
  const { data: usdmBalance } = useReadContract({
    address: USDM_ADDRESS as `0x${string}`, abi: ERC20_ABI, functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { refetchInterval: 8000 },
  });

  const last = lastPlaced ? Number(lastPlaced) : 0;
  const freeRemaining = last === 0 ? 0 : Math.max(0, last + 5 * 60 - now);
  const paidRemaining = last === 0 ? 0 : Math.max(0, last + 30 - now);

  async function ensureAllowance(cost: bigint) {
    if (allowance && allowance >= cost) return;
    await writeContractAsync({
      address: USDM_ADDRESS as `0x${string}`, abi: ERC20_ABI, functionName: "approve",
      args: [CHROMACLASH_ADDRESS, APPROVAL_COST], chainId: celo.id,
    });
    await refetchAllowance();
  }

  function setMode(m: Mode) {
    setModeState(m);
    if (m !== "batch") setQueue([]);
  }

  async function paintCell(x: number, y: number) {
    if (!isConnected) return "needs-connect" as const;
    const idx = y * 100 + x;

    if (mode === "batch") {
      if (queue.length >= MAX_BATCH && !queue.some(q => q.i === idx)) {
        showToast(`Batch full — max ${MAX_BATCH}`, "#FF5C5C");
        return;
      }
      setQueue(prev => [...prev.filter(q => q.i !== idx), { i: idx, c: selectedColor }]);
      setOptimistic(prev => new Map(prev).set(idx, selectedColor));
      return;
    }

    if (mode === "free") {
      if (freeRemaining > 0) { showToast("Free cooldown active — try Instant", "#FF5C5C"); return; }
      setSending(true);
      try {
        await writeContractAsync({
          address: CHROMACLASH_ADDRESS, abi: CHROMACLASH_ABI, functionName: "placePixel",
          args: [x, y, selectedColor], chainId: celo.id,
        });
        setOptimistic(prev => new Map(prev).set(idx, selectedColor));
        showToast("Pixel placed — confirming on-chain…", "#FCFF52");
        refetchLastPlaced();
      } catch {
        showToast("Transaction failed or rejected", "#FF5C5C");
      } finally {
        setSending(false);
      }
      return;
    }

    // instant
    if (paidRemaining > 0) { showToast("30s paid cooldown active", "#FF5C5C"); return; }
    if (usdmBalance !== undefined && usdmBalance < PIXEL_COST) { showToast("Not enough USDM", "#FF5C5C"); return; }
    setSending(true);
    try {
      await ensureAllowance(PIXEL_COST);
      await writeContractAsync({
        address: CHROMACLASH_ADDRESS, abi: CHROMACLASH_ABI, functionName: "placePixelPaid",
        args: [x, y, selectedColor], chainId: celo.id,
      });
      setOptimistic(prev => new Map(prev).set(idx, selectedColor));
      showToast("Instant pixel — 0.01 USDM confirmed", "#4ADE80");
      refetchLastPlaced();
    } catch {
      showToast("Transaction failed or rejected", "#FF5C5C");
    } finally {
      setSending(false);
    }
  }

  const payableCount = queue.length - Math.floor(queue.length / 5);
  const batchCost = PIXEL_COST * BigInt(Math.max(0, payableCount));

  async function confirmBatch() {
    if (queue.length === 0) { showToast("Click the canvas to queue pixels first", "#FF5C5C"); return; }
    if (usdmBalance !== undefined && usdmBalance < batchCost) { showToast("Not enough USDM", "#FF5C5C"); return; }
    setSending(true);
    try {
      await ensureAllowance(batchCost);
      const xs = queue.map(q => q.i % 100);
      const ys = queue.map(q => Math.floor(q.i / 100));
      const colors = queue.map(q => q.c);
      await writeContractAsync({
        address: CHROMACLASH_ADDRESS, abi: CHROMACLASH_ABI, functionName: "placePixelBatch",
        args: [xs, ys, colors], chainId: celo.id,
      });
      showToast(`Batch painted — ${(Number(batchCost) / 1e18).toFixed(2)} USDM confirmed`, "#4ADE80");
      setQueue([]);
      refetchLastPlaced();
    } catch {
      showToast("Transaction failed or rejected", "#FF5C5C");
    } finally {
      setSending(false);
    }
  }

  function cancelBatch() {
    setQueue(prev => {
      setOptimistic(o => {
        const next = new Map(o);
        for (const q of prev) next.delete(q.i);
        return next;
      });
      return [];
    });
  }

  return {
    mode, setMode, selectedColor, setSelectedColor,
    queue, cancelBatch, confirmBatch, batchCost,
    optimistic, paintCell, sending,
    myPixels: myPixels ?? 0,
    usdmBalance: usdmBalance ?? 0n,
    freeRemaining, paidRemaining,
    currentEpoch,
  };
}
