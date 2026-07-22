import { useEffect, useState } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Indique si l'utilisateur demande une réduction des animations.
 *
 * Le CSS neutralise déjà les transitions, mais il ne peut rien contre une
 * animation pilotée en JavaScript comme le défilement automatique du
 * carrousel. Ce hook permet de la couper à la source.
 */
export default function usePrefersReducedMotion() {
  const [prefersReduced, setPrefersReduced] = useState(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia(QUERY).matches;
  });

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;

    const mql = window.matchMedia(QUERY);
    const onChange = (event) => setPrefersReduced(event.matches);

    mql.addEventListener("change", onChange);
    // Nettoyage strict : sans lui, l'écouteur survit au démontage.
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return prefersReduced;
}
