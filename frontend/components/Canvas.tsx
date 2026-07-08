"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useAccount, useReadContract, useWriteContract, useWatchContractEvent } from "wagmi";
import { CHROMACLASH_ADDRESS, CHROMACLASH_ABI, ERC20_ABI, USDM_ADDRESS, PALETTE } from "@/lib/contracts";

const W = 100;
const H = 100;
const CELL = 4; // pixels per cell on canvas
const MAX_BATCH = 20; // mirrors MAX_BATCH_SIZE in ChromaClash.sol
const PIXEL_COST = BigInt("10000000000000000"); // 0.01 USDM
const APPROVAL_COST = PIXEL_COST * BigInt(MAX_BATCH) * 5n; // covers several batches so the user isn't re-approving constantly

// Local canvas state — rebuilt from events + user paint
const canvasState = new Uint8Array(W * H); // colorIdx per cell, 0=empty(white)

export default function Canvas() {
  const { address } = useAccount();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedColor, setSelectedColor] = useState(2); // red default
  const [hoveredCell, setHoveredCell] = useState<[number, number] | null>(null);
  const [pendingPixels, setPendingPixels] = useState<Array<[number, number, number]>>([]); // batch buffer

  const contract = CHROMACLASH_ADDRESS;

  const { data: cooldown, refetch: refetchCooldown } = useReadContract({
    address: contract, abi: CHROMACLASH_ABI, functionName: "getPixelCooldown",
    args: address ? [address] : undefined,
    query: { refetchInterval: 5000 },
  });
  const { data: myPixels } = useReadContract({
    address: contract, abi: CHROMACLASH_ABI, functionName: "getPlayerPixels",
    args: address ? [address] : undefined,
    query: { refetchInterval: 10000 },
  });
  const { data: epochData } = useReadContract({ address: contract, abi: CHROMACLASH_ABI, functionName: "currentEpoch" });
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: USDM_ADDRESS as `0x${string}`, abi: ERC20_ABI, functionName: "allowance",
    args: address ? [address, contract] : undefined,
  });

  const { writeContract: place } = useWriteContract();
  const { writeContractAsync } = useWriteContract();
  const [sendingBatch, setSendingBatch] = useState(false);

  // Listen for PixelPlaced events and paint them
  useWatchContractEvent({
    address: contract, abi: CHROMACLASH_ABI, eventName: "PixelPlaced",
    onLogs(logs) {
      for (const log of logs) {
        const { x, y, colorIdx } = log.args as { x: number; y: number; colorIdx: number };
        if (x !== undefined && y !== undefined && colorIdx !== undefined) {
          canvasState[y * W + x] = colorIdx;
          drawCell(x, y, colorIdx);
        }
      }
    },
  });

  function drawCell(x: number, y: number, colorIdx: number) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = colorIdx === 0 ? "#1f2937" : PALETTE[colorIdx];
    ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
  }

  function drawAll() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const ci = canvasState[y * W + x];
        ctx.fillStyle = ci === 0 ? "#1f2937" : PALETTE[ci];
        ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
      }
    }
  }

  useEffect(() => { drawAll(); }, []);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = Math.floor((e.clientX - rect.left) * scaleX / CELL);
    const y = Math.floor((e.clientY - rect.top) * scaleY / CELL);
    if (x < 0 || x >= W || y < 0 || y >= H) return;

    const cd = cooldown ? Number(cooldown) : 0;
    if (cd > 0) {
      // Add to batch
      setPendingPixels(prev => {
        const updated = [...prev.filter(([px, py]) => !(px === x && py === y)), [x, y, selectedColor]];
        return updated.slice(-MAX_BATCH);
      });
      // Optimistic paint
      canvasState[y * W + x] = selectedColor;
      drawCell(x, y, selectedColor);
      return;
    }

    // Place free pixel
    place({ address: contract, abi: CHROMACLASH_ABI, functionName: "placePixel", args: [x, y, selectedColor] });
    canvasState[y * W + x] = selectedColor;
    drawCell(x, y, selectedColor);
    setTimeout(() => refetchCooldown(), 2000);
  }, [cooldown, selectedColor, contract, place, refetchCooldown]);

  // Cost has a discount: every 5th pixel in the batch is free.
  const batchCost = PIXEL_COST * BigInt(pendingPixels.length - Math.floor(pendingPixels.length / 5));

  async function sendBatch() {
    if (pendingPixels.length === 0 || sendingBatch) return;
    setSendingBatch(true);
    try {
      if (!allowance || allowance < batchCost) {
        await writeContractAsync({
          address: USDM_ADDRESS as `0x${string}`, abi: ERC20_ABI, functionName: "approve",
          args: [contract, APPROVAL_COST],
        });
        await refetchAllowance();
      }

      const xs = pendingPixels.map(([x]) => x);
      const ys = pendingPixels.map(([, y]) => y);
      const colors = pendingPixels.map(([, , c]) => c);
      await writeContractAsync({
        address: contract, abi: CHROMACLASH_ABI, functionName: "placePixelBatch",
        args: [xs, ys, colors],
      });

      setPendingPixels([]);
      refetchCooldown();
    } finally {
      setSendingBatch(false);
    }
  }

  const cdSecs = cooldown ? Number(cooldown) : 0;
  const cdMin = Math.floor(cdSecs / 60);
  const cdSec = cdSecs % 60;

  return (
    <div className="space-y-3">
      {/* Status bar */}
      <div className="flex gap-3">
        <div className="flex-1 bg-gray-900 rounded-xl p-3 text-center">
          <p className="text-xs text-gray-500">Your pixels</p>
          <p className="text-xl font-bold text-pink-400">{myPixels?.toString() ?? "0"}</p>
        </div>
        <div className="flex-1 bg-gray-900 rounded-xl p-3 text-center">
          <p className="text-xs text-gray-500">Cooldown</p>
          <p className={`text-xl font-bold ${cdSecs > 0 ? "text-yellow-400" : "text-green-400"}`}>
            {cdSecs > 0 ? `${cdMin}:${String(cdSec).padStart(2, "0")}` : "Ready"}
          </p>
        </div>
        <div className="flex-1 bg-gray-900 rounded-xl p-3 text-center">
          <p className="text-xs text-gray-500">Epoch</p>
          <p className="text-xl font-bold text-gray-300">#{epochData?.toString() ?? "0"}</p>
        </div>
      </div>

      {/* Color palette */}
      <div className="bg-gray-900 rounded-xl p-3">
        <p className="text-xs text-gray-500 mb-2">Color</p>
        <div className="grid grid-cols-8 gap-1.5">
          {PALETTE.map((color, i) => (
            <button key={i} onClick={() => setSelectedColor(i)}
              className={`aspect-square rounded-md border-2 transition-all ${selectedColor === i ? "border-white scale-110" : "border-transparent"}`}
              style={{ backgroundColor: color }} />
          ))}
        </div>
      </div>

      {/* Canvas */}
      <div className="relative rounded-xl overflow-hidden border border-gray-700">
        <canvas
          ref={canvasRef}
          width={W * CELL}
          height={H * CELL}
          onClick={handleCanvasClick}
          onMouseMove={(e) => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            const x = Math.floor((e.clientX - rect.left) * scaleX / CELL);
            const y = Math.floor((e.clientY - rect.top) * scaleY / CELL);
            setHoveredCell([x, y]);
          }}
          style={{ width: "100%", imageRendering: "pixelated", cursor: "crosshair" }}
        />
        {hoveredCell && (
          <div className="absolute bottom-2 right-2 bg-black/60 text-xs text-gray-300 px-2 py-1 rounded">
            ({hoveredCell[0]}, {hoveredCell[1]})
          </div>
        )}
      </div>

      {/* Cooldown info + batch */}
      {cdSecs > 0 && (
        <div className="bg-gray-900 rounded-xl p-3 space-y-2">
          <p className="text-xs text-yellow-400">Cooldown active — click to queue pixels (up to {MAX_BATCH}, every 5th free)</p>
          {pendingPixels.length > 0 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400">{pendingPixels.length} pixel{pendingPixels.length !== 1 ? "s" : ""} queued</p>
              <button onClick={sendBatch} disabled={sendingBatch}
                className="text-xs bg-pink-600 hover:bg-pink-500 disabled:opacity-50 text-white px-3 py-1 rounded-lg">
                {sendingBatch ? "Sending…" : `Send batch (${Number(batchCost) / 1e18} USDM)`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
