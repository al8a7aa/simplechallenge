import { verdictFor } from "@/lib/nutrition/scoring";

const RING_COLOR = { good: "var(--color-good)", moderate: "var(--color-moderate)", avoid: "var(--color-avoid)" };

/**
 * Circular 0–100 score. The arc fills on mount (anim-ring, 800ms).
 * The circle uses pathLength="100" so the CSS can work in percent.
 */
export function ScoreRing({ score, size = 128, label }: { score: number; size?: number; label?: string }) {
  const stroke = size * 0.094;
  const r = (size - stroke) / 2;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${label ?? "النتيجة"} ${score} من 100`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-charcoal)" strokeWidth={stroke} />
        <circle
          className="anim-ring"
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={RING_COLOR[verdictFor(score)]}
          strokeWidth={stroke}
          strokeLinecap="round"
          pathLength={100}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ ["--value" as string]: score }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center" aria-hidden>
        <span className="font-semibold leading-none" style={{ fontSize: size * 0.31 }}>
          {score}
        </span>
        {size >= 110 && <span className="text-sm text-muted">من 100</span>}
      </div>
    </div>
  );
}
