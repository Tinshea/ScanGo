import "../Css/LoadingComponent.css";

// Indicateur d'attente pour les surfaces dont la mise en page finale n'est pas
// connue à l'avance. Partout ailleurs, les squelettes réservent la place réelle
// du contenu (voir Skeleton.jsx).
const LoadingComponent = () => (
  <div
    className="flex min-h-[40vh] items-center justify-center gap-2"
    role="status"
    aria-label="Chargement en cours"
  >
    <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-ink-400" />
    <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-ink-400 [animation-delay:-.3s]" />
    <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-ink-400 [animation-delay:-.5s]" />
  </div>
);

export default LoadingComponent;
