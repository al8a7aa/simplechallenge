/**
 * Personal scoring engine.
 *
 * `scoreFood(item, profile)` answers the app's one question:
 * "Is this food right for THIS person?" It is a pure function (no I/O),
 * so it runs the same on the server, in tests and in the browser.
 *
 * The algorithm, in order:
 *   1. Hard stops  — allergens, gluten for celiac, halal, vegetarian/vegan.
 *                    Any hit → verdict "avoid", score capped at 10.
 *   2. Levels      — sugar / fat / saturates / salt → low | medium | high
 *                    (see thresholds.ts).
 *   3. Points      — start at 100, subtract for high/medium nutrients and
 *                    flagged additives, add for fiber and protein.
 *   4. Personal    — penalties are multiplied for the person's conditions
 *                    (e.g. sugar ×2 for diabetes, salt ×2 for hypertension).
 *   5. Verdict     — ≥70 good · 40–69 moderate · <40 avoid.
 *                    With no nutrition data at all (an ingredients-only
 *                    photo) the verdict is at best "moderate".
 *
 * This is general guidance, not medical advice (shown in the UI).
 */

import { isFlaggedAdditive } from "./additives";
import { levelOf, type Nutrient } from "./thresholds";
import type { FoodItem, HealthProfile, Level, Reason, ScoreResult, Verdict } from "./types";

/** Base penalty per traffic-light level, before personal multipliers. */
const PENALTY: Record<Level, number> = { high: 20, medium: 8, low: 0 };

const HARD_STOP_CAP = 10;
const ADDITIVE_PENALTY = 3;
const ADDITIVE_PENALTY_MAX = 12;
const ULTRA_PROCESSED_ADDITIVE_COUNT = 5;

export const VERDICT_THRESHOLDS = { good: 70, moderate: 40 } as const;

export function verdictFor(score: number): Verdict {
  if (score >= VERDICT_THRESHOLDS.good) return "good";
  if (score >= VERDICT_THRESHOLDS.moderate) return "moderate";
  return "avoid";
}

