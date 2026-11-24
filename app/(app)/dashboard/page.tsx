import type { Metadata } from "next";
import { DashboardView } from "@/components/views/DashboardView";
import { getProfile, getScans, getWeekSummary } from "@/lib/data/queries";

export const metadata: Metadata = { title: "الرئيسية" };

/** Loads the signed-in user's week and renders the Home screen. */
export default async function DashboardPage() {
  const [profile, week, recent] = await Promise.all([getProfile(), getWeekSummary(), getScans({ limit: 5 })]);
  return <DashboardView fullName={profile?.full_name ?? ""} week={week} recent={recent} maxAvoid={profile?.max_avoid_per_week ?? 4} />;
}
