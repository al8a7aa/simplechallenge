"use client";

import { useCallback, useState } from "react";

/**
 * Replays a CSS animation by re-mounting the element.
 *
 *   const [key, replay] = useReplay();
 *   <div key={key} className="anim-pop" />
 *   <button onClick={replay}>Play</button>
 *
 * A new `key` makes React create a fresh DOM node, and CSS animations
 * always start from the beginning on a new node.
 */
export function useReplay(): [key: number, replay: () => void] {
  const [key, setKey] = useState(0);
  const replay = useCallback(() => setKey((k) => k + 1), []);
  return [key, replay];
}
