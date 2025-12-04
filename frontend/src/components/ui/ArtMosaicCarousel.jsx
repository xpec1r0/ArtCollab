// src/components/ui/ArtMosaicCarousel.jsx
import React, { useState, useEffect, useCallback } from "react";

const ArtMosaicCarousel = ({ slides = [] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [modalImage, setModalImage] = useState(null);

  const hasSlides = slides && slides.length > 0;

  useEffect(() => {
    if (!hasSlides) return;
    if (currentIndex >= slides.length) {
      setCurrentIndex(0);
    }
  }, [currentIndex, slides, hasSlides]);

  const next = () => {
    if (!hasSlides) return;
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  const prev = () => {
    if (!hasSlides) return;
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const openModal = (src, alt) => {
    if (!src) return;
    setModalImage({ src, alt });
  };

  const closeModal = useCallback(() => {
    setModalImage(null);
  }, []);

  useEffect(() => {
    if (!modalImage) return;

    const handler = (e) => {
      if (e.key === "Escape") {
        closeModal();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [modalImage, closeModal]);

  useEffect(() => {
    if (!modalImage) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [modalImage]);

  if (!hasSlides) return null;

  const currentSlide = slides[currentIndex];
  const isMosaic = currentSlide.type === "mosaic";
  const isStory = currentSlide.type === "story";

  return (
    <>
      {/* CARRUSEL */}
      <div className="slideshow-wrapper">
        {/* Flechas */}
        <button
          className="arrow left"
          type="button"
          onClick={prev}
          aria-label="Previous slide"
        >
          ‹
        </button>

        <button
          className="arrow right"
          type="button"
          onClick={next}
          aria-label="Next slide"
        >
          ›
        </button>

        {/* CONTENEDOR DE SLIDE */}
        <div
          className={
            "slideshow-container fade " +
            (isStory ? "story-layout" : "mosaic-layout")
          }
        >
          {/* LAYOUT MOSAICO */}
          {isMosaic && (
            <>
              <div className="big-img">
                <img
                  src={currentSlide.hero}
                  alt={currentSlide.heroAlt || "Artwork"}
                  onClick={() =>
                    openModal(currentSlide.hero, currentSlide.heroAlt)
                  }
                />
              </div>

              {currentSlide.columns?.map((column, colIndex) => (
                <div className="col" key={`col-${currentSlide.id}-${colIndex}`}>
                  {column.map((imgObj, imgIndex) => (
                    <img
                      key={`${imgObj.src}-${imgIndex}`}
                      src={imgObj.src}
                      alt={imgObj.alt || ""}
                      onClick={() => openModal(imgObj.src, imgObj.alt)}
                    />
                  ))}
                </div>
              ))}
            </>
          )}

          {/* LAYOUT STORY */}
          {isStory && (
            <>
              <div className="story-content">
                {currentSlide.eyebrow && (
                  <p className="story-eyebrow">{currentSlide.eyebrow}</p>
                )}
                <h3 className="story-title h-display">
                  {currentSlide.headline}
                </h3>
                {currentSlide.excerpt && (
                  <p className="story-excerpt">{currentSlide.excerpt}</p>
                )}
                {currentSlide.link && currentSlide.ctaLabel && (
                  <a
                    href={currentSlide.link}
                    className="read-more-btn"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {currentSlide.ctaLabel}
                  </a>
                )}
              </div>

              <div className="story-image">
                <img
                  src={currentSlide.image}
                  alt={
                    currentSlide.imageAlt || currentSlide.headline || "Artwork"
                  }
                  onClick={() =>
                    openModal(
                      currentSlide.image,
                      currentSlide.imageAlt || currentSlide.headline
                    )
                  }
                />
              </div>
            </>
          )}
        </div>

        {/* DOTS */}
        <div className="slideshow-dots">
          {slides.map((slide, index) => (
            <button
              key={slide.id || index}
              type="button"
              className={
                "slideshow-dot" + (index === currentIndex ? " is-active" : "")
              }
              onClick={() => setCurrentIndex(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* MODAL / LIGHTBOX */}
      {modalImage && (
        <div className="media-modal" onClick={closeModal}>
          <div
            className="media-modal-inner"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <button
              className="media-modal-close"
              type="button"
              onClick={closeModal}
              aria-label="Close image preview"
            >
              ×
            </button>
            <img
              src={modalImage.src}
              alt={modalImage.alt || "Artwork preview"}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default ArtMosaicCarousel;
