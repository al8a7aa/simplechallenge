"use server";

/**
 * Server Actions for the scan flow.
 *
 *   analyzePhoto(formData)  photo → Claude → product → personal scan
 *   scanBarcode(code)       barcode → our cache / Open Food Facts → scan
 *   scanExisting(id)        a product picked from search or an alternative
 *   chooseAlternative(...)  records a healthy swap
 *
 * Each returns a small result object instead of throwing, so the client can
 * show a specific, recoverable error message.
 */

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { analyzeFoodPhoto, PhotoAnalysisError, type FoodPhoto } from "@/lib/ai/analyze-photo";
import { toFoodItem, toHealthProfile, type NewProductRow, type ProductRow } from "@/lib/data/mappers";
import { findAlternative, getProfile } from "@/lib/data/queries";
import { scoreFood } from "@/lib/nutrition/scoring";
import { lookupBarcode } from "@/lib/openfoodfacts";
import { createAdminSupabase, createServerSupabase } from "@/lib/supabase/server";

export type ScanResult =
  | { ok: true; productId: string }
  | { ok: false; error: "not_found" | "not_food" | "unreadable" | "too_many" | "invalid" | "service" | "no_profile" };

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const PHOTO_SCANS_PER_DAY = 30;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
type AcceptedType = (typeof ACCEPTED_TYPES)[number];

export async function analyzePhoto(formData: FormData): Promise<ScanResult> {
  const { userId } = await auth.protect();

  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0 || file.size > MAX_PHOTO_BYTES) return { ok: false, error: "invalid" };
  if (!ACCEPTED_TYPES.includes(file.type as AcceptedType)) return { ok: false, error: "invalid" };

  if ((await photoScansToday()) >= PHOTO_SCANS_PER_DAY) return { ok: false, error: "too_many" };

  let photo: FoodPhoto;
  try {
    const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
    photo = await analyzeFoodPhoto({ base64, mediaType: file.type as AcceptedType });
  } catch (error) {
    if (error instanceof PhotoAnalysisError) {
      return { ok: false, error: error.code === "not_food" ? "not_food" : error.code === "service" ? "service" : "unreadable" };
    }
    throw error;
  }

  // A readable barcode on the package: prefer the existing product.
  if (photo.barcode) {
    const existing = await findByBarcode(photo.barcode);
    if (existing) return recordScan(existing, "photo");
  }

  const product = await insertProduct(photoToRow(photo, userId));
  return recordScan(product, "photo");
}

export async function scanBarcode(rawCode: string): Promise<ScanResult> {
  await auth.protect();
  const code = rawCode.replace(/\D/g, "");
  if (code.length < 8 || code.length > 14) return { ok: false, error: "invalid" };

  const cached = await findByBarcode(code);
  if (cached) return recordScan(cached, "barcode");

  const fromOff = await lookupBarcode(code);
  if (!fromOff) return { ok: false, error: "not_found" };
  return recordScan(await insertProduct(fromOff), "barcode");
}

export async function scanExisting(productId: string): Promise<ScanResult> {
  await auth.protect();
  const db = await createServerSupabase();
  const { data } = await db.from("products").select("*").eq("id", productId).maybeSingle();
  if (!data) return { ok: false, error: "not_found" };
  return recordScan(data as ProductRow, "search");
}

/** Marks the latest scan of `fromProductId` as swapped, then scans the alternative. */
export async function chooseAlternative(fromProductId: string, alternativeId: string): Promise<ScanResult> {
  await auth.protect();
  const db = await createServerSupabase();
  const { data: latest } = await db
    .from("scans")
    .select("id")
    .eq("product_id", fromProductId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (latest) await db.from("scans").update({ chose_alternative: true }).eq("id", latest.id);
  return scanExisting(alternativeId);
}

// ── Helpers ────────────────────────────────────────────────────────────────

/** Scores the product for the signed-in user and stores the scan. */
async function recordScan(product: ProductRow, method: "photo" | "barcode" | "search"): Promise<ScanResult> {
  const profileRow = await getProfile();
  if (!profileRow) return { ok: false, error: "no_profile" };
  const profile = toHealthProfile(profileRow);

  const result = scoreFood(toFoodItem(product), profile);
  const alternative = result.verdict === "good" ? null : await findAlternative(product, result.score, profile);

  const db = await createServerSupabase();
  const { error } = await db.from("scans").insert({
    product_id: product.id,
    method,
    score: result.score,
    verdict: result.verdict,
    reasons: result.reasons,
    alternative_product_id: alternative?.product.id ?? null,
  });
  if (error) throw error;

  revalidatePath("/dashboard");
  revalidatePath("/history");
  return { ok: true, productId: product.id };
}

async function findByBarcode(barcode: string): Promise<ProductRow | null> {
  const db = await createServerSupabase();
  const { data } = await db.from("products").select("*").eq("barcode", barcode).maybeSingle();
  return (data as ProductRow | null) ?? null;
}

/** Products are shared, so they are written with the service-role client. */
async function insertProduct(row: NewProductRow): Promise<ProductRow> {
  const { data, error } = await createAdminSupabase().from("products").insert(row).select("*").single();
  if (error) throw error;
  return data as ProductRow;
}

async function photoScansToday(): Promise<number> {
  const db = await createServerSupabase();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await db
    .from("scans")
    .select("id", { count: "exact", head: true })
    .eq("method", "photo")
    .gte("created_at", since);
  return count ?? 0;
}

function photoToRow(photo: FoodPhoto, userId: string): NewProductRow & { created_by: string } {
  const n = photo.per_100g;
  return {
    barcode: null, // a barcode read from a photo is matched above, never stored unverified
    kind: photo.kind,
    name_ar: photo.name_ar,
    name_en: photo.name_en,
    brand: photo.brand,
    image_url: null,
    category: photo.category,
    is_drink: photo.is_drink,
    portion_g: photo.portion_g,
    energy_kcal: n.energy_kcal,
    sugar_g: n.sugar_g,
    fat_g: n.fat_g,
    sat_fat_g: n.sat_fat_g,
    salt_g: n.salt_g,
    fiber_g: n.fiber_g,
    protein_g: n.protein_g,
    carbs_g: n.carbs_g,
    ingredients_text: photo.ingredients_text,
    allergens: photo.allergens,
    additives: photo.additives.map((a) => a.toLowerCase()),
    is_halal: photo.is_halal,
    has_animal_ingredients: photo.has_animal_ingredients,
    has_animal_products: photo.has_animal_products,
    source: "photo",
    confidence: photo.confidence,
    created_by: userId,
  };
}
