import { Carousel } from "react-responsive-carousel";
import { Link } from "react-router-dom";
import { BookOpen } from "lucide-react";
import PropTypes from "prop-types";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import "../Css/ImageSlider.css";
import { SkeletonBanner } from "./Skeleton";
import usePrefersReducedMotion from "../hooks/usePrefersReducedMotion";
import { cleanText } from "../utils/date";
import { proxyImage } from "../utils/mangadex";

// Le résumé était tronqué à 200 caractères, ce qui produisait jusqu'à six
// lignes dans le héros. Le Pre-Flight impose un sous-texte de 20 mots et 4
// lignes au maximum.
const MAX_WORDS = 20;

const shorten = (text) => {
  if (!text) return "";
  const cleaned = cleanText(text);
  const words = cleaned.split(/\s+/);
  if (words.length <= MAX_WORDS) return cleaned;
  return `${words.slice(0, MAX_WORDS).join(" ")}...`;
};

/**
 * Héros du catalogue.
 *
 * Le carrousel reste la signature identifiée à l'audit : image pleine largeur,
 * dégradé vers le fond, vignette de couverture superposée. La recomposition
 * porte sur la discipline du héros, pas sur le principe.
 *
 * Corrections : titre limité à deux lignes, résumé plafonné à vingt mots,
 * appel à l'action désormais présent, pastilles de genre superposées retirées,
 * défilement automatique ralenti et coupé si l'utilisateur demande une
 * réduction des animations.
 */
const ImageSlider = ({ mangaList }) => {
  const prefersReducedMotion = usePrefersReducedMotion();

  if (!mangaList) return <SkeletonBanner />;
  if (mangaList.length === 0) return null;

  return (
    <section aria-label="Featured titles" className="relative">
      <Carousel
        showArrows
        showThumbs={false}
        showStatus={false}
        showIndicators
        infiniteLoop
        swipeable
        stopOnHover
        dynamicHeight={false}
        // Coupé net si la préférence système le demande, et ralenti de 3 à 7
        // secondes : trois secondes ne laissaient pas le temps de lire.
        autoPlay={!prefersReducedMotion}
        interval={7000}
        transitionTime={prefersReducedMotion ? 0 : 600}
      >
        {mangaList.map((slide) => (
          <article key={slide.id} className="relative text-left">
            <div className="relative h-[62vh] min-h-[26rem] w-full overflow-hidden">
              <img
                referrerPolicy="no-referrer"
                src={proxyImage(slide.image)}
                alt={cleanText(slide.title)}
                decoding="async"
                className="h-full w-full object-cover object-[center_25%]"
              />
              {/* Deux dégradés superposés : l'un vers le bas pour raccorder au
                  fond de page, l'autre vers la droite pour garantir le
                  contraste du texte quelle que soit l'illustration. */}
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/70 to-transparent"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-r from-ink-950/90 via-ink-950/30 to-transparent"
              />
            </div>

            <div className="container-page absolute inset-x-0 bottom-0 pb-14 md:pb-20">
              <div className="flex max-w-2xl flex-col items-start gap-4">
                <h2 className="line-clamp-2 text-3xl text-ink-050 md:text-4xl">
                  {cleanText(slide.title)}
                </h2>

                <p className="line-clamp-3 max-w-[65ch] text-sm text-ink-300 md:text-base">
                  {shorten(slide.description?.en)}
                </p>

                <Link
                  to={`/manga/${slide.id}`}
                  className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-6 py-3 text-sm font-bold whitespace-nowrap text-white transition-colors duration-300 hover:bg-brand-600"
                >
                  <BookOpen size={18} strokeWidth={2} />
                  View this title
                </Link>
              </div>
            </div>
          </article>
        ))}
      </Carousel>
    </section>
  );
};

ImageSlider.propTypes = {
  mangaList: PropTypes.array,
};

export default ImageSlider;
