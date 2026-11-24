/**
 * Arabic UI strings that come from data (verdicts, reasons, categories,
 * profile options). Page copy that appears once lives in the page itself.
 *
 * To add English: copy this file to en.ts with the same keys and pick the
 * dictionary from the user's `profiles.language`.
 *
 * Voice (.ux-profile.md): utilitarian, factual, sentence case, no emoji,
 * no exclamation marks.
 */

import type { Allergen, Category, Condition, DietPref, Goal, Reason, ReasonKey, Verdict } from "@/lib/nutrition/types";

export const verdictLabel: Record<Verdict, string> = {
  good: "مناسب لك",
  moderate: "باعتدال",
  avoid: "تجنّبه",
};

/** Short form for badges and lists. */
export const verdictShort: Record<Verdict, string> = {
  good: "مناسب",
  moderate: "باعتدال",
  avoid: "تجنّبه",
};

/** One-word label for the weekly score ring. */
export function scoreLabel(score: number): string {
  if (score >= 85) return "ممتاز";
  if (score >= 70) return "جيد";
  if (score >= 40) return "متوسط";
  return "يحتاج تحسين";
}

const reasonText: Record<ReasonKey, (v?: number) => string> = {
  allergen: () => "يحتوي على مادة لديك حساسية منها",
  gluten_celiac: () => "يحتوي على الغلوتين، ولديك حساسية القمح (سيلياك)",
  not_halal: () => "يحتوي على مكوّن غير حلال",
  not_vegetarian: () => "يحتوي على لحوم أو مشتقاتها",
  not_vegan: () => "يحتوي على مكوّن من مصدر حيواني",
  high_sugar: (v) => `سكر عالٍ: ${v} غ لكل 100 غ`,
  high_sugar_diabetes: (v) => `سكر ${v} غ لكل 100 غ، ولديك سكري`,
  sugary_drink_diabetes: () => "مشروب محلّى يرفع السكر في الدم بسرعة",
  medium_sugar: (v) => `سكر متوسط: ${v} غ لكل 100 غ`,
  high_salt: (v) => `ملح عالٍ: ${v} غ لكل 100 غ`,
  high_salt_condition: (v) => `ملح ${v} غ لكل 100 غ، وهذا لا يناسب حالتك`,
  medium_salt: (v) => `ملح متوسط: ${v} غ لكل 100 غ`,
  high_fat: (v) => `دهون عالية: ${v} غ لكل 100 غ`,
  high_sat_fat: (v) => `دهون مشبعة عالية: ${v} غ لكل 100 غ`,
  high_sat_fat_condition: (v) => `دهون مشبعة ${v} غ لكل 100 غ، وهذا لا يناسب حالتك`,
  medium_sat_fat: (v) => `دهون مشبعة متوسطة: ${v} غ لكل 100 غ`,
  high_carbs_diabetes: (v) => `كربوهيدرات ${v} غ لكل 100 غ، ولديك سكري`,
  high_energy_weight: (v) => `سعرات عالية: ${v} سعرة لكل 100 غ، وهدفك إنقاص الوزن`,
  additives: (v) => `${v} من المضافات التي يُنصح بالحد منها`,
  ultra_processed: (v) => `منتج عالي المعالجة: ${v} مضافات`,
  high_fiber: (v) => `غني بالألياف: ${v} غ لكل 100 غ`,
  high_protein: (v) => `غني بالبروتين: ${v} غ لكل 100 غ`,
  low_sugar: () => "سكر منخفض",
  low_salt: () => "ملح منخفض",
};

export function reasonSentence(reason: Reason): string {
  return reasonText[reason.key](reason.value);
}

export const categoryLabel: Record<Category, string> = {
  drinks: "مشروبات",
  dairy: "ألبان",
  bakery: "مخبوزات",
  snacks: "سناكات",
  sweets: "حلويات",
  cereals: "حبوب الإفطار",
  meals: "وجبات",
  fruits_vegetables: "فواكه وخضار",
  meat_fish: "لحوم وأسماك",
  sauces_spreads: "صلصات ودهن",
  other: "أخرى",
};

export const conditionLabel: Record<Condition, string> = {
  diabetes: "السكري",
  hypertension: "ضغط الدم المرتفع",
  high_cholesterol: "الكوليسترول",
  celiac: "حساسية القمح (سيلياك)",
  kidney: "أمراض الكلى",
  heart: "أمراض القلب",
  pregnancy: "الحمل",
};

export const allergenLabel: Record<Allergen, string> = {
  gluten: "الغلوتين",
  milk: "الحليب",
  eggs: "البيض",
  nuts: "المكسرات",
  peanuts: "الفول السوداني",
  soy: "الصويا",
  fish: "السمك",
  shellfish: "القشريات",
  sesame: "السمسم",
};

export const dietLabel: Record<DietPref, string> = {
  halal_only: "حلال فقط",
  vegetarian: "نباتي",
  vegan: "نباتي صرف",
  low_carb: "قليل الكربوهيدرات",
};

export const goalLabel: Record<Goal, string> = {
  lose_weight: "إنقاص الوزن",
  maintain: "الحفاظ على الوزن",
  gain_muscle: "بناء العضلات",
  eat_healthier: "أكل صحي أكثر",
};

export const levelLabel = { low: "منخفض", medium: "متوسط", high: "عالٍ" } as const;

/** "اليوم، 9:40 ص" / "أمس، 4:15 م" / "الجمعة، 7:30 م" */
export function formatWhen(iso: string, now = new Date()): string {
  const date = new Date(iso);
  const time = date.toLocaleTimeString("ar", { hour: "numeric", minute: "2-digit", numberingSystem: "latn" });
  const days = Math.floor((startOfDay(now).getTime() - startOfDay(date).getTime()) / 86_400_000);
  if (days === 0) return `اليوم، ${time}`;
  if (days === 1) return `أمس، ${time}`;
  if (days < 7) return `${date.toLocaleDateString("ar", { weekday: "long" })}، ${time}`;
  return date.toLocaleDateString("ar", { day: "numeric", month: "long", numberingSystem: "latn" });
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
