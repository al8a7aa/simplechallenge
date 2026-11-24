import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HealthView } from "@/components/views/HealthView";
import { getProfile, getWeekNutrition } from "@/lib/data/queries";

export const metadata: Metadata = { title: "صحتي" };

/** Loads the profile and this week's scanned nutrition, renders My health. */
export default async function HealthPage() {
  const [profile, nutrition] = await Promise.all([getProfile(), getWeekNutrition()]);
  if (!profile) notFound();
  return <HealthView profile={profile} nutrition={nutrition} />;
}
