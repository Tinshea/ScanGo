import React from "react";
import ChapterList from "./ChapterList";
import Manga from "./Manga";
import LoadingComponent from "./LoadingComponent";

const DisplayMangaSeen = ({ mangaSeenList }) => {
  if (!mangaSeenList) {
    return (
      <div>
        <h1 className="text-xl font-semibold text-white my-4">📖 Mangas lus</h1>
        <LoadingComponent />
      </div>
    );
  }

  return (
    <div className="mt-6 bg-gray-800 p-6 rounded-lg shadow-lg">

      <div className="grid gap-6">
        {mangaSeenList.map((manga, index) => (
          <div
            key={index}
            className="flex flex-col md:flex-row items-start bg-gray-900 p-4 rounded-lg shadow-md "
          >
            {/* ✅ Image du manga */}
            <div className="flex items-center justify-center w-full">
              <Manga mangaData={manga} />
            </div>

            {/* ✅ Liste des chapitres */}
            <div className="w-full">
              <ChapterList mangaDetails={manga} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DisplayMangaSeen;
