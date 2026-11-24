"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ComponentProps } from "react";
import type { TransitionType } from "@/lib/motion/transitions";
import { usePageTransition } from "./TransitionProvider";

type LinkProps = ComponentProps<typeof Link>;

/**
 * A drop-in replacement for next/link that chooses the page transition the
 * destination page plays. See lib/motion/transitions.ts for which to use.
 *
 *   <TransitionLink href="/scan" transition="rise">Scan</TransitionLink>
 */
export function TransitionLink({ transition = "fade", onClick, ...props }: LinkProps & { transition?: TransitionType }) {
  const { setNext } = usePageTransition();
  return (
    <Link
      {...props}
      onClick={(event) => {
        setNext(transition);
        onClick?.(event);
      }}
    />
  );
}

/** Same as TransitionLink, for navigating from code (after a scan). */
export function useTransitionRouter() {
  const router = useRouter();
  const { setNext } = usePageTransition();
  return {
    push(href: string, transition: TransitionType = "fade") {
      setNext(transition);
      router.push(href);
    },
  };
}
