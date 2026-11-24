import type { Metadata } from "next";
import { ScanFlow } from "@/components/scan/ScanFlow";
import { Page, PageHeader } from "@/components/ui/Page";

export const metadata: Metadata = { title: "افحص منتج" };

/** Pattern: Form — one task: capture a photo or a barcode. */
export default function ScanPage() {
  return (
    <Page width="narrow">
      <PageHeader title="ماذا تفحص؟" description="اختر الطريقة: باركود، المنتج كاملاً، الملصق، أو المكونات." />
      <ScanFlow />
    </Page>
  );
}
