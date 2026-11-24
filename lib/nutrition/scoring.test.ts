import { describe, expect, it } from "vitest";
import { scoreFood, topReasons } from "./scoring";
import type { FoodItem, HealthProfile, Nutrition } from "./types";

const healthy: HealthProfile = { conditions: [], allergies: [], dietPrefs: [], goal: "eat_healthier" };

function food(nutrition: Partial<Nutrition>, extra: Partial<FoodItem> = {}): FoodItem {
  return {
    category: "other",
    isDrink: false,
    allergens: [],
    additives: [],
    isHalal: true,
    hasAnimalIngredients: false,
    hasAnimalProducts: false,
    ...extra,
    nutrition: {
      energyKcal: null,
      sugarG: null,
      fatG: null,
      satFatG: null,
      saltG: null,
      fiberG: null,
      proteinG: null,
      carbsG: null,
      ...nutrition,
    },
  };
}

const water = food({ energyKcal: 0, sugarG: 0, fatG: 0, satFatG: 0, saltG: 0 }, { isDrink: true, category: "drinks" });
const cola = food(
  { energyKcal: 42, sugarG: 10.6, fatG: 0, satFatG: 0, saltG: 0, carbsG: 10.6 },
  { isDrink: true, category: "drinks", additives: ["e150d", "e338"] },
);
const chips = food({ energyKcal: 536, sugarG: 0.5, fatG: 34, satFatG: 3.1, saltG: 1.6, fiberG: 4.4, carbsG: 53 }, { category: "snacks" });

describe("scoreFood", () => {
  it("rates plain water as good", () => {
    const r = scoreFood(water, healthy);
    expect(r.verdict).toBe("good");
    expect(r.score).toBe(100);
  });

  it("stops on an allergen no matter the nutrition", () => {
    const r = scoreFood({ ...water, allergens: ["nuts"] }, { ...healthy, allergies: ["nuts"] });
    expect(r.verdict).toBe("avoid");
    expect(r.score).toBeLessThanOrEqual(10);
    expect(r.reasons[0].key).toBe("allergen");
  });

  it("stops on gluten for celiac", () => {
    const r = scoreFood({ ...water, allergens: ["gluten"] }, { ...healthy, conditions: ["celiac"] });
    expect(r.verdict).toBe("avoid");
    expect(r.reasons[0].key).toBe("gluten_celiac");
  });

  it("gives the same sugary drink a worse verdict for a diabetic", () => {
    const general = scoreFood(cola, healthy);
    const diabetic = scoreFood(cola, { ...healthy, conditions: ["diabetes"] });
    expect(diabetic.score).toBeLessThan(general.score);
    expect(diabetic.verdict).toBe("avoid");
    expect(diabetic.reasons[0].key).toBe("high_sugar_diabetes");
  });

  it("treats salty chips as avoid for hypertension", () => {
    const r = scoreFood(chips, { ...healthy, conditions: ["hypertension"] });
    expect(r.verdict).toBe("avoid");
    expect(r.reasons.map((x) => x.key)).toContain("high_salt_condition");
  });

  it("uses half thresholds for drinks", () => {
    const juice = food({ sugarG: 12 }, { isDrink: true });
    const solid = food({ sugarG: 12 });
    expect(scoreFood(juice, healthy).levels.sugar).toBe("high");
    expect(scoreFood(solid, healthy).levels.sugar).toBe("medium");
  });

  it("treats unknown nutrition as unknown, not as zero", () => {
    const r = scoreFood(food({}), healthy);
    expect(r.levels.sugar).toBeNull();
    expect(r.reasons).toHaveLength(0);
  });
});

describe("topReasons", () => {
  it("keeps at most 3 and always includes a positive one when present", () => {
    const r = scoreFood(chips, { ...healthy, conditions: ["hypertension"], goal: "lose_weight" });
    const top = topReasons(r.reasons);
    expect(top.length).toBeLessThanOrEqual(3);
    expect(top.some((x) => x.positive)).toBe(r.reasons.some((x) => x.positive));
  });
});
