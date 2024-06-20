import { Carousel } from 'react-responsive-carousel';
import { useNavigate } from 'react-router-dom';
import '../Css/ImageSlider.css';
import "react-responsive-carousel/lib/styles/carousel.min.css";
import LoadingComponent from './LoadingComponent';

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
      {mangaList.map((slide, index) => (
        <div key={index} onClick={() => handleMangaClick(slide.id)} className="carousel-item">
          <div className="carousel-overlay">
            <img src={slide.image} alt={`Slide ${index + 1}`}  className="main-image" />
          </div>
          <div className="carousel-overlay-preview">
            <img src={slide.image} alt={`Slide ${index + 1}`}  className="preview-image" />
          </div>
          <div className="carousel-flag-preview">
            <img src={slide.flag} alt={`Slide ${index + 1}`}  className="flag-image" />
          </div>
          <div className="carousel-caption">
            <h3>{slide.title}</h3>
            <p>{slide.description ? slide.description.en : 'No description available'}</p>
          </div>
        </div>
      ))}
    </Carousel>
  );
};

export default ImageSlider;
