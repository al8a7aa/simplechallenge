/**
 * Personal health numbers for the "صحتي" (My health) page.
 * Pure functions — no I/O — with tests in metrics.test.ts.
 *
 * Sources for the formulas and limits:
 *   BMI bands ................ WHO adult classification
 *   Resting energy (BMR) ..... Mifflin–St Jeor equation
 *   Activity multipliers ..... standard TDEE factors (1.2 – 1.9)
 *   Free sugar ............... WHO: <10% of energy, ideally <5%
 *   Salt ..................... WHO: <5 g/day; AHA ideal 1.5 g sodium (3.75 g salt)
 *   Saturated fat ............ WHO <10% of energy; AHA 6% for heart risk
 *   Fiber .................... 14 g per 1000 kcal (US Dietary Guidelines)
 *   Protein .................. 0.8 g/kg (RDA); 1.6 g/kg for muscle gain
 *
 * These are general guidance values, not a prescription.
 */

import type { ActivityLevel, Condition, Goal } from "@/lib/nutrition/types";

export interface BodyInput {
  birthYear: number;
  sex: "male" | "female";
  heightCm: number;
  weightKg: number;
  activity: ActivityLevel;
  goal: Goal;
  conditions: Condition[];
}

export type BmiBand = "under" | "normal" | "over" | "obese";

export interface HealthMetrics {
  age: number;
  bmi: number;
  bmiBand: BmiBand;
  /** Resting energy, kcal/day. */
  bmr: number;
  /** Energy burned with activity, kcal/day. */
  tdee: number;
  /** Suggested intake for the goal, kcal/day. */
  calorieTarget: number;
  limits: {
    /** Maximum free sugar, g/day. */
    sugarG: number;
    /** Maximum salt, g/day. */
    saltG: number;
    /** Maximum saturated fat, g/day. */
    satFatG: number;
    /** Minimum fiber, g/day. */
    fiberG: number;
    /** Protein to aim for, g/day. */
    proteinG: number;
    /** Water to aim for, ml/day. */
    waterMl: number;
  };
  /** Which limits were tightened, and why (for the notes under each number). */
  stricter: { sugar: boolean; salt: boolean; satFat: boolean };
}

const ACTIVITY_FACTOR: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export function bmiBand(bmi: number): BmiBand {
  if (bmi < 18.5) return "under";
  if (bmi < 25) return "normal";
  if (bmi < 30) return "over";
  return "obese";
}

export function computeMetrics(input: BodyInput, now = new Date()): HealthMetrics {
  const has = (c: Condition) => input.conditions.includes(c);
  const age = now.getFullYear() - input.birthYear;

  const heightM = input.heightCm / 100;
  const bmi = round1(input.weightKg / (heightM * heightM));

  // Mifflin–St Jeor: 10·kg + 6.25·cm − 5·age + (5 for men, −161 for women)
  const bmr = Math.round(10 * input.weightKg + 6.25 * input.heightCm - 5 * age + (input.sex === "male" ? 5 : -161));
  const tdee = Math.round(bmr * ACTIVITY_FACTOR[input.activity]);

  let calorieTarget = tdee;
  if (has("pregnancy")) {
    calorieTarget = tdee + 300; // never a deficit while pregnant or breastfeeding
  } else if (input.goal === "lose_weight") {
    const floor = input.sex === "male" ? 1500 : 1200;
    calorieTarget = Math.max(floor, tdee - 500);
  } else if (input.goal === "gain_muscle") {
    calorieTarget = tdee + 300;
  }
  calorieTarget = Math.round(calorieTarget / 10) * 10;

  const stricter = {
    sugar: has("diabetes") || has("prediabetes") || has("pcos") || has("fatty_liver"),
    salt: has("hypertension") || has("kidney") || has("heart"),
    satFat: has("high_cholesterol") || has("heart") || has("fatty_liver"),
  };

  // 1 g sugar = 4 kcal, 1 g fat = 9 kcal.
  const sugarShare = stricter.sugar ? 0.05 : 0.1;
  const satFatShare = stricter.satFat ? 0.06 : 0.1;

  let proteinPerKg = 0.8;
  if (input.goal === "gain_muscle") proteinPerKg = 1.6;
  if (has("pregnancy")) proteinPerKg = 1.1;
  if (has("kidney")) proteinPerKg = Math.min(proteinPerKg, 0.8); // kidney disease: don't go above the RDA

  return {
    age,
    bmi,
    bmiBand: bmiBand(bmi),
    bmr,
    tdee,
    calorieTarget,
    limits: {
      sugarG: Math.round((calorieTarget * sugarShare) / 4),
      saltG: stricter.salt ? 3.75 : 5,
      satFatG: Math.round((calorieTarget * satFatShare) / 9),
      fiberG: Math.max(25, Math.round((calorieTarget / 1000) * 14)),
      proteinG: Math.round(input.weightKg * proteinPerKg),
      waterMl: Math.round((input.weightKg * 35) / 50) * 50,
    },
    stricter,
  };
}

/** Healthy weight range for a height (BMI 18.5–24.9). */
export function healthyWeightRange(heightCm: number): [number, number] {
  const m2 = (heightCm / 100) ** 2;
  return [Math.round(18.5 * m2), Math.round(24.9 * m2)];
}

const round1 = (v: number) => Math.round(v * 10) / 10;
