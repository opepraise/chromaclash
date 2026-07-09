export default function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" style={{ imageRendering: "pixelated" }}>
      <rect x="2" y="2" width="4" height="4" fill="#E50000" />
      <rect x="2" y="6" width="4" height="4" fill="#E50000" />
      <rect x="2" y="10" width="4" height="4" fill="#E50000" />
      <rect x="6" y="2" width="4" height="4" fill="#E50000" />
      <rect x="10" y="2" width="4" height="4" fill="#E59500" />
      <rect x="14" y="14" width="4" height="4" fill="#0083C7" />
      <rect x="10" y="14" width="4" height="4" fill="#0083C7" />
      <rect x="14" y="10" width="4" height="4" fill="#0083C7" />
      <rect x="6" y="14" width="4" height="4" fill="#02BE01" />
      <rect x="14" y="6" width="4" height="4" fill="#CF6EE4" />
      <rect x="8" y="8" width="4" height="4" fill="#FCFF52" className="animate-blink" />
    </svg>
  );
}

export function Wordmark({ size = "text-[13px]" }: { size?: string }) {
  return (
    <div className={`font-display ${size}`}>
      CHROMA<span style={{ color: "var(--brand)", textShadow: "var(--brand-glow)" }}>CLASH</span>
    </div>
  );
}
