"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePublicClient, useWatchContractEvent } from "wagmi";
import { CHROMACLASH_ADDRESS, CHROMACLASH_ABI, CHROMACLASH_DEPLOY_BLOCK } from "./contracts";

export type FeedItem = {
  key: string;
  placer: `0x${string}`;
  x: number;
  y: number;
  colorIdx: number;
  t: number;
};

const W = 100;

// Rebuilds canvas + leaderboard + live-feed state by replaying PixelPlaced events for the current epoch.
export function useChromaClash(currentEpoch: bigint | undefined) {
  const publicClient = usePublicClient();
  const [pixels, setPixels] = useState<Map<number, { colorIdx: number; owner: `0x${string}` }>>(new Map());
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const loadedEpoch = useRef<bigint | null>(null);
  const seenKeys = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!publicClient || currentEpoch === undefined) return;
    if (loadedEpoch.current === currentEpoch) return;
    loadedEpoch.current = currentEpoch;
    seenKeys.current = new Set();
    let cancelled = false;

    (async () => {
      const logs = await publicClient.getContractEvents({
        address: CHROMACLASH_ADDRESS,
        abi: CHROMACLASH_ABI,
        eventName: "PixelPlaced",
        args: { epoch: currentEpoch },
        fromBlock: CHROMACLASH_DEPLOY_BLOCK,
        toBlock: "latest",
      });
      if (cancelled) return;

      const map = new Map<number, { colorIdx: number; owner: `0x${string}` }>();
      const feedItems: FeedItem[] = [];
      for (const log of logs) {
        const { placer, x, y, colorIdx } = log.args as {
          placer: `0x${string}`; x: number; y: number; colorIdx: number;
        };
        map.set(Number(y) * W + Number(x), { colorIdx: Number(colorIdx), owner: placer });
        const key = `${log.blockNumber ?? 0n}-${log.logIndex ?? 0}`;
        seenKeys.current.add(key);
        feedItems.push({ key, placer, x: Number(x), y: Number(y), colorIdx: Number(colorIdx), t: Date.now() });
      }
      setPixels(map);
      setFeed(feedItems.slice(-8).reverse());
    })();

    return () => { cancelled = true; };
  }, [publicClient, currentEpoch]);

  useWatchContractEvent({
    address: CHROMACLASH_ADDRESS,
    abi: CHROMACLASH_ABI,
    eventName: "PixelPlaced",
    onLogs(logs) {
      const fresh = logs.filter(log => {
        const key = `${log.blockNumber ?? 0n}-${log.logIndex ?? 0}`;
        if (seenKeys.current.has(key)) return false;
        seenKeys.current.add(key);
        return true;
      });
      if (fresh.length === 0) return;

      setPixels(prev => {
        const next = new Map(prev);
        for (const log of fresh) {
          const { x, y, colorIdx, epoch, placer } = log.args as {
            x: number; y: number; colorIdx: number; epoch: bigint; placer: `0x${string}`;
          };
          if (currentEpoch !== undefined && epoch !== currentEpoch) continue;
          next.set(Number(y) * W + Number(x), { colorIdx: Number(colorIdx), owner: placer });
        }
        return next;
      });

      setFeed(prev => {
        const additions = fresh.map(log => {
          const a = log.args as { placer: `0x${string}`; x: number; y: number; colorIdx: number };
          return {
            key: `${log.blockNumber ?? 0n}-${log.logIndex ?? 0}`,
            placer: a.placer, x: Number(a.x), y: Number(a.y), colorIdx: Number(a.colorIdx),
            t: Date.now(),
          };
        }).reverse();
        return [...additions, ...prev].slice(0, 8);
      });
    },
  });

  const counts = useMemo(() => {
    const c = new Map<string, number>();
    for (const { owner } of pixels.values()) c.set(owner, (c.get(owner) ?? 0) + 1);
    return c;
  }, [pixels]);

  return { pixels, feed, counts, paintedCount: pixels.size };
}
