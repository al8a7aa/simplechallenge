/**
 * Shared domain types for food products, health profiles and verdicts.
 *
 * These mirror the Supabase tables in supabase/migrations/0001_init.sql.
 * Nutrition values are always per 100 g (or 100 ml for drinks).
 */

export const CONDITIONS = [
  "diabetes",
  "hypertension",
  "high_cholesterol",
  "celiac",
  "kidney",
  "heart",
  "pregnancy",
] as const;
export type Condition = (typeof CONDITIONS)[number];

export const ALLERGENS = [
  "gluten",
  "milk",
  "eggs",
  "nuts",
  "peanuts",
  "soy",
  "fish",
  "shellfish",
  "sesame",
] as const;
export type Allergen = (typeof ALLERGENS)[number];

export const DIET_PREFS = ["halal_only", "vegetarian", "vegan", "low_carb"] as const;
export type DietPref = (typeof DIET_PREFS)[number];

export const GOALS = ["lose_weight", "maintain", "gain_muscle", "eat_healthier"] as const;
export type Goal = (typeof GOALS)[number];

export const CATEGORIES = [
  "drinks",
  "dairy",
  "bakery",
  "snacks",
  "sweets",
  "cereals",
  "meals",
  "fruits_vegetables",
  "meat_fish",
  "sauces_spreads",
  "other",
] as const;
export type Category = (typeof CATEGORIES)[number];

/** A user's health profile. Drives every verdict. */
export interface HealthProfile {
  conditions: Condition[];
  allergies: Allergen[];
  dietPrefs: DietPref[];
  goal: Goal;
}

/** Nutrition per 100 g / 100 ml. `null` means "unknown", never zero. */
export interface Nutrition {
  energyKcal: number | null;
  sugarG: number | null;
  fatG: number | null;
  satFatG: number | null;
  saltG: number | null;
  fiberG: number | null;
  proteinG: number | null;
  carbsG: number | null;
}

/** Everything the scoring engine needs to know about a product or meal. */
export interface FoodItem {
  category: Category;
  /** Drinks use half the solid-food thresholds. */
  isDrink: boolean;
  nutrition: Nutrition;
  allergens: Allergen[];
  /** E-numbers, lower case, e.g. "e621". */
  additives: string[];
  /** `null` when unknown. */
  isHalal: boolean | null;
  /** Contains meat, fish, gelatin… (for vegetarian/vegan). `null` if unknown. */
  hasAnimalIngredients: boolean | null;
  /** Contains milk, eggs or honey (for vegan). `null` if unknown. */
  hasAnimalProducts: boolean | null;
}

export type Verdict = "good" | "moderate" | "avoid";
export type Level = "low" | "medium" | "high";

/**
 * One reason behind a verdict. `key` maps to a sentence in
 * lib/i18n/reasons.ts; `value` is the number shown in that sentence.
 */
export interface Reason {
  key: ReasonKey;
  value?: number;
  /** Bigger = more important. Used to sort and pick the top 3. */
  impact: number;
  positive: boolean;
}

export type ReasonKey =
  | "allergen"
  | "gluten_celiac"
  | "not_halal"
  | "not_vegetarian"
  | "not_vegan"
  | "high_sugar"
  | "high_sugar_diabetes"
  | "medium_sugar"
  | "high_salt"
  | "high_salt_condition"
  | "medium_salt"
  | "high_fat"
  | "high_sat_fat"
  | "high_sat_fat_condition"
  | "medium_sat_fat"
  | "sugary_drink_diabetes"
  | "high_carbs_diabetes"
  | "high_energy_weight"
  | "additives"
  | "ultra_processed"
  | "high_fiber"
  | "high_protein"
  | "low_sugar"
  | "low_salt";

export interface ScoreResult {
  /** 0–100. Higher is better for this person. */
  score: number;
  verdict: Verdict;
  /** Sorted by impact, most important first. */
  reasons: Reason[];
  levels: Record<"sugar" | "fat" | "satFat" | "salt", Level | null>;
}
