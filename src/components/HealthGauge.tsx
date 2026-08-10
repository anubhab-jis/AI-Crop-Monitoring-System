import { useEffect, useState } from "react";

// An SVG ring gauge that animates from 0 to the target score.
export function HealthGauge({
  score,
  label,
  size = 180,
}: {
  score: number;
  label: string;
  size?: number;
}) {
  const [display, setDisplay] = useState(0);
  const stroke = 14;
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const color = score >= 80 ? "#059669" : score >= 60 ? "#d97706" : "#e11d48";

  useEffect(() => {
    const start = display;
    const startTime = performance.now();
    const dur = 900;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - startTime) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(start + (score - start) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score]);

  const offset = circ - (display / 100) * circ;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#eceef2"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: "stroke 0.4s ease" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="font-display text-4xl font-bold tabular-nums text-ink-900" style={{ color }}>
          {display}
        </span>
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-400">/ 100</span>
        <span className="mt-1 text-sm font-semibold" style={{ color }}>
          {label}
        </span>
      </div>
    </div>
  );
}
