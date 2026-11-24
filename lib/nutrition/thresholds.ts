import type { Level } from "./types";

/**
 * Front-of-pack "traffic light" thresholds per 100 g of solid food,
 * from the UK Food Standards Agency guidance. Drinks use half of each value
 * (the FSA rule for per-100 ml).
 *
 *               low (≤)   high (>)
 *   sugar        5 g       22.5 g
 *   fat          3 g       17.5 g
 *   saturates    1.5 g     5 g
 *   salt         0.3 g     1.5 g
 */
export const THRESHOLDS = {
  sugar: { low: 5, high: 22.5 },
  fat: { low: 3, high: 17.5 },
  satFat: { low: 1.5, high: 5 },
  salt: { low: 0.3, high: 1.5 },
} as const;

export type Nutrient = keyof typeof THRESHOLDS;

/** Returns the traffic-light level, or `null` when the value is unknown. */
export function levelOf(nutrient: Nutrient, value: number | null, isDrink: boolean): Level | null {
  if (value === null || Number.isNaN(value)) return null;
  const factor = isDrink ? 0.5 : 1;
  const { low, high } = THRESHOLDS[nutrient];
  if (value <= low * factor) return "low";
  if (value > high * factor) return "high";
  return "medium";
}
