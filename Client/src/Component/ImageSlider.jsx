import { Carousel } from 'react-responsive-carousel';
import { useNavigate } from 'react-router-dom';
import '../Css/ImageSlider.css';
import "react-responsive-carousel/lib/styles/carousel.min.css";
import LoadingComponent from './LoadingComponent';

const MAX_DESCRIPTION_LENGTH = 200; // Nombre max de caractères avant de tronquer

const ImageSlider = ({ mangaList }) => {
  let navigate = useNavigate();

  if (!mangaList) {
    return (
      <div>
        <LoadingComponent />
      </div>
    );
  }

  const handleMangaClick = (id) => {
    navigate(`/manga/${id}`);
  };

  return (
    <Carousel
      showArrows={true}
      autoPlay={true}
      interval={3000}
      infiniteLoop={true}
      showThumbs={false}
      showStatus={false}
      stopOnHover={true}
      swipeable={true}
      dynamicHeight={false}
    >
      {mangaList.map((slide, index) => {
        const description = slide.description?.en || "No description available";
        const isLongDescription = description.length > MAX_DESCRIPTION_LENGTH;
        const shortDescription = isLongDescription
          ? `${description.substring(0, MAX_DESCRIPTION_LENGTH)}...`
          : description;

        return (
          <div key={index} onClick={() => handleMangaClick(slide.id)} className="carousel-item">
            <div className="inline-block w-full bg-gradient-to-b from-transparent to-[#050816]">
              <img src={slide.image} alt={`Slide ${index + 1}`} className="main-image" />
            </div>
            <div className="carousel-overlay-preview">
              <img src={slide.image} alt={`Slide ${index + 1}`} className="preview-image" />
            </div>
            <div className="carousel-flag-preview">
              <img src={slide.flag} alt={`Slide ${index + 1}`} className="flag-image" />
            </div>
            <div className="flex sm:flex-col absolute bottom-[5%] left-1/2 -translate-x-1/2 w-full h-[14vh] p-2 md:p-4 text-white text-left text-base box-border overflow-hidden ml-[10px]">
              <h3 className="font-extrabold text-rose-600">{slide.title}</h3>
              <p className='hidden sm:block'>
                {shortDescription}
                {isLongDescription && (
                  <span
                    className="font-bold cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation(); // Empêche le clic de déclencher handleMangaClick
                      handleMangaClick(slide.id);
                    }}
                  >
                    Voir la suite
                  </span>
                )}
              </p>
              <div className="sm:flex hidden flex-wrap">
                {(slide.genre || []).map((genre, index) => (
                  <p
                    key={`genre-${index}`}
                    className="items-center flex justify-center bg-[#050816] text-white  text-xs px-2 py-1 rounded-full mr-2 mb-2"
                  >
                    {genre}
                  </p>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </Carousel>
  );
};

export default ImageSlider;
