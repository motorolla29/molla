'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { AdBase } from '@/types/ad';
import { YMaps, Map, Placemark } from '@pbe/react-yandex-maps';
import { lockScroll, unlockScroll } from '@/utils/scroll-lock';

// Варианты анимации для модального окна карты
const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const modalVariants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
    y: 20,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    y: 15,
  },
};

interface MapModalProps {
  isOpen: boolean;
  onClose: () => void;
  ad: AdBase;
}

export default function MapModal({ isOpen, onClose, ad }: MapModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [showMap, setShowMap] = useState(false);

  // Блокируем скролл страницы при открытом модальном окне
  useEffect(() => {
    if (!isOpen) return;
    lockScroll();

    return () => {
      // Ждем завершения анимации выхода перед разблокировкой скролла
      setTimeout(() => {
        unlockScroll();
      }, 250);
    };
  }, [isOpen]);

  // Управление показом карты (отложить до завершения анимации)
  useEffect(() => {
    if (isOpen) {
      // Показываем карту после завершения анимации входа
      const timer = setTimeout(() => {
        setShowMap(true);
      }, 200);
      return () => clearTimeout(timer);
    } else {
      // Скрываем карту сразу при закрытии
      setShowMap(false);
    }
  }, [isOpen]);

  // Закрытие по клику вне модального окна
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Состояние карты
  const mapState = {
    center: [ad.location.lat || 55.75, ad.location.lng || 37.57],
    zoom: 16,
  };

  // Размеры иконки маркера
  const iconWidth = 50;
  const iconHeight = 69;
  const iconOffsetX = -25;
  const iconOffsetY = -69;

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <YMaps query={{ apikey: process.env.NEXT_PUBLIC_YANDEX_MAP_API_KEY }}>
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.25, ease: 'easeOut' }}
            onClick={onClose}
          >
            <motion.div
              ref={modalRef}
              className="bg-white rounded-2xl max-w-4xl w-full h-[80vh] shadow-2xl flex flex-col overflow-hidden"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{
                duration: 0.35,
                ease: 'easeOut',
                type: 'spring',
                //damping: 20,
                //stiffness: 200,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Заголовок */}
              <div className="flex items-center justify-between p-4 sm:p-6 pb-3 sm:pb-4 border-b border-gray-100">
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                    {ad.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    {ad.city}
                    {ad.address ? `, ${ad.address}` : ''}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <XMarkIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                </button>
              </div>

              {/* Карта */}
              <div className="flex-1 relative">
                {showMap ? (
                  <Map
                    state={mapState}
                    width="100%"
                    height="100%"
                    options={{
                      suppressMapOpenBlock: true,
                    }}
                  >
                    <Placemark
                      geometry={[ad.location.lat, ad.location.lng]}
                      properties={{
                        balloonContentHeader: ad.title,
                        balloonContentBody: `${ad.city}${
                          ad.address ? `, ${ad.address}` : ''
                        }`,
                        balloonContentFooter: `${ad.price?.toLocaleString(
                          'ru-RU'
                        )} ${ad.currency}`,
                        hintContent: ad.title,
                      }}
                      options={{
                        iconLayout: 'default#image',
                        iconImageHref: `https://ik.imagekit.io/motorolla29/molla/icons/${ad.category}-map-marker.png`,
                        iconImageSize: [iconWidth, iconHeight],
                        iconImageOffset: [iconOffsetX, iconOffsetY],
                      }}
                    />
                  </Map>
                ) : (
                  // Заглушка во время анимации
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    <div className="text-gray-500">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 border-2 border-gray-300 border-t-violet-500 rounded-full animate-spin mx-auto mb-1 sm:mb-2" />
                      <p className="text-xs sm:text-sm">Загрузка карты...</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        </YMaps>
      )}
    </AnimatePresence>
  );
}
