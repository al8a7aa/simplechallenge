"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { usePageTransition } from "./TransitionProvider";

/**
 * Plays the enter animation for a page. Used by the template.tsx files.
 *
 * Why the `key={pathname}`: Next.js re-mounts a template only when the
 * route segment directly below it changes. Going from /product/a to
 * /product/b (or /motion to /motion/demo) keeps the same segment, so the
 * template stays mounted. Keying on the full path re-mounts the animated
 * wrapper on every page change.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return <AnimatedPage key={pathname}>{children}</AnimatedPage>;
}

/**
 * The transition type is read in the useState initializer so it is fixed
 * for the page's lifetime (changing the class later would replay it), and
 * cleared in an effect. Reading and clearing are separate because React's
 * StrictMode calls initializers twice in development.
 */
function AnimatedPage({ children }: { children: ReactNode }) {
  const { peek, clear } = usePageTransition();
  const [type] = useState(peek);
  useEffect(clear, [clear]);
  return <div className={`page-enter--${type}`}>{children}</div>;
}
