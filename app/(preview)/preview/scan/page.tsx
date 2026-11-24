import type { Metadata } from "next";
import { ScanFlow } from "@/components/scan/ScanFlow";
import { Page, PageHeader } from "@/components/ui/Page";

export const metadata: Metadata = { title: "معاينة: الفحص" };

/** The real scan UI. Analyzing needs an account, so it leads to sign-in. */
export default function PreviewScan() {
  return (
    <Page width="narrow">
      <PageHeader title="ماذا تفحص؟" description="اختر الطريقة: باركود، المنتج كاملاً، الملصق، أو المكونات." />
      <ScanFlow />
    </Page>
  );
}
