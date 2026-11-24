"use client";

/**
 * Remembers which page transition the *next* page should play.
 *
 * How page transitions work (enter-only, CSS):
 *   1. A <TransitionLink transition="forward"> is clicked → it calls
 *      setNext("forward") and then navigates.
 *   2. Next.js mounts the new page inside app/(app)/template.tsx, which
 *      renders <PageTransition>. Templates re-mount on every navigation.
 *   3. <PageTransition> reads the pending type once, on mount, adds the
 *      class `page-enter--forward`, then clears it. The CSS does the rest.
 *
 * The browser Back/Forward buttons don't go through a link, so a popstate
 * listener sets "back" for them.
 */

import { createContext, useCallback, useContext, useEffect, useRef, type ReactNode } from "react";
import type { TransitionType } from "@/lib/motion/transitions";

interface TransitionContextValue {
  /** Sets the transition for the next navigation. */
  setNext: (type: TransitionType) => void;
  /** Reads the pending transition (falls back to "fade"). */
  peek: () => TransitionType;
  /** Clears it once the new page has mounted. */
  clear: () => void;
}

const TransitionContext = createContext<TransitionContextValue | null>(null);

export function TransitionProvider({ children }: { children: ReactNode }) {
  // A ref, not state: changing it must not re-render the current page.
  const pending = useRef<TransitionType | null>(null);

  const setNext = useCallback((type: TransitionType) => {
    pending.current = type;
  }, []);

  const peek = useCallback(() => pending.current ?? "fade", []);
  const clear = useCallback(() => {
    pending.current = null;
  }, []);

  useEffect(() => {
    const onPop = () => setNext("back");
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [setNext]);

  return <TransitionContext.Provider value={{ setNext, peek, clear }}>{children}</TransitionContext.Provider>;
}

export function usePageTransition(): TransitionContextValue {
  const ctx = useContext(TransitionContext);
  if (!ctx) throw new Error("usePageTransition must be used inside <TransitionProvider>");
  return ctx;
}
