'use client';

import { AdBase } from '@/types/ad';
import { YMaps, Map, Placemark, Clusterer } from '@pbe/react-yandex-maps';
import { useLocationStore } from '@/store/useLocationStore';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';

interface MapMarker {
  id: string;
  location: {
    lat: number;
    lng: number;
  };
  title: string;
  category: string;
  price?: number;
  photos: string[];
}

interface MapGlProps {
  ads?: AdBase[]; // Сделали опциональным для динамической загрузки
  onPinClick?: (ad: AdBase) => void;
  onClusterClick?: (adsInCluster: AdBase[]) => void;
  minZoom?: number;
  maxZoom?: number;
  cityLabel?: string;
  category?: string;
}

export default function MapGl({
  ads = [],
  onPinClick,
  onClusterClick,
  minZoom = 3,
  maxZoom = 18,
  cityLabel,
  category,
}: MapGlProps) {
  const { lat: storeLat, lon: storeLon } = useLocationStore();
  const searchParams = useSearchParams();
  const DEFAULT_CENTER: [number, number] = [55.75, 37.57]; // Москва
  const DEFAULT_ZOOM = 4;
  const CITY_ZOOM = 11;

  // Состояние для динамически загружаемых маркеров
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [loadingMarkers, setLoadingMarkers] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  const targetCenter = useMemo<[number, number]>(() => {
    if (storeLat && storeLon) return [storeLat, storeLon];
    if (ads.length > 0) {
      const first = ads[0].location;
      if (first.lat && first.lng) {
        return [first.lat, first.lng];
      }
    }
    return DEFAULT_CENTER;
  }, [ads, storeLat, storeLon]);

  const clampZoom = (zoom: number) =>
    Math.min(Math.max(zoom, minZoom), maxZoom);
  const targetZoom = clampZoom(storeLat && storeLon ? CITY_ZOOM : DEFAULT_ZOOM);

  const [mapState, setMapState] = useState<{
    center: [number, number];
    zoom: number;
  }>({
    center: targetCenter,
    zoom: targetZoom,
  });

  useEffect(() => {
    setMapState({ center: targetCenter, zoom: targetZoom });
  }, [targetCenter, targetZoom]);

  // Если переданы статические ads, используем их, иначе загружаем динамически
  const displayMarkers = useMemo(() => {
    if (ads.length > 0) {
      return ads
        .filter((ad) => ad.location.lat !== null && ad.location.lng !== null)
        .map((ad) => ({
          id: ad.id,
          location: {
            lat: ad.location.lat!,
            lng: ad.location.lng!,
          },
          title: ad.title,
          category: ad.category.toLowerCase(),
          price: ad.price,
          photos: ad.photos,
        }));
    }
    return markers;
  }, [ads, markers]);

  const mapRef = useRef<any>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  const ORIGINAL_SIZE: [number, number] = [399, 548];
  const MAX_WIDTH = 50;

  // Функция загрузки маркеров по viewport
  const loadMarkersForViewport = useCallback(
    async (bounds: any) => {
      if (!bounds) {
        return;
      }

      setLoadingMarkers(true);

      try {
        const params = new URLSearchParams({
          north: bounds[1][0].toString(), // lat северо-восточного угла (north)
          south: bounds[0][0].toString(), // lat юго-западного угла (south)
          east: bounds[1][1].toString(), // lng северо-восточного угла (east)
          west: bounds[0][1].toString(), // lng юго-западного угла (west)
        });

        // Передаем параметры фильтров из URL
        const minPrice = searchParams.get('minPrice');
        const maxPrice = searchParams.get('maxPrice');
        const vip = searchParams.get('vip');
        const time = searchParams.get('time');

        if (category) params.set('category', category);
        if (minPrice) params.set('minPrice', minPrice);
        if (maxPrice) params.set('maxPrice', maxPrice);
        if (vip) params.set('vip', vip);
        if (time) params.set('time', time);

        const response = await fetch(`/api/map-markers?${params.toString()}`);
        if (response.ok) {
          const newMarkers: MapMarker[] = await response.json();
          setMarkers(newMarkers);
        } else {
          console.error('❌ Failed to load markers:', response.status);
        }
      } catch (error) {
        console.error('❌ Error loading map markers:', error);
      } finally {
        setLoadingMarkers(false);
      }
    },
    [cityLabel, category]
  );

  // Дебаунсинг для viewport changes
  const debouncedLoadMarkers = useCallback(
    (bounds: any) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        loadMarkersForViewport(bounds);
      }, 400); // 400ms дебаунс
    },
    [loadMarkersForViewport]
  );

  // Обработчик загрузки карты
  const handleMapLoad = useCallback(
    (ymaps: any) => {
      if (ads.length === 0 && !initialLoadDone) {
        // Добавляем небольшую задержку, чтобы карта полностью инициализировалась
        setTimeout(() => {
          if (mapRef.current) {
            const map = mapRef.current;
            if (map && typeof map.getBounds === 'function') {
              const bounds = map.getBounds();
              loadMarkersForViewport(bounds);
              setInitialLoadDone(true);
            } else {
              console.warn(
                '❌ Map instance not available or missing getBounds method'
              );
            }
          }
        }, 100);
      }
    },
    [ads.length, loadMarkersForViewport, initialLoadDone]
  );

  // Перезагружаем маркеры при изменении фильтров
  useEffect(() => {
    if (initialLoadDone) {
      // Очищаем старые маркеры перед загрузкой новых
      setMarkers([]);
      if (mapRef.current) {
        const map = mapRef.current;
        if (typeof map.getBounds === 'function') {
          const bounds = map.getBounds();
          loadMarkersForViewport(bounds);
        }
      }
    }
  }, [searchParams, loadMarkersForViewport, initialLoadDone]);

  // Вычисляем пропорциональную высоту и смещение
  const aspectRatio = ORIGINAL_SIZE[1] / ORIGINAL_SIZE[0];
  const iconWidth = MAX_WIDTH;
  const iconHeight = Math.round(MAX_WIDTH * aspectRatio);
  const iconOffsetX = -iconWidth / 2;
  const iconOffsetY = -iconHeight;

  // Преобразование маркера в AdBase для обратной совместимости
  const convertMarkerToAd = useCallback(
    (marker: MapMarker): AdBase => ({
      id: marker.id,
      title: marker.title,
      description: '',
      price: marker.price,
      category: marker.category as any, // временно, так как API возвращает string
      location: marker.location,
      city: cityLabel || '',
      cityLabel: cityLabel || '',
      address: '',
      photos: marker.photos,
      datePosted: new Date().toISOString(),
      seller: {
        id: 0,
        name: '',
        avatar: null,
        rating: 0,
        contact: {
          phone: '',
          email: '',
        },
      },
      details: '',
    }),
    [cityLabel]
  );

  const handlePin = useCallback((ad: AdBase) => onPinClick?.(ad), [onPinClick]);

  const handleCluster = useCallback(
    (e: any) => {
      if (!onClusterClick) return;
      const target = e.get('target');
      if (typeof target.getGeoObjects !== 'function') {
        return;
      }
      const geoObjects = target.getGeoObjects();

      const ids: string[] = geoObjects.map((o: any) =>
        o.properties.get('adId')
      );

      // Если используются статические ads, фильтруем их
      if (ads.length > 0) {
        const adsInCluster = ads.filter((a) => ids.includes(a.id));
        onClusterClick(adsInCluster);
      } else {
        // Если используются динамические маркеры, конвертируем их в AdBase
        const markersInCluster = displayMarkers.filter((m) =>
          ids.includes(m.id)
        );
        const adsInCluster = markersInCluster.map(convertMarkerToAd);
        onClusterClick(adsInCluster);
      }
    },
    [ads, displayMarkers, onClusterClick, convertMarkerToAd]
  );

  // Обработчик изменения viewport (move/zoom)
  const handleBoundsChange = useCallback(
    (e: any) => {
      if (ads.length === 0) {
        const newBounds = e.get('target').getBounds();

        // Если это первый bounds change и мы еще не загружали маркеры, делаем это
        if (!initialLoadDone && markers.length === 0) {
          loadMarkersForViewport(newBounds);
          setInitialLoadDone(true);
        } else {
          // Обычное обновление при move/zoom
          debouncedLoadMarkers(newBounds);
        }
      }
    },
    [
      ads.length,
      debouncedLoadMarkers,
      initialLoadDone,
      markers.length,
      loadMarkersForViewport,
    ]
  );

  return (
    <div className="absolute inset-0">
      {loadingMarkers && ads.length === 0 && (
        <div className="absolute top-4 left-4 z-4 bg-white px-3 py-2 rounded shadow opacity-50">
          Загрузка объявлений...
        </div>
      )}
      <YMaps query={{ apikey: process.env.NEXT_PUBLIC_YANDEX_MAP_API_KEY }}>
        <Map
          options={{
            suppressMapOpenBlock: true,
            minZoom,
            maxZoom,
          }}
          state={mapState}
          instanceRef={mapRef}
          width="100%"
          height="100%"
          modules={['templateLayoutFactory', 'layout.ImageWithContent']}
          onBoundsChange={handleBoundsChange}
          onLoad={handleMapLoad}
        >
          <Clusterer
            options={{
              preset: 'islands#invertedVioletClusterIcons',
              groupByCoordinates: false,
              clusterDisableClickZoom: true,
              clusterOpenBalloonOnClick: false,
              gridSize: 256,
            }}
            onClick={handleCluster}
          >
            {displayMarkers.map((marker) => {
              const ad =
                ads.length > 0
                  ? ads.find((a) => a.id === marker.id) ||
                    convertMarkerToAd(marker)
                  : convertMarkerToAd(marker);
              return (
                <Placemark
                  key={marker.id}
                  geometry={[marker.location.lat, marker.location.lng]}
                  properties={{
                    balloonContentHeader: marker.title,
                    adId: marker.id,
                  }}
                  options={{
                    iconLayout: 'default#image',
                    iconImageHref: `https://ik.imagekit.io/motorolla29/molla/icons/${marker.category}-map-marker.png`,
                    iconImageSize: [iconWidth, iconHeight],
                    iconImageOffset: [iconOffsetX, iconOffsetY],
                  }}
                  onClick={() => handlePin(ad)}
                />
              );
            })}
          </Clusterer>
        </Map>
      </YMaps>
    </div>
  );
}
