/**
 * Bullet-style range bar: low / medium / high zones (traffic-light tints)
 * with a white marker at the value. Used for "what's in your food".
 * The zones are drawn left-to-right in both languages, like a ruler.
 */
export function RangeBar({
  label,
  value,
  low,
  high,
  max,
  unit = "غ",
}: {
  label: string;
  value: number | null;
  /** Upper edge of "low". */
  low: number;
  /** Lower edge of "high". */
  high: number;
  /** End of the scale. */
  max: number;
  unit?: string;
}) {
  const pct = (v: number) => Math.min(100, Math.max(0, (v / max) * 100));
  const level = value === null ? null : value <= low ? "منخفض" : value > high ? "عالٍ" : "متوسط";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <span>{label}</span>
        <span>
          <span className="font-num text-xl">{value ?? "—"}</span>
          <span className="text-sm text-muted"> {unit}</span>
          {level && <span className="ms-2 text-sm text-muted">· {level}</span>}
        </span>
      </div>
      <div className="relative flex h-3 gap-0.5" dir="ltr" aria-hidden>
        <div className="h-full rounded-s-full bg-good/80" style={{ width: `${pct(low)}%` }} />
        <div className="h-full bg-moderate/80" style={{ width: `${pct(high) - pct(low)}%` }} />
        <div className="h-full flex-1 rounded-e-full bg-avoid/80" />
        {value !== null && (
          <div
            className="anim-pop absolute -top-1 h-5 w-1.5 rounded-full bg-fg shadow-[0_0_0_2px_var(--color-ink)]"
            style={{ left: `calc(${pct(value)}% - 3px)` }}
          />
        )}
      </div>
    </div>
  );
}
