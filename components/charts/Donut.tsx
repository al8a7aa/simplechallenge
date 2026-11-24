/**
 * Donut of what the user scanned, by category. Monochrome steps of the
 * brand blues (largest slice brightest) keep color meaning for verdicts.
 * Uses the r=15.915 circle trick: its circumference is 100, so dash
 * lengths are plain percentages.
 */

const SHADES = ["#f3f5f9", "#c3ccda", "#8c99ae", "#5e6b82", "#364156"];

export interface Slice {
  label: string;
  value: number;
}

export function Donut({ slices, centerLabel }: { slices: Slice[]; centerLabel: string }) {
  const total = slices.reduce((s, x) => s + x.value, 0);
  const top = [...slices].sort((a, b) => b.value - a.value).slice(0, SHADES.length);
  let offset = 25; // start at 12 o'clock

  return (
    <div className="flex flex-wrap items-center gap-5">
      <svg viewBox="0 0 42 42" className="size-36 shrink-0" role="img" aria-label={top.map((s) => `${s.label} ${s.value}`).join("، ")}>
        <circle cx="21" cy="21" r="15.915" fill="none" stroke="rgb(243 245 249 / 0.08)" strokeWidth="6" />
        {top.map((s, i) => {
          const pct = (s.value / total) * 100;
          const dash = `${Math.max(0, pct - 0.6)} ${100 - pct + 0.6}`;
          const el = <circle key={s.label} cx="21" cy="21" r="15.915" fill="none" stroke={SHADES[i]} strokeWidth="6" strokeDasharray={dash} strokeDashoffset={offset} />;
          offset -= pct;
          return el;
        })}
        <text x="21" y="22" textAnchor="middle" className="font-num" fontSize="8" fontWeight="500" fill="var(--color-fg)">
          {total}
        </text>
        <text x="21" y="28" textAnchor="middle" fontSize="3.6" fill="var(--color-muted)">
          {centerLabel}
        </text>
      </svg>
      <ul className="flex min-w-0 flex-col gap-1.5 text-sm">
        {top.map((s, i) => (
          <li key={s.label} className="flex items-center gap-2">
            <span className="size-3 shrink-0 rounded-[3px] ring-1 ring-fg/30" style={{ background: SHADES[i] }} aria-hidden />
            {s.label}
            <span className="font-num text-muted">{s.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
