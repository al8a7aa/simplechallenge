import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { ALLERGENS, CATEGORIES } from "@/lib/nutrition/types";

/**
 * Reads food photos with Claude (vision) and returns structured nutrition.
 *
 * The scan screen sends one to three photos, each tagged with its role:
 *  - "product"      the whole product or a plated meal (values may be estimates),
 *  - "nutrition"    the nutrition facts table (values are copied),
 *  - "ingredients"  the ingredients list (allergens, additives, halal).
 * Several photos of the same product are read together as one product.
 *
 * The response is constrained with Structured Outputs, so `parsed_output`
 * always matches `FoodPhotoSchema` or is null.
 */

const MODEL = "claude-opus-5-5";

const per100g = z.object({
  energy_kcal: z.number().nullable(),
  sugar_g: z.number().nullable(),
  fat_g: z.number().nullable(),
  sat_fat_g: z.number().nullable(),
  salt_g: z.number().nullable(),
  fiber_g: z.number().nullable(),
  protein_g: z.number().nullable(),
  carbs_g: z.number().nullable(),
});

export const FoodPhotoSchema = z.object({
  is_food: z.boolean().describe("false if the photo shows no food, drink or food packaging"),
  kind: z.enum(["packaged", "meal"]),
  name_ar: z.string().describe("Short Arabic product or dish name, e.g. لبن قليل الدسم"),
  name_en: z.string(),
  brand: z.string().nullable(),
  barcode: z.string().nullable().describe("Digits of a barcode only if clearly readable"),
  category: z.enum(CATEGORIES),
  is_drink: z.boolean(),
  portion_g: z.number().nullable().describe("Pack size, or estimated weight of the meal shown"),
  per_100g: per100g.describe("Per 100 g, or per 100 ml for drinks. null when unknown"),
  ingredients_text: z.string().nullable(),
  allergens: z.array(z.enum(ALLERGENS)),
  additives: z.array(z.string()).describe("E-numbers in lower case, e.g. e621"),
  is_halal: z.boolean().nullable().describe("true only with a halal mark; false only with pork, alcohol or similar"),
  has_animal_ingredients: z.boolean().nullable().describe("meat, fish, gelatin or animal fat"),
  has_animal_products: z.boolean().nullable().describe("milk, eggs or honey"),
  confidence: z.enum(["high", "medium", "low"]),
});

export type FoodPhoto = z.infer<typeof FoodPhotoSchema>;

const SYSTEM_PROMPT = `You read photos of food for a nutrition app used in the Gulf and the Arab world.

For a nutrition label or package: copy the printed values. Convert per-serving values to per 100 g (or per 100 ml for drinks) using the serving size. If only sodium is printed, salt = sodium × 2.5. Read Arabic and English labels. Confidence is "high" when the values are printed and legible.

For an ingredients list only: fill ingredients, allergens, additives, halal and animal fields; leave nutrition null unless it is printed.

For a plated meal or unpackaged food: identify the dish (regional dishes such as kabsa, mandi, harees, shawarma are common), estimate the portion in grams and typical nutrition per 100 g. Confidence is "medium" for a clearly identifiable dish and "low" otherwise.

Use null for anything you cannot read or reasonably estimate. Never invent a barcode or a brand.`;

export type PhotoRole = "product" | "nutrition" | "ingredients";

export interface PhotoInput {
  base64: string;
  mediaType: "image/jpeg" | "image/png" | "image/webp";
  role: PhotoRole;
}

const ROLE_TEXT: Record<PhotoRole, string> = {
  product: "Photo of the whole product or meal.",
  nutrition: "Photo of the nutrition facts table: copy its values.",
  ingredients: "Photo of the ingredients list: use it for allergens, additives, halal and animal ingredients.",
};

export class PhotoAnalysisError extends Error {
  constructor(
    public readonly code: "not_food" | "refused" | "unreadable" | "service",
    message: string,
  ) {
    super(message);
  }
}

let client: Anthropic | null = null;
const getClient = () => (client ??= new Anthropic()); // reads ANTHROPIC_API_KEY

export async function analyzeFoodPhotos(photos: PhotoInput[]): Promise<FoodPhoto> {
  // Each image is preceded by a short caption saying what it shows.
  const content: Anthropic.Beta.BetaContentBlockParam[] = photos.flatMap((photo, i) => [
    { type: "text" as const, text: `Photo ${i + 1}: ${ROLE_TEXT[photo.role]}` },
    { type: "image" as const, source: { type: "base64" as const, media_type: photo.mediaType, data: photo.base64 } },
  ]);
  content.push({
    type: "text",
    text:
      photos.length > 1
        ? "All photos show the same product. Combine them into one result."
        : "Read this food photo.",
  });

  let response;
  try {
    response = await getClient().beta.messages.parse({
      model: MODEL,
      max_tokens: 4000,
      // If a safety classifier declines, the API retries on a fallback model.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "medium", format: betaZodOutputFormat(FoodPhotoSchema) },
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content }],
    });
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      throw new PhotoAnalysisError("service", "Too many requests to the AI service");
    }
    if (error instanceof Anthropic.APIError) {
      throw new PhotoAnalysisError("service", `AI service error ${error.status ?? ""}`.trim());
    }
    throw error;
  }

  if (response.stop_reason === "refusal") {
    throw new PhotoAnalysisError("refused", "The AI service declined this photo");
  }
  const parsed = response.parsed_output;
  if (!parsed) throw new PhotoAnalysisError("unreadable", "The photo could not be read");
  if (!parsed.is_food) throw new PhotoAnalysisError("not_food", "No food in the photo");
  return parsed;
}
