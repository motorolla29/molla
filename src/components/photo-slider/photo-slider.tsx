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
  const [emblaMainRef, emblaMainApi] = useEmblaCarousel(options);
  const [emblaThumbsRef, emblaThumbsApi] = useEmblaCarousel({
    containScroll: 'keepSnaps',
    dragFree: true,
  });

  const lowResImages = useMemo(() => {
    return images.map((src) =>
      src.includes('?') ? `${src}&tr=w-200` : `${src}?tr=w-200`
    );
  }, [images]);

  const onThumbClick = useCallback(
    (index: number) => {
      if (!emblaMainApi || !emblaThumbsApi) return;
      emblaMainApi.scrollTo(index);
    },
    [emblaMainApi, emblaThumbsApi]
  );

  const onSelect = useCallback(() => {
    if (!emblaMainApi || !emblaThumbsApi) return;
    const index = emblaMainApi.selectedScrollSnap();
    setSelectedIndex(index);
    emblaThumbsApi.scrollTo(index);
  }, [emblaMainApi, emblaThumbsApi]);

  useEffect(() => {
    if (!emblaMainApi) return;
    onSelect();
    emblaMainApi.on('select', onSelect).on('reInit', onSelect);
    return () => {
      if (!emblaMainApi) return;
      emblaMainApi.off('select', onSelect).off('reInit', onSelect);
    };
  }, [emblaMainApi, onSelect]);

  return (
    <div className="w-full lg:max-w-2xl mb-6">
      {/* Main Carousel */}
      <div className="overflow-hidden" ref={emblaMainRef}>
        <div className="flex">
          {images.map((src, idx) => (
            <div className="flex-[0_0_100%] px-1" key={idx}>
              <div className="relative w-full aspect-[4/3] overflow-hidden rounded-md bg-gray-100">
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
      </div>

      {/* Thumbnails */}
      <div className="mt-4 overflow-hidden" ref={emblaThumbsRef}>
        <div className="flex gap-2 px-1">
          {lowResImages.map((thumbSrc, idx) => (
            <button
              key={idx}
              onClick={() => onThumbClick(idx)}
              className={`relative rounded-md overflow-hidden w-20 h-20 border-2 ${
                idx === selectedIndex ? 'border-violet-400' : 'border-stone-100'
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
  );
};

export default PhotoSlider;
