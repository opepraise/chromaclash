"use client";

import { useConnect } from "wagmi";
import Modal from "./Modal";
import { useToast } from "@/lib/toast";

export default function ConnectModal({ onClose }: { onClose: () => void }) {
  const { connectors, connect } = useConnect();
  const { showToast } = useToast();

  return (
    <Modal onClose={onClose}>
      <div className="font-display mb-1.5 text-sm">CONNECT WALLET</div>
      <p className="mb-4 text-[13px]" style={{ color: "var(--muted)" }}>
        Connect to Celo to start claiming pixels. Free players welcome.
      </p>
      <div className="flex flex-col gap-2">
        {connectors.map(c => (
          <button
            key={c.uid}
            onClick={() => {
              connect(
                { connector: c },
                {
                  onSuccess: () => { showToast(`Connected via ${c.name}`, "#4ADE80"); onClose(); },
                  onError: (e) => showToast(e.message.slice(0, 80), "#FF5C5C"),
                },
              );
            }}
            className="flex items-center gap-3 rounded-xl border px-3.5 py-3 text-left text-sm font-semibold"
            style={{ borderColor: "var(--border)", background: "var(--surface2)", color: "var(--text)" }}
          >
            <span
              className="font-display flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-[11px]"
              style={{ background: "var(--accent)", color: "var(--accent-ink)" }}
            >
              {c.name.charAt(0)}
            </span>
            {c.name}
          </button>
        ))}
      </div>
    </Modal>
  );
}
