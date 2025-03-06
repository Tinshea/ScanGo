import {React, useEffect, useState } from 'react';
import ImageSlider from './ImageSlider';
import axios from 'axios';
import DisplayList from './DisplayList';

const Home = ( ) => {
  const [mangaList, setMangaList] = useState(null);
  const [newMangaList, setNewMangaList] = useState(null);
  const [popularMangaList, setPopularMangaList] = useState(null);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get("/api/Home");
        setNewMangaList(res.data.Newestmangalist);
        setMangaList(res.data.Mangalist);
        setPopularMangaList(res.data.Popularmangalist)
      } catch (error) {
        console.error("Erreur lors de la récupération des données :", error);
      }
    };
  
    fetchData();
  }, []);

  return (
    <div className='bg-[#050816]'>
      <ImageSlider  mangaList={popularMangaList} />
      <DisplayList title="Nouveauté" mangaList={newMangaList} />
      <DisplayList title="Explorer" mangaList={mangaList} />
    </div>
  );
};

export default Home;