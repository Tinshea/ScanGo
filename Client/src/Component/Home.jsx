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
          setError(messageFromError(err, "Could not load the catalogue."));
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
        description="Read manga online on ScanGo. Full catalogue, latest releases, genre search, immersive reader and reading history."
      />

      {/* Un seul h1 par page, placé en tête du document. La page portait
          auparavant deux h1 (« Nouveauté » et « Explorer »), tous deux situés
          après des h2 et des h3. Il reste hors flux visuel : le héros est un
          carrousel, dont le titre change et ne peut pas servir de titre de
          page. */}
      <h1 className="sr-only-focusable">
        ScanGo, read manga online
      </h1>

      {error && (
        <p role="alert" className="container-page py-6 text-center text-brand-400">
          {error}
        </p>
      )}

      <ImageSlider mangaList={popularMangaList} />

      <DisplayList
        title="Latest"
        description="The latest titles added to the catalogue"
        mangaList={newMangaList}
        section="nouveaute"
      />

      <DisplayList
        title="Browse"
        description="Browse the whole catalogue"
        mangaList={mangaList}
        section="explorer"
      />
    </>
  );
};

export default Home;
