import "server-only";

import { cache } from "react";
import { scoreFood } from "@/lib/nutrition/scoring";
import type { HealthProfile, Verdict } from "@/lib/nutrition/types";
import { createServerSupabase } from "@/lib/supabase/server";
import { toFoodItem, type ProductRow, type ProfileRow, type ScanRow } from "./mappers";

/**
 * Read-only queries used by Server Components. All of them run as the
 * signed-in user, so Row Level Security limits results to their own data.
 * `cache()` dedupes calls within one request (layout + page).
 */

export const getProfile = cache(async (): Promise<ProfileRow | null> => {
  const db = await createServerSupabase();
  const { data, error } = await db.from("profiles").select("*").maybeSingle();
  if (error) throw error;
  return data as ProfileRow | null;
});

export async function getProduct(id: string): Promise<ProductRow | null> {
  const db = await createServerSupabase();
  const { data, error } = await db.from("products").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data as ProductRow | null;
}

/** The latest scan of a product by this user (for the result page). */
export async function getLatestScanFor(productId: string): Promise<ScanRow | null> {
  const db = await createServerSupabase();
  const { data, error } = await db
    .from("scans")
    .select("*")
    .eq("product_id", productId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as ScanRow | null;
}

export interface ScanWithProduct extends ScanRow {
  product: Pick<ProductRow, "id" | "name_ar" | "category" | "image_url" | "kind" | "is_drink">;
}

const PRODUCT_FIELDS = "id, name_ar, category, image_url, kind, is_drink";
/** `inner` turns the join into a filter, needed when searching by product name. */
const scanWithProduct = (inner: boolean) =>
  `*, product:products!scans_product_id_fkey${inner ? "!inner" : ""}(${PRODUCT_FIELDS})`;

export async function getScans(options: {
  limit: number;
  offset?: number;
  verdict?: Verdict;
  query?: string;
}): Promise<ScanWithProduct[]> {
  const db = await createServerSupabase();
  let q = db
    .from("scans")
    .select(scanWithProduct(Boolean(options.query)))
    .order("created_at", { ascending: false })
    .range(options.offset ?? 0, (options.offset ?? 0) + options.limit - 1);
  if (options.verdict) q = q.eq("verdict", options.verdict);
  if (options.query) q = q.ilike("product.name_ar", `%${options.query}%`);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as ScanWithProduct[];
}

export interface DaySummary {
  /** Short Arabic weekday, e.g. "سبت". */
  label: string;
  good: number;
  moderate: number;
  avoid: number;
}

export interface WeekSummary {
  total: number;
  good: number;
  moderate: number;
  avoid: number;
  swaps: number;
  /** Average score this week (0–100), or null with no scans. */
  score: number | null;
  /** Change vs the previous 7 days, or null when either week is empty. */
  scoreDelta: number | null;
  days: DaySummary[];
  /** Category with the most "avoid" scans this week (for the daily tip). */
  topAvoidCategory: string | null;
}

/** Rolling last 7 days (today included) compared with the 7 days before. */
export async function getWeekSummary(now = new Date()): Promise<WeekSummary> {
  const db = await createServerSupabase();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = addDays(today, -6);
  const prevStart = addDays(weekStart, -7);

  const { data, error } = await db
    .from("scans")
    .select("score, verdict, chose_alternative, created_at, product:products!scans_product_id_fkey(category)")
    .gte("created_at", prevStart.toISOString());
  if (error) throw error;

  type Row = { score: number; verdict: Verdict; chose_alternative: boolean; created_at: string; product: { category: string } | null };
  const rows = (data ?? []) as unknown as Row[];
  const thisWeek = rows.filter((r) => new Date(r.created_at) >= weekStart);
  const lastWeek = rows.filter((r) => new Date(r.created_at) < weekStart);

  const days: DaySummary[] = Array.from({ length: 7 }, (_, i) => {
    const day = addDays(weekStart, i);
    const next = addDays(day, 1);
    const inDay = thisWeek.filter((r) => {
      const t = new Date(r.created_at);
      return t >= day && t < next;
    });
    return {
      label: day.toLocaleDateString("ar", { weekday: "short" }),
      good: inDay.filter((r) => r.verdict === "good").length,
      moderate: inDay.filter((r) => r.verdict === "moderate").length,
      avoid: inDay.filter((r) => r.verdict === "avoid").length,
    };
  });

  const avg = (list: Row[]) => (list.length ? Math.round(list.reduce((s, r) => s + r.score, 0) / list.length) : null);
  const score = avg(thisWeek);
  const prev = avg(lastWeek);

  const avoidCounts = new Map<string, number>();
  for (const r of thisWeek) {
    if (r.verdict === "avoid" && r.product) avoidCounts.set(r.product.category, (avoidCounts.get(r.product.category) ?? 0) + 1);
  }
  const topAvoidCategory = [...avoidCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  return {
    total: thisWeek.length,
    good: thisWeek.filter((r) => r.verdict === "good").length,
    moderate: thisWeek.filter((r) => r.verdict === "moderate").length,
    avoid: thisWeek.filter((r) => r.verdict === "avoid").length,
    swaps: thisWeek.filter((r) => r.chose_alternative).length,
    score,
    scoreDelta: score !== null && prev !== null ? score - prev : null,
    days,
    topAvoidCategory,
  };
}

/**
 * Finds the best product in the same category for this person, if it is
 * clearly better (at least 10 points) than the one they scanned.
 */
export async function findAlternative(
  product: ProductRow,
  currentScore: number,
  profile: HealthProfile,
): Promise<{ product: ProductRow; score: number } | null> {
  const db = await createServerSupabase();
  const { data, error } = await db
    .from("products")
    .select("*")
    .eq("category", product.category)
    .eq("kind", "packaged")
    .neq("id", product.id)
    .limit(60);
  if (error) throw error;

  let best: { product: ProductRow; score: number } | null = null;
  for (const candidate of (data ?? []) as ProductRow[]) {
    const { score, verdict } = scoreFood(toFoodItem(candidate), profile);
    if (verdict === "avoid") continue;
    if (!best || score > best.score) best = { product: candidate, score };
  }
  return best && best.score >= currentScore + 10 ? best : null;
}

function addDays(d: Date, days: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + days);
  return copy;
}
