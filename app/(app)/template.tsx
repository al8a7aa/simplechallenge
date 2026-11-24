import type { ReactNode } from "react";
import { PageTransition } from "@/components/motion/PageTransition";

/**
 * Templates re-mount on every navigation (layouts don't), so each page in
 * this group plays its enter transition. The navigation shell lives in
 * layout.tsx and stays still.
 */
export default function AppTemplate({ children }: { children: ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
