"use client";

export default function Modal({
  onClose, children, maxWidth = 380,
}: {
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: number;
}) {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-5"
      style={{ background: "rgba(5,6,10,0.7)", backdropFilter: "blur(4px)" }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="animate-pop w-full rounded-2xl border p-6"
        style={{ maxWidth, background: "var(--surface)", borderColor: "var(--border2)" }}
      >
        {children}
      </div>
    </div>
  );
}
