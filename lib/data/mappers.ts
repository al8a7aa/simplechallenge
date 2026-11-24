/**
 * Converts between database rows (snake_case) and domain objects (camelCase).
 * Keeping this in one place means pages never touch raw column names.
 */

import type {
  Allergen,
  Category,
  Condition,
  DietPref,
  FoodItem,
  Goal,
  HealthProfile,
  Reason,
  Verdict,
} from "@/lib/nutrition/types";

export interface ProductRow {
  id: string;
  barcode: string | null;
  kind: "packaged" | "meal";
  name_ar: string;
  name_en: string | null;
  brand: string | null;
  image_url: string | null;
  category: Category;
  is_drink: boolean;
  portion_g: number | null;
  energy_kcal: number | null;
  sugar_g: number | null;
  fat_g: number | null;
  sat_fat_g: number | null;
  salt_g: number | null;
  fiber_g: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  ingredients_text: string | null;
  allergens: Allergen[];
  additives: string[];
  is_halal: boolean | null;
  has_animal_ingredients: boolean | null;
  has_animal_products: boolean | null;
  source: "openfoodfacts" | "photo" | "seed" | "manual";
  confidence: "high" | "medium" | "low" | null;
}

/** A product row as it is inserted (id and timestamps come from the DB). */
export type NewProductRow = Omit<ProductRow, "id">;

export interface ProfileRow {
  user_id: string;
  full_name: string;
  birth_year: number | null;
  sex: "male" | "female" | null;
  height_cm: number | null;
  weight_kg: number | null;
  goal: Goal;
  conditions: Condition[];
  allergies: Allergen[];
  diet_prefs: DietPref[];
  max_avoid_per_week: number;
}

export interface ScanRow {
  id: string;
  product_id: string;
  method: "photo" | "barcode" | "search";
  score: number;
  verdict: Verdict;
  reasons: Reason[];
  alternative_product_id: string | null;
  chose_alternative: boolean;
  created_at: string;
}

export function toFoodItem(p: ProductRow): FoodItem {
  return {
    category: p.category,
    isDrink: p.is_drink,
    nutrition: {
      energyKcal: num(p.energy_kcal),
      sugarG: num(p.sugar_g),
      fatG: num(p.fat_g),
      satFatG: num(p.sat_fat_g),
      saltG: num(p.salt_g),
      fiberG: num(p.fiber_g),
      proteinG: num(p.protein_g),
      carbsG: num(p.carbs_g),
    },
    allergens: p.allergens ?? [],
    additives: p.additives ?? [],
    isHalal: p.is_halal,
    hasAnimalIngredients: p.has_animal_ingredients,
    hasAnimalProducts: p.has_animal_products,
  };
}

export function toHealthProfile(p: ProfileRow): HealthProfile {
  return { conditions: p.conditions, allergies: p.allergies, dietPrefs: p.diet_prefs, goal: p.goal };
}

/** Postgres `numeric` arrives as a string from PostgREST; normalize it. */
function num(v: number | string | null): number | null {
  if (v === null || v === undefined) return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}
