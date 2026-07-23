/**
 * Pied de page global.
 *
 * Porte les mentions imposées par la politique d'utilisation de l'API MangaDex :
 * attribution de la source, absence d'affiliation, caractère non commercial, et
 * un contact pour les demandes de retrait des groupes de scanlation. Le crédit
 * du groupe qui a traduit un chapitre donné est affiché, lui, dans le lecteur.
 */
const Footer = () => (
  <footer className="mt-auto border-t border-white/5 bg-ink-950">
    <div className="container-page flex flex-col gap-3 py-10 text-xs leading-relaxed text-ink-500">
      <p>
        <span className="font-semibold text-ink-200">ScanGo</span> is a personal,
        non-commercial project — no ads, nothing for sale.
      </p>
      <p className="max-w-3xl">
        Manga data and scanlations are provided by{" "}
        <a
          href="https://mangadex.org"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-ink-300 transition-colors duration-200 hover:text-brand-400"
        >
          MangaDex
        </a>
        . All titles, chapters and translations belong to their respective
        authors and scanlation groups. ScanGo is not affiliated with, endorsed by,
        or sponsored by MangaDex.
      </p>
      <p>
        Are you a scanlation group and want your work removed? Email{" "}
        <a
          href="mailto:malek.bouzarkouna@proton.me"
          className="font-semibold text-ink-300 transition-colors duration-200 hover:text-brand-400"
        >
          malek.bouzarkouna@proton.me
        </a>
        .
      </p>
    </div>
  </footer>
);

export default Footer;
