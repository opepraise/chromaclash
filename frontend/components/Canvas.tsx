"use client";

import { useEffect, useRef, useState } from "react";
import { PALETTE } from "@/lib/contracts";
import { useTheme } from "@/lib/theme";

const SIZE = 100;
const CELL = 6;

type PixelMap = Map<number, { colorIdx: number; owner: `0x${string}` }>;

export default function Canvas({
  pixels, optimistic, queue, onCellClick, paintedCount,
}: {
  pixels: PixelMap;
  optimistic: Map<number, number>;
  queue: Array<{ i: number; c: number }>;
  onCellClick: (x: number, y: number) => void;
  paintedCount: number;
}) {
  const { theme } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const coordRef = useRef<HTMLSpanElement>(null);
  const hoverIdx = useRef(-1);
  const flashes = useRef<Array<{ i: number; t0: number }>>([]);
  const flashLoop = useRef<number | null>(null);
  const prevOptimistic = useRef<Map<number, number>>(new Map());
  const [, forceTick] = useState(0);

  const emptyColor = theme === "light" ? "#FCFBF4" : "#11141D";
  const gridLineColor = theme === "light" ? "rgba(0,0,0,0.07)" : "rgba(255,255,255,0.05)";

  function colorAt(idx: number): string {
    const opt = optimistic.get(idx);
    if (opt !== undefined) return PALETTE[opt];
    const p = pixels.get(idx);
    return p ? PALETTE[p.colorIdx] : emptyColor;
  }

  function draw() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = emptyColor;
    ctx.fillRect(0, 0, SIZE * CELL, SIZE * CELL);
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const idx = y * SIZE + x;
        const color = colorAt(idx);
        if (color === emptyColor) continue;
        ctx.fillStyle = color;
        ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
      }
    }

    ctx.strokeStyle = gridLineColor;
    ctx.lineWidth = 1;
    for (let g = 0; g <= SIZE; g += 10) {
      ctx.beginPath(); ctx.moveTo(g * CELL + 0.5, 0); ctx.lineTo(g * CELL + 0.5, SIZE * CELL); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, g * CELL + 0.5); ctx.lineTo(SIZE * CELL, g * CELL + 0.5); ctx.stroke();
    }

    for (const q of queue) {
      const x = q.i % SIZE, y = Math.floor(q.i / SIZE);
      ctx.strokeStyle = "#FCFF52"; ctx.lineWidth = 2;
      ctx.strokeRect(x * CELL + 1, y * CELL + 1, CELL - 2, CELL - 2);
      ctx.fillStyle = PALETTE[q.c] + "AA";
      ctx.fillRect(x * CELL + 1, y * CELL + 1, CELL - 2, CELL - 2);
    }

    const nowT = performance.now();
    for (const f of flashes.current) {
      const age = (nowT - f.t0) / 500;
      const x = (f.i % SIZE) * CELL + CELL / 2, y = Math.floor(f.i / SIZE) * CELL + CELL / 2;
      const r = CELL / 2 + age * 14;
      ctx.globalAlpha = Math.max(0, 1 - age);
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 2;
      ctx.strokeRect(x - r, y - r, r * 2, r * 2);
      ctx.globalAlpha = 1;
    }

    if (hoverIdx.current >= 0) {
      const x = hoverIdx.current % SIZE, y = Math.floor(hoverIdx.current / SIZE);
      ctx.strokeStyle = theme === "light" ? "#16181F" : "#FFFFFF";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x * CELL + 0.75, y * CELL + 0.75, CELL - 1.5, CELL - 1.5);
    }
  }

  // Fire a flash ring for any newly-optimistic cell (i.e. a pixel this client just placed).
  useEffect(() => {
    for (const idx of optimistic.keys()) {
      if (!prevOptimistic.current.has(idx)) {
        flashes.current.push({ i: idx, t0: performance.now() });
      }
    }
    prevOptimistic.current = optimistic;
    if (flashLoop.current === null) {
      const loop = () => {
        const now = performance.now();
        flashes.current = flashes.current.filter(f => now - f.t0 < 500);
        draw();
        if (flashes.current.length > 0) {
          flashLoop.current = requestAnimationFrame(loop);
        } else {
          flashLoop.current = null;
        }
      };
      flashLoop.current = requestAnimationFrame(loop);
    }
  }, [optimistic]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { draw(); }); // redraw on every render (pixels/queue/theme change)

  function idxFromEvent(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return -1;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / rect.width * SIZE);
    const y = Math.floor((e.clientY - rect.top) / rect.height * SIZE);
    if (x < 0 || x > 99 || y < 0 || y > 99) return -1;
    return y * SIZE + x;
  }

  return (
    <div>
      <div className="rounded-2xl border p-3" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
        <canvas
          ref={canvasRef}
          width={SIZE * CELL}
          height={SIZE * CELL}
          onClick={(e) => {
            const idx = idxFromEvent(e);
            if (idx < 0) return;
            onCellClick(idx % SIZE, Math.floor(idx / SIZE));
          }}
          onMouseMove={(e) => {
            const idx = idxFromEvent(e);
            if (idx !== hoverIdx.current) {
              hoverIdx.current = idx;
              forceTick(t => t + 1);
              if (coordRef.current) {
                const p = idx >= 0 ? pixels.get(idx) : undefined;
                coordRef.current.textContent = idx < 0 ? "hover the canvas" :
                  `(${idx % SIZE},${Math.floor(idx / SIZE)}) · ${p ? `owned by ${p.owner.slice(0, 6)}…${p.owner.slice(-4)}` : "unclaimed"}`;
              }
            }
          }}
          onMouseLeave={() => {
            hoverIdx.current = -1;
            forceTick(t => t + 1);
            if (coordRef.current) coordRef.current.textContent = "hover the canvas";
          }}
          style={{ width: "100%", display: "block", aspectRatio: "1", imageRendering: "pixelated", cursor: "crosshair", borderRadius: 6 }}
        />
        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 px-1 text-xs" style={{ color: "var(--muted)" }}>
          <span ref={coordRef} className="font-display text-[11px]">hover the canvas</span>
          <span>{paintedCount.toLocaleString()} / 10,000 pixels claimed</span>
        </div>
      </div>
    </div>
  );
}
