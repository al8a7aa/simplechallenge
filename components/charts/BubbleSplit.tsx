import type { Verdict } from "@/lib/nutrition/types";

/**
 * Verdict split as overlapping bubbles (area ∝ count) plus percentage bars.
 * Bubbles give the feel at a glance; the bars give exact numbers.
 */

const META: Record<Verdict, { label: string; fill: string }> = {
  good: { label: "مناسب", fill: "var(--color-good)" },
  moderate: { label: "باعتدال", fill: "var(--color-moderate)" },
  avoid: { label: "تجنّبه", fill: "var(--color-avoid)" },
};

/** Fixed spots for the three bubbles inside a 320×200 box. */
const SPOTS: Record<Verdict, { x: number; y: number }> = {
  good: { x: 222, y: 98 },
  moderate: { x: 98, y: 72 },
  avoid: { x: 128, y: 158 },
};

export function BubbleSplit({ counts }: { counts: Record<Verdict, number> }) {
  const total = counts.good + counts.moderate + counts.avoid;
  const max = Math.max(1, counts.good, counts.moderate, counts.avoid);
  // Radius scales with √count so the bubble *area* matches the count.
  const radius = (n: number) => (n === 0 ? 0 : 30 + 52 * Math.sqrt(n / max));
  const order: Verdict[] = ["good", "moderate", "avoid"];
  const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0);

  return (
    <div className="flex flex-col gap-5">
      <svg
        viewBox="0 0 320 200"
        className="anim-pop mx-auto w-full max-w-[340px]"
        role="img"
        aria-label={order.map((v) => `${counts[v]} ${META[v].label}`).join("، ")}
        style={{ direction: "ltr" }}
      >
        {order.map((v) => {
          const r = radius(counts[v]);
          if (!r) return null;
          const { x, y } = SPOTS[v];
          return (
            <g key={v}>
              {/* Ink ring separates overlapping bubbles. */}
              <circle cx={x} cy={y} r={r} fill={META[v].fill} stroke="var(--color-ink)" strokeWidth={4} />
              <text x={x} y={y + 4} textAnchor="middle" className="font-num" fontSize={Math.max(18, r * 0.5)} fontWeight={600} fill="var(--color-ink)">
                {counts[v]}
              </text>
              <text x={x} y={y + Math.max(18, r * 0.5) * 0.85} textAnchor="middle" fontSize={13} fontWeight={600} fill="var(--color-ink)">
                {META[v].label}
              </text>
            </g>
          );
        })}
      </svg>

      <ul className="flex flex-col gap-3">
        {order.map((v) => (
          <li key={v} className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between">
              <span className="font-num text-[28px] leading-none">
                {pct(counts[v])}
                <span className="text-sm">%</span>
              </span>
              <span className="text-sm text-muted">{META[v].label}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-fg/10">
              <div className="anim-grow-x h-full rounded-full" style={{ width: `${pct(counts[v])}%`, background: META[v].fill }} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
