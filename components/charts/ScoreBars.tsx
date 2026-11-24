/**
 * Daily average score as rounded pill bars; today is solid white, other
 * days are frosted. Days without scans show an empty dashed outline.
 */
export interface DayScore {
  label: string;
  /** Average score that day, or null with no scans. */
  score: number | null;
}

export function ScoreBars({ days, height = 150 }: { days: DayScore[]; height?: number }) {
  const barMax = height - 44; // room for the value and the day label
  return (
    <div
      className="grid grid-cols-7 items-end gap-2"
      style={{ height }}
      role="img"
      aria-label={days.map((d) => `${d.label}: ${d.score ?? "لا فحوصات"}`).join("، ")}
    >
      {days.map((d, i) => {
        const today = i === days.length - 1;
        return (
          <div key={i} className="flex flex-col items-center gap-2" aria-hidden>
            <span className="font-num text-xs text-muted">{d.score ?? "—"}</span>
            {d.score === null ? (
              <div className="w-7 rounded-full border border-dashed border-fg/25" style={{ height: 24 }} />
            ) : (
              <div
                className={`anim-grow-y w-7 max-w-full rounded-full ${today ? "bg-fg" : "bg-fg/20"}`}
                style={{ height: Math.max(12, (d.score / 100) * barMax), ["--delay" as string]: `${i * 40}ms` }}
              />
            )}
            <span className={`text-xs ${today ? "font-semibold text-fg" : "text-muted"}`}>{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}
