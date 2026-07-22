import { Link } from "react-router-dom";
import Seo from "./Seo";

// Page affichée pour toute URL inconnue.
const NotFound = () => (
  <div className="container-page flex min-h-[60vh] flex-col items-center justify-center gap-4 py-16 text-center">
    <Seo title="Page not found" path="/404" noindex />

    <p className="font-display text-5xl font-bold text-brand-500">404</p>
    <h1 className="text-2xl text-ink-050">Page not found</h1>
    <p className="max-w-md text-sm text-ink-400">
      This page does not exist or is no longer available.
    </p>
    <Link
      to="/"
      className="mt-2 rounded-full bg-brand-500 px-6 py-3 text-sm font-bold whitespace-nowrap text-white transition-colors duration-300 hover:bg-brand-600"
    >
      Back to home
    </Link>
  </div>
);

export default NotFound;
