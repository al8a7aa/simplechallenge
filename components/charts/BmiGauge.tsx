import type { BmiBand } from "@/lib/health/metrics";

/**
 * Semicircle BMI gauge: four bands (under · normal · over · obese) on a
 * 15–40 scale, with a marker at the person's BMI.
 */

const SCALE = { min: 15, max: 40 };
const BANDS: { from: number; to: number; color: string }[] = [
  { from: 15, to: 18.5, color: "var(--color-muted)" },
  { from: 18.5, to: 25, color: "var(--color-good)" },
  { from: 25, to: 30, color: "var(--color-moderate)" },
  { from: 30, to: 40, color: "var(--color-avoid)" },
];

export const BMI_BAND_LABEL: Record<BmiBand, { text: string; color: string }> = {
  under: { text: "أقل من الطبيعي", color: "text-muted" },
  normal: { text: "وزن طبيعي", color: "text-good" },
  over: { text: "وزن زائد", color: "text-moderate" },
  obese: { text: "سمنة", color: "text-avoid" },
};

const CX = 140;
const CY = 140;
const R = 110;

/** BMI value → point on the arc (left = 15, right = 40). */
function point(bmi: number, radius = R): [number, number] {
  const t = (Math.min(SCALE.max, Math.max(SCALE.min, bmi)) - SCALE.min) / (SCALE.max - SCALE.min);
  const angle = Math.PI * (1 - t); // π (left) → 0 (right)
  return [CX + radius * Math.cos(angle), CY - radius * Math.sin(angle)];
}

function arc(from: number, to: number): string {
  const [x1, y1] = point(from);
  const [x2, y2] = point(to);
  return `M${x1.toFixed(1)} ${y1.toFixed(1)} A${R} ${R} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`;
}

export function BmiGauge({ bmi, band }: { bmi: number; band: BmiBand }) {
  const [mx, my] = point(bmi);
  return (
    <svg viewBox="0 0 280 158" className="mx-auto w-full max-w-[300px]" role="img" aria-label={`مؤشر كتلة الجسم ${bmi}، ${BMI_BAND_LABEL[band].text}`} style={{ direction: "ltr" }}>
      {BANDS.map((b) => (
        <path key={b.from} d={arc(b.from + 0.25, b.to - 0.25)} fill="none" stroke={b.color} strokeWidth={16} strokeLinecap="butt" />
      ))}
      <circle cx={mx} cy={my} r={11} fill="var(--color-ink)" stroke="var(--color-fg)" strokeWidth={4} className="anim-pop" />
      <text x={CX} y={CY - 18} textAnchor="middle" className="font-num" fontSize={46} fontWeight={500} fill="var(--color-fg)">
        {bmi}
      </text>
      <text x={point(15)[0]} y={156} textAnchor="middle" className="font-num" fontSize={12} fill="var(--color-muted)">15</text>
      <text x={point(40)[0]} y={156} textAnchor="middle" className="font-num" fontSize={12} fill="var(--color-muted)">40</text>
    </svg>
  );
}
