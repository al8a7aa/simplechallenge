import type { Metadata } from "next";
import { MotionLab } from "@/components/motion/MotionLab";
import { Page, PageHeader } from "@/components/ui/Page";

export const metadata: Metadata = { title: "مختبر الحركة" };

/** Every animation and page transition in the app, each with a play button. */
export default function MotionPage() {
  return (
    <Page>
      <PageHeader title="مختبر الحركة" description="كل الحركات والانتقالات في التطبيق، مع مكان استخدامها ومدتها." />
      <MotionLab />
    </Page>
  );
}
