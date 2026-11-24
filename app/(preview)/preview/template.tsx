import type { ReactNode } from "react";
import { PageTransition } from "@/components/motion/PageTransition";

/** Plays each page's enter transition, like the real app. */
export default function PreviewTemplate({ children }: { children: ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
