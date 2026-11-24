/**
 * Sample data for the public /preview pages and the Motion Lab.
 * One realistic week for one fictional user, so the screens can be shown
 * (and their responsive layout checked) without an account or a database.
 * Never used by the signed-in app.
 */

import type { ProfileRow } from "@/lib/data/mappers";
import type { DaySummary, ScanWithProduct, WeekNutrition, WeekSummary } from "@/lib/data/queries";

export const SAMPLE_PROFILE: ProfileRow = {
  user_id: "demo",
  full_name: "سارة العتيبي",
  birth_year: 1997,
  sex: "female",
  height_cm: 162,
  weight_kg: 68,
  target_weight_kg: 62,
  activity_level: "moderate",
  goal: "lose_weight",
  conditions: ["diabetes"],
  allergies: ["nuts"],
  diet_prefs: ["halal_only"],
  max_avoid_per_week: 4,
};

export const SAMPLE_DAYS: DaySummary[] = [
  { label: "سبت", good: 2, moderate: 1, avoid: 1, score: 71 },
  { label: "أحد", good: 3, moderate: 0, avoid: 0, score: 88 },
  { label: "إثنين", good: 1, moderate: 2, avoid: 1, score: 52 },
  { label: "ثلاثاء", good: 2, moderate: 1, avoid: 0, score: 74 },
  { label: "أربعاء", good: 1, moderate: 1, avoid: 1, score: 61 },
  { label: "خميس", good: 2, moderate: 0, avoid: 0, score: 90 },
  { label: "جمعة", good: 1, moderate: 1, avoid: 0, score: 78 },
];

export const SAMPLE_WEEK: WeekSummary = {
  total: 21,
  good: 12,
  moderate: 6,
  avoid: 3,
  swaps: 4,
  score: 78,
  scoreDelta: 8,
  days: SAMPLE_DAYS,
  topAvoidCategory: "drinks",
};

const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();

function scan(id: string, name: string, category: ScanWithProduct["product"]["category"], verdict: ScanWithProduct["verdict"], score: number, hours: number): ScanWithProduct {
  return {
    id,
    product_id: id,
    method: "photo",
    score,
    verdict,
    reasons: [],
    alternative_product_id: null,
    chose_alternative: false,
    created_at: hoursAgo(hours),
    product: { id, name_ar: name, category, image_url: null, kind: "packaged", is_drink: category === "drinks" },
  };
}

export const SAMPLE_RECENT: ScanWithProduct[] = [
  scan("1", "لبن قليل الدسم", "dairy", "good", 84, 2),
  scan("2", "مشروب غازي، 330 مل", "drinks", "avoid", 18, 26),
  scan("3", "بسكويت بالشوكولاتة", "sweets", "moderate", 52, 31),
  scan("4", "عصير برتقال معلّب، 1 لتر", "drinks", "avoid", 31, 50),
  scan("5", "خبز بر", "bakery", "good", 81, 54),
];

export const SAMPLE_NUTRITION: WeekNutrition = {
  averages: { sugarG: 14.2, saltG: 0.9, satFatG: 3.1, fatG: 9.4, fiberG: 2.4 },
  categories: [
    { category: "drinks", count: 7 },
    { category: "snacks", count: 5 },
    { category: "dairy", count: 4 },
    { category: "sweets", count: 3 },
    { category: "bakery", count: 2 },
  ],
  total: 21,
};