export function scoreFood(item: FoodItem, profile: HealthProfile): ScoreResult {
  const n = item.nutrition;
  const has = (c: HealthProfile["conditions"][number]) => profile.conditions.includes(c);
  const reasons: Reason[] = [];

  const levels = {
    sugar: levelOf("sugar", n.sugarG, item.isDrink),
    fat: levelOf("fat", n.fatG, item.isDrink),
    satFat: levelOf("satFat", n.satFatG, item.isDrink),
    salt: levelOf("salt", n.saltG, item.isDrink),
  };

  // ── 1. Hard stops ────────────────────────────────────────────────────────
  const hardStops = findHardStops(item, profile);
  reasons.push(...hardStops);

  // ── 2–4. Points with personal multipliers ────────────────────────────────
  let score = 100;

  /**
   * Applies one nutrient's penalty and records a reason for it.
   * `escalate` treats "medium" as "high" (used for sugar with diabetes).
   */
  const penalize = (
    nutrient: Nutrient,
    value: number | null,
    multiplier: number,
    keys: { high: Reason["key"]; personal?: Reason["key"]; medium?: Reason["key"] },
    escalate = false,
  ) => {
    let level = levels[nutrient];
    if (!level || level === "low") return;
    if (escalate) level = "high";
    const penalty = PENALTY[level] * multiplier;
    score -= penalty;
    const key = level === "high" ? (multiplier > 1 && keys.personal ? keys.personal : keys.high) : keys.medium;
    if (key) reasons.push({ key, value: round1(value), impact: penalty, positive: false });
  };

  // Conditions where blood sugar control matters.
  const sugarSensitive = has("diabetes") || has("prediabetes") || has("pcos") || has("fatty_liver");
  const sugarX = sugarSensitive ? 2 : 1;
  const saltX = has("hypertension") || has("kidney") || has("heart") ? 2 : 1;
  const satFatX = has("high_cholesterol") || has("heart") || has("fatty_liver") ? 2 : 1;

  // For diabetes any sugar above "low" counts as high.
  penalize("sugar", n.sugarG, sugarX, { high: "high_sugar", personal: "high_sugar_diabetes", medium: "medium_sugar" }, has("diabetes"));

  // Lactose intolerance: milk is uncomfortable, not dangerous — a penalty, not a hard stop.
  if (has("lactose_intolerance") && item.allergens.includes("milk") && !profile.allergies.includes("milk")) {
    score -= 25;
    reasons.push({ key: "lactose", impact: 25, positive: false });
  }
  penalize("salt", n.saltG, saltX, { high: "high_salt", personal: "high_salt_condition", medium: "medium_salt" });
  penalize("satFat", n.satFatG, satFatX, { high: "high_sat_fat", personal: "high_sat_fat_condition", medium: "medium_sat_fat" });
  penalize("fat", n.fatG, 1, { high: "high_fat" });

  // Sugary drinks raise blood glucose fastest: an extra penalty for diabetes.
  if (has("diabetes") && item.isDrink && levels.sugar !== null && levels.sugar !== "low") {
    score -= 20;
    reasons.push({ key: "sugary_drink_diabetes", impact: 20, positive: false });
  }

  if (has("diabetes") && n.carbsG !== null && n.carbsG > 50) {
    score -= 10;
    reasons.push({ key: "high_carbs_diabetes", value: round1(n.carbsG), impact: 10, positive: false });
  }

  if (profile.goal === "lose_weight" && n.energyKcal !== null && n.energyKcal > 400) {
    score -= 10;
    reasons.push({ key: "high_energy_weight", value: Math.round(n.energyKcal), impact: 10, positive: false });
  }

  const flagged = item.additives.filter(isFlaggedAdditive);
  if (flagged.length > 0) {
    const penalty = Math.min(flagged.length * ADDITIVE_PENALTY, ADDITIVE_PENALTY_MAX);
    score -= penalty;
    reasons.push({ key: "additives", value: flagged.length, impact: penalty, positive: false });
  }
  if (item.additives.length >= ULTRA_PROCESSED_ADDITIVE_COUNT) {
    score -= 10;
    reasons.push({ key: "ultra_processed", value: item.additives.length, impact: 10, positive: false });
  }

  // Bonuses.
  if (n.fiberG !== null && n.fiberG >= 6) {
    score += 10;
    reasons.push({ key: "high_fiber", value: round1(n.fiberG), impact: 10, positive: true });
  }
  if (n.proteinG !== null && n.proteinG >= 10) {
    score += 5;
    reasons.push({ key: "high_protein", value: round1(n.proteinG), impact: 5, positive: true });
  }
  if (levels.sugar === "low") reasons.push({ key: "low_sugar", value: round1(n.sugarG), impact: 2, positive: true });
  if (levels.salt === "low") reasons.push({ key: "low_salt", value: round1(n.saltG), impact: 1, positive: true });

  score = clamp(Math.round(score), 0, 100);
  if (hardStops.length > 0) score = Math.min(score, HARD_STOP_CAP);

  // Without any nutrition data we can't call a food "good".
  const nutritionKnown = Object.values(levels).some((level) => level !== null);
  if (!nutritionKnown && hardStops.length === 0) {
    score = Math.min(score, VERDICT_THRESHOLDS.good - 1);
    reasons.push({ key: "nutrition_unknown", impact: 5, positive: false });
  }

  return {
    score,
    verdict: hardStops.length > 0 ? "avoid" : verdictFor(score),
    reasons: sortReasons(reasons),
    levels,
  };
}

/** Rules that make a food unsuitable no matter how good its nutrition is. */
function findHardStops(item: FoodItem, profile: HealthProfile): Reason[] {
  const stops: Reason[] = [];
  const hit = (key: Reason["key"]) => stops.push({ key, impact: 1000, positive: false });

  const matchingAllergens = item.allergens.filter((a) => profile.allergies.includes(a));
  if (matchingAllergens.length > 0) hit("allergen");

  if (profile.conditions.includes("celiac") && item.allergens.includes("gluten")) hit("gluten_celiac");
  if (profile.dietPrefs.includes("halal_only") && item.isHalal === false) hit("not_halal");
  if (profile.dietPrefs.includes("vegetarian") && item.hasAnimalIngredients === true) hit("not_vegetarian");
  if (
    profile.dietPrefs.includes("vegan") &&
    (item.hasAnimalIngredients === true || item.hasAnimalProducts === true)
  ) {
    hit("not_vegan");
  }
  return stops;
}

/**
 * Most important first. Negative reasons outrank positive ones of equal
 * impact, so the UI always leads with what matters for safety.
 */
function sortReasons(reasons: Reason[]): Reason[] {
  return [...reasons].sort((a, b) => b.impact - a.impact || Number(a.positive) - Number(b.positive));
}

/**
 * Picks the reasons to show on a result card: up to `max`, but always
 * including the best positive reason when one exists.
 */
export function topReasons(reasons: Reason[], max = 3): Reason[] {
  const negatives = reasons.filter((r) => !r.positive);
  const firstPositive = reasons.find((r) => r.positive);
  const picked = negatives.slice(0, firstPositive ? max - 1 : max);
  if (firstPositive) picked.push(firstPositive);
  return picked;
}

const round1 = (v: number | null) => (v === null ? undefined : Math.round(v * 10) / 10);
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
