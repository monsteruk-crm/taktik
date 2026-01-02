"use client";

import { useEffect, useState } from "react";

export const DUR = {
  micro: 90,
  fast: 140,
  standard: 200,
} as const;

export const EASE = {
  stiff: "cubic-bezier(0.2, 0.9, 0.1, 1)",
  snap: "cubic-bezier(0.2, 0.8, 0.2, 1)",
} as const;

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();
    if (media.addEventListener) {
      media.addEventListener("change", update);
      return () => media.removeEventListener("change", update);
    }
    media.addListener(update);
    return () => media.removeListener(update);
  }, []);

  return reduced;
}
