import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react"; 

const Pagination = ({ totalPages, currentPage, handlePageChange, handlePreviousPage, handleNextPage }) => {
  
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
      pageNumbers.push(i);
    } else if (i === currentPage - 3 || i === currentPage + 3) {
      pageNumbers.push("...");
    }
  }

  return (
    <div className="flex justify-center items-center gap-2 mt-6">
      {/* ✅ Bouton précédent */}
      <button
        onClick={handlePreviousPage}
        disabled={currentPage === 1}
        className={`p-2 rounded-md border border-gray-500 transition-all duration-300 ${
          currentPage === 1 ? "cursor-not-allowed opacity-50" : "hover:bg-gray-700"
        }`}
      >
        <ChevronLeft size={20} />
      </button>

      {/* ✅ Numéros de page */}
      {pageNumbers.map((number, index) => (
        <button
          key={index}
          onClick={() => number !== "..." && handlePageChange(number)}
          className={`px-3 py-1 rounded-md transition-all duration-300 ${
            currentPage === number
              ? "bg-blue-500 text-white font-semibold"
              : "bg-gray-800 text-gray-300 hover:bg-gray-700"
          }`}
          disabled={number === "..."}
        >
          {number}
        </button>
      ))}

      {/* ✅ Bouton suivant */}
      <button
        onClick={handleNextPage}
        disabled={currentPage === totalPages}
        className={`p-2 rounded-md border border-gray-500 transition-all duration-300 ${
          currentPage === totalPages ? "cursor-not-allowed opacity-50" : "hover:bg-gray-700"
        }`}
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
};

export default Pagination;
