import React, { useState, useEffect, useCallback, useMemo } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import type { EmblaOptionsType } from 'embla-carousel';
import Image from 'next/image';

type PhotoSliderProps = {
  images: string[];
  options?: EmblaOptionsType;
};

const PhotoSlider: React.FC<PhotoSliderProps> = ({ images, options }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  const [emblaMainRef, emblaMainApi] = useEmblaCarousel({
    ...options,
    loop: true,
  });
  const [emblaThumbsRef, emblaThumbsApi] = useEmblaCarousel({
    containScroll: 'keepSnaps',
    dragFree: true,
  });
  const [emblaZoomRef, emblaZoomApi] = useEmblaCarousel({
    ...options,
    startIndex: selectedIndex,
    loop: true,
  });

  const lowResImages = useMemo(() => {
    return images.map((src) =>
      src.includes('?') ? `${src}&tr=w-200` : `${src}?tr=w-200`
    );
  }, [images]);

  const onThumbClick = useCallback(
    (index: number) => {
      if (!emblaMainApi) return;
      emblaMainApi.scrollTo(index);
    },
    [emblaMainApi]
  );

  const onSelect = useCallback(() => {
    if (!emblaMainApi || !emblaThumbsApi) return;
    const index = emblaMainApi.selectedScrollSnap();
    setSelectedIndex(index);
    emblaThumbsApi.scrollTo(index);
  }, [emblaMainApi, emblaThumbsApi]);

  const scrollPrev = () => emblaMainApi?.scrollPrev();
  const scrollNext = () => emblaMainApi?.scrollNext();

  useEffect(() => {
    if (!emblaMainApi) return;
    onSelect();
    emblaMainApi.on('select', onSelect).on('reInit', onSelect);
    return () => {
      if (!emblaMainApi) return;
      emblaMainApi.off('select', onSelect).off('reInit', onSelect);
    };
  }, [emblaMainApi, onSelect]);

  useEffect(() => {
    if (!emblaZoomApi) return;
    emblaZoomApi.scrollTo(selectedIndex);
  }, [emblaZoomApi, selectedIndex]);

  useEffect(() => {
    if (isZoomOpen) {
      const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;
      document.body.classList.add('overflow-hidden');
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    } else {
      document.body.classList.remove('overflow-hidden');
      document.body.style.paddingRight = '';
    }
    return () => {
      document.body.classList.remove('overflow-hidden');
      document.body.style.paddingRight = '';
    };
  }, [isZoomOpen]);

  return (
    <>
      <div className="w-full lg:max-w-2xl mb-6">
        {/* Main Carousel */}
        <div
          className="relative overflow-hidden cursor-grab group"
          ref={emblaMainRef}
        >
          <div className="flex">
            {images.map((src, idx) => (
              <div className="flex-[0_0_100%] px-1" key={idx}>
                <div
                  onClick={() => setIsZoomOpen(true)}
                  className="relative w-full aspect-[4/3] overflow-hidden rounded-md bg-gray-100"
                >
                  {/* Фоновое размытие */}
                  <Image
                    src={lowResImages[idx]}
                    alt=""
                    fill
                    className="absolute inset-0 w-full h-full object-cover filter blur-lg opacity-50"
                    aria-hidden="true"
                  />
                  {/* Плавный переход появления главного фото */}
                  <Image
                    src={src}
                    alt={`Фото ${idx + 1}`}
                    loading="lazy"
                    fill
                    className="relative w-full h-full object-contain transition-opacity duration-500"
                    style={{ opacity: 1 }}
                  />
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={scrollPrev}
            className="absolute hidden md:flex opacity-0 group-hover:opacity-100 transition left-4 top-1/2 p-4 border border-violet-400 rounded-full -translate-y-1/2 text-neutral-800 bg-white/70 text-4xl hover:bg-white/80"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="size-6 -translate-x-0.5 stroke-violet-400"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 19.5 8.25 12l7.5-7.5"
              />
            </svg>
          </button>
          <button
            onClick={scrollNext}
            className="absolute hidden md:flex opacity-0 group-hover:opacity-100 transition right-4 top-1/2 p-4 border border-violet-400 rounded-full -translate-y-1/2 text-neutral-800 bg-white/70 text-4xl hover:bg-white/80"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="size-6 translate-x-0.5 stroke-violet-400"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m8.25 4.5 7.5 7.5-7.5 7.5"
              />
            </svg>
          </button>
        </div>

        {/* Thumbnails */}
        <div className="mt-4 overflow-hidden" ref={emblaThumbsRef}>
          <div className="flex gap-2 px-1">
            {lowResImages.map((thumbSrc, idx) => (
              <button
                key={idx}
                onClick={() => onThumbClick(idx)}
                className={`relative rounded-md overflow-hidden w-20 h-20 border-2 ${
                  idx === selectedIndex
                    ? 'border-violet-400'
                    : 'border-neutral-100'
                }`}
              >
                <Image
                  src={thumbSrc}
                  alt={`Миниатюра ${idx + 1}`}
                  fill
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      </div>
      {isZoomOpen && (
        <div
          onClick={() => setIsZoomOpen(false)}
          className="fixed mb-0 inset-0 z-50 bg-neutral-200/50 bg-opacity-90 backdrop-blur-xl flex flex-col justify-center items-center group"
        >
          <div
            className="w-full h-full max-h-screen overflow-hidden cursor-grab"
            ref={emblaZoomRef}
          >
            <div className="flex h-full">
              {images.map((src, idx) => (
                <div
                  className="flex-[0_0_100%] flex justify-center items-center"
                  key={idx}
                >
                  <div className="relative max-w-[1200px] w-full h-[75vh] max-h-screen">
                    <Image
                      src={src}
                      alt={`Увеличенное фото ${idx + 1}`}
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="absolute top-3 right-6 md:top-4 md:right-12">
            <button
              onClick={() => setIsZoomOpen(false)}
              className="text-neutral-800 w-12 h-12 text-xl md:w-18 md:h-18 md:text-3xl flex items-center justify-center border border-neutral-800 p-4 font-bold z-[100] bg-white/70 rounded-full hover:bg-white"
            >
              ✕
            </button>
          </div>
          {/* Стрелки внутри зума */}
          <button
            onClick={(e) => {
              emblaZoomApi?.scrollPrev();
              e.stopPropagation();
            }}
            className="absolute hidden md:flex opacity-0 group-hover:opacity-100 transition left-12 top-1/2 p-4 border border-violet-400 rounded-full -translate-y-1/2 text-neutral-800 bg-white/70 text-4xl hover:bg-white/80"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="size-8 -translate-x-0.5 stroke-violet-400"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 19.5 8.25 12l7.5-7.5"
              />
            </svg>
          </button>
          <button
            onClick={(e) => {
              emblaZoomApi?.scrollNext();
              e.stopPropagation();
            }}
            className="absolute hidden md:flex opacity-0 group-hover:opacity-100 transition right-12 top-1/2 p-4 border border-violet-400 rounded-full -translate-y-1/2 text-neutral-800 bg-white/70 text-4xl hover:bg-white/80"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="size-8 translate-x-0.5 stroke-violet-400"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m8.25 4.5 7.5 7.5-7.5 7.5"
              />
            </svg>
          </button>
        </div>
      )}
    </>
  );
};

export default PhotoSlider;
