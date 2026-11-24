import type { Metadata } from "next";
import { HealthView } from "@/components/views/HealthView";
import { SAMPLE_NUTRITION, SAMPLE_PROFILE } from "@/lib/demo/sample";

export const metadata: Metadata = { title: "معاينة: صحتي" };

export default function PreviewHealth() {
  return <HealthView profile={SAMPLE_PROFILE} nutrition={SAMPLE_NUTRITION} />;
}
