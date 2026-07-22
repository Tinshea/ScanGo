import { useEffect } from "react";
import PropTypes from "prop-types";
import { X } from "lucide-react";

/**
 * Message transitoire, affiché en bas d'écran.
 *
 * Il occupait auparavant tout l'écran derrière un voile, pour un simple accusé
 * de réception. Il se referme désormais seul, et à la touche Échap.
 */
const PopupComponent = ({ message, onClose, duration = 4000 }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    const onKey = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);

    // Nettoyage strict : sans lui, le minuteur et l'écouteur survivent au
    // démontage du composant.
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose, duration]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 bottom-6 z-50 flex justify-center px-4"
    >
      <div className="flex items-center gap-3 rounded-full bg-ink-850 py-3 pl-5 pr-3 text-sm text-ink-100 shadow-2xl ring-1 ring-white/10">
        <span>{message}</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close message"
          className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-ink-400 transition-colors duration-300 hover:bg-white/10 hover:text-ink-050"
        >
          <X size={14} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
};

PopupComponent.propTypes = {
  message: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  duration: PropTypes.number,
};

export default PopupComponent;
