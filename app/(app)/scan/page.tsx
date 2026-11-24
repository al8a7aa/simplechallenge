import type { Metadata } from "next";
import { ScanFlow } from "@/components/scan/ScanFlow";
import { Page, PageHeader } from "@/components/ui/Page";

export const metadata: Metadata = { title: "افحص منتج" };

/** Pattern: Form — one task: capture a photo or a barcode. */
export default function ScanPage() {
  return (
    <Page className="max-w-[640px]">
      <PageHeader title="افحص منتج" description="صوّر أي أكل أو منتج، ونخبرك إذا كان مناسباً لك." />
      <ScanFlow />
    </Page>
  );
}
