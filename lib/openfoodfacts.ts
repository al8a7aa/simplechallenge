import "server-only";

import type { NewProductRow } from "@/lib/data/mappers";
import type { Allergen, Category } from "@/lib/nutrition/types";

/**
 * Looks up a barcode in Open Food Facts (free, open database, no key) and
 * maps it to our product row. Returns null when the product is unknown or
 * has no nutrition data.
 * API docs: https://openfoodfacts.github.io/openfoodfacts-server/api/
 */

const FIELDS = [
  "code",
  "product_name",
  "product_name_ar",
  "product_name_en",
  "brands",
  "image_front_small_url",
  "categories_tags",
  "nutriments",
  "ingredients_text_ar",
  "ingredients_text",
  "allergens_tags",
  "additives_tags",
  "labels_tags",
  "ingredients_analysis_tags",
  "product_quantity",
].join(",");

interface OffProduct {
  product_name?: string;
  product_name_ar?: string;
  product_name_en?: string;
  brands?: string;
  image_front_small_url?: string;
  categories_tags?: string[];
  nutriments?: Record<string, number | string | undefined>;
  ingredients_text_ar?: string;
  ingredients_text?: string;
  allergens_tags?: string[];
  additives_tags?: string[];
  labels_tags?: string[];
  ingredients_analysis_tags?: string[];
  product_quantity?: number | string;
}

export async function lookupBarcode(barcode: string): Promise<NewProductRow | null> {
  const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json?fields=${FIELDS}`, {
    headers: { "User-Agent": "Ikhtiyari/0.1 (nutrition app)" },
    next: { revalidate: 60 * 60 * 24 },
  });
  if (!res.ok) return null;
  const body = (await res.json()) as { status: number; product?: OffProduct };
  const p = body.product;
  if (body.status !== 1 || !p?.nutriments) return null;

  const n = p.nutriments;
  const get = (key: string): number | null => {
    const v = n[`${key}_100g`];
    const num = typeof v === "string" ? Number(v) : v;
    return typeof num === "number" && Number.isFinite(num) ? num : null;
  };
  const sodium = get("sodium");
  const tags = p.categories_tags ?? [];
  const analysis = p.ingredients_analysis_tags ?? [];
  const category = mapCategory(tags);

  return {
    barcode,
    kind: "packaged",
    name_ar: p.product_name_ar || p.product_name || p.product_name_en || barcode,
    name_en: p.product_name_en || p.product_name || null,
    brand: p.brands?.split(",")[0]?.trim() || null,
    image_url: p.image_front_small_url ?? null,
    category,
    is_drink: category === "drinks" || tags.includes("en:beverages"),
    portion_g: p.product_quantity ? Number(p.product_quantity) || null : null,
    energy_kcal: get("energy-kcal"),
    sugar_g: get("sugars"),
    fat_g: get("fat"),
    sat_fat_g: get("saturated-fat"),
    salt_g: get("salt") ?? (sodium !== null ? sodium * 2.5 : null),
    fiber_g: get("fiber"),
    protein_g: get("proteins"),
    carbs_g: get("carbohydrates"),
    ingredients_text: p.ingredients_text_ar || p.ingredients_text || null,
    allergens: mapAllergens(p.allergens_tags ?? []),
    additives: (p.additives_tags ?? []).map((t) => t.replace(/^en:/, "").toLowerCase()),
    is_halal: (p.labels_tags ?? []).includes("en:halal") ? true : null,
    has_animal_ingredients: analysis.includes("en:non-vegetarian") ? true : analysis.includes("en:vegetarian") ? false : null,
    has_animal_products: analysis.includes("en:non-vegan") ? true : analysis.includes("en:vegan") ? false : null,
    source: "openfoodfacts",
    confidence: null,
  };
}

/** First matching rule wins, so more specific categories come first. */
const CATEGORY_RULES: [string, Category][] = [
  ["en:beverages", "drinks"],
  ["en:dairies", "dairy"],
  ["en:breakfast-cereals", "cereals"],
  ["en:chocolates", "sweets"],
  ["en:biscuits", "sweets"],
  ["en:confectioneries", "sweets"],
  ["en:sweet-snacks", "sweets"],
  ["en:salty-snacks", "snacks"],
  ["en:snacks", "snacks"],
  ["en:breads", "bakery"],
  ["en:pastries", "bakery"],
  ["en:meals", "meals"],
  ["en:meats", "meat_fish"],
  ["en:fishes", "meat_fish"],
  ["en:sauces", "sauces_spreads"],
  ["en:spreads", "sauces_spreads"],
  ["en:fruits", "fruits_vegetables"],
  ["en:vegetables", "fruits_vegetables"],
];

function mapCategory(tags: string[]): Category {
  return CATEGORY_RULES.find(([tag]) => tags.includes(tag))?.[1] ?? "other";
}

const ALLERGEN_TAGS: Record<string, Allergen> = {
  "en:gluten": "gluten",
  "en:milk": "milk",
  "en:eggs": "eggs",
  "en:nuts": "nuts",
  "en:peanuts": "peanuts",
  "en:soybeans": "soy",
  "en:fish": "fish",
  "en:crustaceans": "shellfish",
  "en:molluscs": "shellfish",
  "en:sesame-seeds": "sesame",
};

function mapAllergens(tags: string[]): Allergen[] {
  return [...new Set(tags.map((t) => ALLERGEN_TAGS[t]).filter((a): a is Allergen => Boolean(a)))];
}
