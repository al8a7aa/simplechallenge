import { describe, expect, it } from "vitest";
import { bmiBand, computeMetrics, healthyWeightRange, type BodyInput } from "./metrics";

const NOW = new Date(2026, 10, 24);
const sara: BodyInput = {
  birthYear: 1997,
  sex: "female",
  heightCm: 162,
  weightKg: 68,
  activity: "moderate",
  goal: "lose_weight",
  conditions: ["diabetes"],
};

describe("computeMetrics", () => {
  it("computes age, BMI and band", () => {
    const m = computeMetrics(sara, NOW);
    expect(m.age).toBe(29);
    expect(m.bmi).toBe(25.9);
    expect(m.bmiBand).toBe("over");
  });

  it("uses Mifflin–St Jeor and the activity factor", () => {
    const m = computeMetrics(sara, NOW);
    // 10·68 + 6.25·162 − 5·29 − 161 = 1386.5
    expect(m.bmr).toBe(1387);
    expect(m.tdee).toBe(Math.round(1387 * 1.55));
  });

  it("subtracts 500 kcal for weight loss, never below the floor", () => {
    expect(computeMetrics(sara, NOW).calorieTarget).toBe(Math.round((Math.round(1387 * 1.55) - 500) / 10) * 10);
    const small = computeMetrics({ ...sara, heightCm: 150, weightKg: 45, activity: "sedentary" }, NOW);
    expect(small.calorieTarget).toBe(1200);
  });

  it("never sets a deficit during pregnancy", () => {
    const m = computeMetrics({ ...sara, conditions: ["pregnancy"] }, NOW);
    expect(m.calorieTarget).toBeGreaterThan(m.tdee);
  });

  it("halves the sugar limit for diabetes and tightens salt for hypertension", () => {
    const general = computeMetrics({ ...sara, conditions: [] }, NOW);
    const diabetic = computeMetrics(sara, NOW);
    expect(Math.abs(diabetic.limits.sugarG - general.limits.sugarG / 2)).toBeLessThanOrEqual(1); // rounding
    expect(computeMetrics({ ...sara, conditions: ["hypertension"] }, NOW).limits.saltG).toBe(3.75);
    expect(general.limits.saltG).toBe(5);
  });

  it("keeps fiber at 25 g or more", () => {
    expect(computeMetrics(sara, NOW).limits.fiberG).toBeGreaterThanOrEqual(25);
  });
});

describe("helpers", () => {
  it("classifies BMI bands at their edges", () => {
    expect(bmiBand(18.4)).toBe("under");
    expect(bmiBand(18.5)).toBe("normal");
    expect(bmiBand(25)).toBe("over");
    expect(bmiBand(30)).toBe("obese");
  });

  it("returns the healthy weight range for a height", () => {
    expect(healthyWeightRange(162)).toEqual([49, 65]);
  });
});
