import type { ReactNode } from "react";
import { PageTransition } from "@/components/motion/PageTransition";

/** Same as app/(app)/template.tsx: plays each page's enter transition. */
export default function LabTemplate({ children }: { children: ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
