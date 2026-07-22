import React, { useEffect, useState } from "react";
import ImageSlider from "./ImageSlider";
import DisplayList from "./DisplayList";
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
    <div className="bg-[#050816]">
      {/* L'échec de chargement était uniquement journalisé en console : la page
          restait bloquée sur un indicateur de chargement sans explication. */}
      {error && (
        <p className="text-red-400 text-center py-6" role="alert">
          {error}
        </p>
      )}

      <ImageSlider mangaList={popularMangaList} />
      <DisplayList title="Nouveauté" mangaList={newMangaList} section="nouveaute" />
      <DisplayList title="Explorer" mangaList={mangaList} section="explorer" />
    </div>
  );
};

export default Home;
