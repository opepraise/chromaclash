"use client";

import Modal from "./Modal";

const STEPS = [
  { n: "1", color: "#94E044", title: "Pick a color, click a pixel", body: "Completely free — no wallet balance needed. Just a 5-second cooldown between pixels." },
  { n: "2", color: "#00D3DD", title: "Steal territory", body: "Painting over an opponent's pixel claims it for you. They can steal it right back — hold your ground." },
  { n: "3", color: "#CF6EE4", title: "Win the epoch", body: "After 7 days, whoever owns the most pixels tops the leaderboard. Canvas wipes, new war begins." },
];

export default function HowToModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal onClose={onClose} maxWidth={460}>
      <div className="font-display mb-4 text-sm">HOW TO PLAY</div>
      <div className="flex flex-col gap-3.5">
        {STEPS.map(s => (
          <div key={s.n} className="flex items-start gap-3">
            <span
              className="font-display flex h-[26px] w-[26px] flex-shrink-0 items-center justify-center text-[11px]"
              style={{ background: s.color, color: "#14161F" }}
            >
              {s.n}
            </span>
            <div>
              <div className="text-sm font-bold">{s.title}</div>
              <div className="text-[13px] leading-relaxed" style={{ color: "var(--muted)" }}>{s.body}</div>
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={onClose}
        className="font-display mt-5 h-11 w-full rounded-xl text-xs"
        style={{ background: "var(--accent)", color: "var(--accent-ink)" }}
      >
        GOT IT — LET ME PAINT
      </button>
    </Modal>
  );
}
