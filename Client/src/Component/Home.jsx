import { useEffect, useState } from "react";
import ImageSlider from "./ImageSlider";
import DisplayList from "./DisplayList";
import Seo from "./Seo";
import api, { messageFromError } from "../api";

const Home = () => {
  const [mangaList, setMangaList] = useState(null);
  const [newMangaList, setNewMangaList] = useState(null);
  const [popularMangaList, setPopularMangaList] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      setError("");
      try {
        const res = await api.get("/Home");
        if (cancelled) return;
        setNewMangaList(res.data.Newestmangalist || []);
        setMangaList(res.data.Mangalist || []);
        setPopularMangaList(res.data.Popularmangalist || []);
      } catch (err) {
        if (!cancelled) {
          setError(messageFromError(err, "Impossible de charger le catalogue."));
          setNewMangaList([]);
          setMangaList([]);
          setPopularMangaList([]);
        }
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <Seo
        path="/"
        description="Lisez des mangas en ligne sur MangaGo. Catalogue complet, nouveautés, recherche par genre, lecteur immersif et suivi de vos lectures."
      />

      {/* Un seul h1 par page, placé en tête du document. La page portait
          auparavant deux h1 (« Nouveauté » et « Explorer »), tous deux situés
          après des h2 et des h3. Il reste hors flux visuel : le héros est un
          carrousel, dont le titre change et ne peut pas servir de titre de
          page. */}
      <h1 className="sr-only-focusable">
        MangaGo, lecteur de mangas en ligne
      </h1>

      {error && (
        <p role="alert" className="container-page py-6 text-center text-brand-400">
          {error}
        </p>
      )}

      <ImageSlider mangaList={popularMangaList} />

      <DisplayList
        title="Nouveautés"
        description="Les derniers titres ajoutés au catalogue"
        mangaList={newMangaList}
        section="nouveaute"
      />

      <DisplayList
        title="Explorer"
        description="Parcourir l'ensemble du catalogue"
        mangaList={mangaList}
        section="explorer"
      />
    </>
  );
};

export default Home;
