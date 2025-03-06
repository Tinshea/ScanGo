import LoadingComponent from "./LoadingComponent";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpDown } from "lucide-react"; // Import de l'icône de double flèche

const ChapterList = ({ mangaDetails }) => {
  const [mangaChapters] = useState(mangaDetails.chapters);
  const [isReversed, setIsReversed] = useState(false);
  const navigate = useNavigate();

  if (!mangaChapters) {
    return <LoadingComponent />;
  }

  const timeSince = (publishDate) => {
    const chapterDate = new Date(publishDate);
    const now = new Date();
    const diffTime = now - chapterDate;
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));

    if (diffHours < 24) {
      const diffMinutes = Math.ceil(diffTime / (1000 * 60));
      return diffMinutes < 60
        ? `il y a ${diffMinutes} minute(s)`
        : `il y a ${diffHours} heure(s)`;
    } else {
      return chapterDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
  };

  const displayedChapters = isReversed
    ? [...mangaChapters].reverse()
    : mangaChapters;

  const handleReverseClick = () => {
    setIsReversed(!isReversed);
  };

  const handleChapterSelect = (chapterId) => {
    navigate(`/chapter/${chapterId}`, {
      state: { mangaDetails: mangaDetails },
    });
  };

  return (
    <div className="flex flex-col items-center  p-4 bg-gray-900 rounded-lg shadow-lg">
      {/* Bouton de tri avec ShadCN et icône */}
      <button
        onClick={handleReverseClick}
        className=" flex items-center justify-center gap-2 px-4 py-2 border border-gray-500 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-md transition"
      >
        <ArrowUpDown className="w-5 h-5" />
        {isReversed ? "Ordre Croissant" : "Ordre Décroissant"}
      </button>

      {/* Liste des chapitres avec SCROLLING */}
      <div className="max-h-[500px] w-full overflow-y-auto scrollbar-hide mt-4">
        <div className="space-y-2">
          {displayedChapters.map((chapter, index) => (
            <div
              key={chapter.id}
              className="flex justify-between items-center bg-gray-800 hover:bg-gray-700 px-4 py-3 rounded-md cursor-pointer transition"
              onClick={() => handleChapterSelect(chapter.id)}
            >
              <div className="text-white text-sm font-medium">
                Chapter {chapter.attributes.chapter}: {chapter.attributes.title}
              </div>
              <div className="text-gray-400 text-xs italic">
                {timeSince(chapter.attributes.publishAt)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChapterList;
