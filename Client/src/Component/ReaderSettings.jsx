import { useEffect } from "react";
import PropTypes from "prop-types";
import { X, RotateCcw } from "lucide-react";

/**
 * Panneau de réglages du lecteur.
 *
 * Chaque option est laissée au lecteur plutôt que fixée en dur : les formats
 * du catalogue sont trop hétérogènes pour qu'un réglage unique convienne.
 */

const Group = ({ label, hint, children }) => (
  <fieldset className="border-0 p-0">
    <legend className="mb-2 text-xs font-bold text-ink-300">{label}</legend>
    {children}
    {hint && <p className="mt-1.5 text-xs text-ink-400">{hint}</p>}
  </fieldset>
);

Group.propTypes = {
  label: PropTypes.string.isRequired,
  hint: PropTypes.string,
  children: PropTypes.node,
};

const Choice = ({ name, value, current, onChange, children }) => {
  const active = current === value;
  return (
    <label
      className={`flex-1 cursor-pointer rounded-sm px-3 py-2 text-center text-xs font-semibold transition-colors duration-200 ${
        active
          ? "bg-brand-500 text-white"
          : "bg-white/5 text-ink-200 hover:bg-white/10"
      }`}
    >
      {/* Boutons radio réels : le groupe reste navigable aux flèches et
          correctement annoncé, contrairement à une rangée de <button>. */}
      <input
        type="radio"
        name={name}
        value={value}
        checked={active}
        onChange={() => onChange(value)}
        className="sr-only-focusable"
      />
      {children}
    </label>
  );
};

Choice.propTypes = {
  name: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  current: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  children: PropTypes.node,
};

const ReaderSettings = ({ open, onClose, settings, update, reset, detected }) => {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const isPaged = settings.mode === "pagine" || (settings.mode === "auto" && detected === "manga");

  return (
    <>
      <button
        type="button"
        aria-label="Fermer les réglages"
        onClick={onClose}
        className="fixed inset-0 z-50 bg-ink-950/70 backdrop-blur-sm"
      />

      <aside
        aria-label="Réglages de lecture"
        className="fixed right-0 top-0 z-50 flex h-dvh w-[22rem] max-w-full flex-col border-l border-white/10 bg-ink-900 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
          <h2 className="text-lg text-ink-050">Réglages de lecture</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="grid h-9 w-9 place-items-center rounded-full text-ink-400 transition-colors duration-300 hover:bg-white/5 hover:text-ink-050"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-5 py-5">
          <Group
            label="Mode de lecture"
            hint={
              settings.mode === "auto" && detected
                ? `Format détecté : ${detected === "webtoon" ? "webtoon, défilement continu" : "manga, mode paginé"}.`
                : "Automatique : déduit du format des planches."
            }
          >
            <div className="flex gap-1.5">
              <Choice name="mode" value="auto" current={settings.mode} onChange={(v) => update({ mode: v })}>
                Auto
              </Choice>
              <Choice name="mode" value="continu" current={settings.mode} onChange={(v) => update({ mode: v })}>
                Continu
              </Choice>
              <Choice name="mode" value="pagine" current={settings.mode} onChange={(v) => update({ mode: v })}>
                Paginé
              </Choice>
            </div>
          </Group>

          <Group
            label="Ajustement des planches"
            hint="Originale conserve la résolution native, sans étirement ni réduction."
          >
            <div className="flex gap-1.5">
              <Choice name="fit" value="largeur" current={settings.fit} onChange={(v) => update({ fit: v })}>
                Largeur
              </Choice>
              <Choice name="fit" value="hauteur" current={settings.fit} onChange={(v) => update({ fit: v })}>
                Hauteur
              </Choice>
              <Choice name="fit" value="originale" current={settings.fit} onChange={(v) => update({ fit: v })}>
                Originale
              </Choice>
            </div>
          </Group>

          <Group
            label="Largeur de lecture"
            hint={`${settings.maxWidth} pixels. Au-delà de la largeur native, la planche n'est plus étirée.`}
          >
            <input
              type="range"
              min={600}
              max={1600}
              step={50}
              value={settings.maxWidth}
              onChange={(e) => update({ maxWidth: Number(e.target.value) })}
              aria-label="Largeur de la colonne de lecture en pixels"
              className="w-full accent-brand-500"
            />
          </Group>

          {isPaged && (
            <>
              <Group label="Sens de lecture" hint="Le sens japonais se lit de droite à gauche.">
                <div className="flex gap-1.5">
                  <Choice
                    name="direction"
                    value="ltr"
                    current={settings.direction}
                    onChange={(v) => update({ direction: v })}
                  >
                    Occidental
                  </Choice>
                  <Choice
                    name="direction"
                    value="rtl"
                    current={settings.direction}
                    onChange={(v) => update({ direction: v })}
                  >
                    Japonais
                  </Choice>
                </div>
              </Group>

              <Group label="Double planche" hint="Affiche deux pages côte à côte, comme un volume ouvert.">
                <label className="flex cursor-pointer items-center justify-between gap-3 rounded-sm bg-white/5 px-3 py-2.5 text-xs font-semibold text-ink-200">
                  Deux pages par vue
                  <input
                    type="checkbox"
                    checked={settings.doublePage}
                    onChange={(e) => update({ doublePage: e.target.checked })}
                    className="h-4 w-4 accent-brand-500"
                  />
                </label>
              </Group>
            </>
          )}

          <Group label="Confort" hint="Le mode immersif masque l'en-tête et la barre d'outils.">
            <label className="flex cursor-pointer items-center justify-between gap-3 rounded-sm bg-white/5 px-3 py-2.5 text-xs font-semibold text-ink-200">
              Lecture immersive
              <input
                type="checkbox"
                checked={settings.immersif}
                onChange={(e) => update({ immersif: e.target.checked })}
                className="h-4 w-4 accent-brand-500"
              />
            </label>
          </Group>

          <button
            type="button"
            onClick={reset}
            className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-white/5 px-4 py-2.5 text-xs font-semibold text-ink-300 transition-colors duration-300 hover:bg-white/10 hover:text-ink-050"
          >
            <RotateCcw size={14} strokeWidth={2} />
            Rétablir les réglages par défaut
          </button>

          <p className="text-xs text-ink-400">
            Vos réglages sont conservés sur cet appareil.
          </p>
        </div>
      </aside>
    </>
  );
};

ReaderSettings.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  settings: PropTypes.object.isRequired,
  update: PropTypes.func.isRequired,
  reset: PropTypes.func.isRequired,
  detected: PropTypes.string,
};

export default ReaderSettings;
