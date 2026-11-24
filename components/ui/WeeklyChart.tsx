import type { DaySummary } from "@/lib/data/queries";

/**
 * 7-day stacked bar chart: good (bottom), moderate, avoid (top).
 * Plain divs instead of a chart library: 7 bars don't need one.
 * Bars grow from the baseline in a wave (anim-grow-y with --delay).
 */
export function WeeklyChart({ days, height = 120 }: { days: DaySummary[]; height?: number }) {
  const max = Math.max(4, ...days.map((d) => d.good + d.moderate + d.avoid));
  const unit = (height - 8) / max;
  const total = days.reduce((s, d) => s + d.good + d.moderate + d.avoid, 0);

  if (total === 0) {
    return (
      <p className="flex items-center justify-center rounded-control border border-dashed border-fg/20 text-muted" style={{ height }}>
        ستظهر هنا اختياراتك اليومية بعد أول فحص
      </p>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-7 items-end gap-2" style={{ height }} role="img" aria-label={chartDescription(days)}>
        {days.map((d, i) => (
          <div key={i} className="anim-grow-y mx-auto flex w-6 max-w-full flex-col gap-0.5 sm:w-9" style={{ ["--delay" as string]: `${i * 40}ms` }}>
            <Segment count={d.avoid} unit={unit} color="bg-avoid" />
            <Segment count={d.moderate} unit={unit} color="bg-moderate" />
            <Segment count={d.good} unit={unit} color="bg-good" />
          </div>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-7 gap-2 text-center text-xs text-muted" aria-hidden>
        {days.map((d, i) => (
          <span key={i}>{d.label}</span>
        ))}
      </div>
      <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted">
        <Legend color="bg-good" label="مناسب" />
        <Legend color="bg-moderate" label="باعتدال" />
        <Legend color="bg-avoid" label="تجنّبه" />
      </ul>
    </div>
  );
}

function Segment({ count, unit, color }: { count: number; unit: number; color: string }) {
  if (count === 0) return null;
  return <div className={`${color} rounded`} style={{ height: count * unit - 2 }} />;
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <li className="inline-flex items-center gap-1.5">
      <span className={`size-3 rounded-[3px] ${color}`} aria-hidden />
      {label}
    </li>
  );
}

/** Text alternative for screen readers. */
function chartDescription(days: DaySummary[]): string {
  return days.map((d) => `${d.label}: ${d.good} مناسب، ${d.moderate} باعتدال، ${d.avoid} تجنّبه`).join(". ");
}
