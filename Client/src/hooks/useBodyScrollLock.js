import { useEffect } from "react";

/**
 * Verrouille le défilement de l'arrière-plan tant qu'un panneau superposé est
 * ouvert.
 *
 * Sans cela, sur mobile, faire défiler à l'intérieur d'un tiroir entraînait la
 * page située derrière, et le geste « fermer en tirant vers le haut » faisait
 * bouger l'arrière-plan au lieu du panneau. La largeur de la barre de
 * défilement est compensée par un padding pour éviter un saut horizontal de la
 * mise en page au moment du verrouillage sur desktop.
 *
 * @param {boolean} locked Verrou actif tant que la valeur est vraie.
 */
export default function useBodyScrollLock(locked) {
  useEffect(() => {
    if (!locked) return undefined;

    const { body } = document;
    const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;

    const previousOverflow = body.style.overflow;
    const previousPaddingRight = body.style.paddingRight;

    body.style.overflow = "hidden";
    if (scrollBarWidth > 0) {
      body.style.paddingRight = `${scrollBarWidth}px`;
    }

    return () => {
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPaddingRight;
    };
  }, [locked]);
}
