import React from 'react';
import '../Css/Pagination.css'; // Assurez-vous que le chemin est correct pour le CSS

const Pagination = ({ totalPages, currentPage, handlePageChange, handlePreviousPage, handleNextPage }) => {
  
  // Décider du nombre de boutons de page à afficher autour de la page courante
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    // Si c'est la première page, la dernière page, ou une page autour de la page courante, on l'affiche
    if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
      pageNumbers.push(i);
    } else if (i === currentPage - 3 || i === currentPage + 3) {
      // Si c'est juste à l'extérieur de la plage visible, on met les ellipses
      pageNumbers.push('...');
    }
  }

  return (
    <div className="pagination">
      <button
        onClick={handlePreviousPage}
        disabled={currentPage === 1}
        className="prev"
      >
        &lt;
      </button>
      {pageNumbers.map((number, index) => (
        <button
          key={index}
          onClick={() => number !== '...' && handlePageChange(number)}
          className={`page-number ${currentPage === number ? 'active' : ''}`}
          disabled={number === '...'}
        >
          {number}
        </button>
      ))}
      <button
        onClick={handleNextPage}
        disabled={currentPage === totalPages}
        className="next"
      >
        &gt;
      </button>
    </div>
  );
};

export default Pagination;
