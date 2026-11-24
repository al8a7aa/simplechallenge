import type { Metadata } from "next";
import { DashboardView } from "@/components/views/DashboardView";
import { SAMPLE_PROFILE, SAMPLE_RECENT, SAMPLE_WEEK } from "@/lib/demo/sample";

export const metadata: Metadata = { title: "معاينة: الرئيسية" };

export default function PreviewDashboard() {
  return <DashboardView fullName={SAMPLE_PROFILE.full_name} week={SAMPLE_WEEK} recent={SAMPLE_RECENT} maxAvoid={4} base="/preview" />;
}
