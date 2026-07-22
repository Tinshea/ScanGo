// Styles partagés par les formulaires.
//
// Ils vivent dans leur propre module : un fichier de composant qui exporte
// aussi des constantes casse le Fast Refresh de Vite.
//
// Le contraste des champs, libellés et textes indicatifs est vérifié sur les
// fonds ink-850 et ink-900, conformément au contrôle de contraste du
// Pre-Flight.

export const fieldClass =
  "w-full rounded-md bg-ink-850 px-4 py-2.5 text-sm text-ink-050 ring-1 ring-white/10 outline-none transition-colors duration-300 placeholder:text-ink-400 focus:ring-brand-400";

export const labelClass = "mb-1.5 block text-xs font-semibold text-ink-300";

export const primaryButton =
  "rounded-full bg-brand-500 px-6 py-3 text-sm font-bold whitespace-nowrap text-white transition-colors duration-300 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed";

export const secondaryButton =
  "rounded-full bg-white/5 px-6 py-3 text-sm font-bold whitespace-nowrap text-ink-100 ring-1 ring-white/10 transition-colors duration-300 hover:bg-white/10 disabled:opacity-50";
