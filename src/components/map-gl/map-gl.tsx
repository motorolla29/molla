'use client';

import { AdBase } from '@/types/ad';
import { YMaps, Map, Placemark, Clusterer } from '@pbe/react-yandex-maps';
import { useLocationStore } from '@/store/useLocationStore';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface MapGlProps {
  ads: AdBase[];
  onPinClick?: (ad: AdBase) => void;
  onClusterClick?: (adsInCluster: AdBase[]) => void;
  minZoom?: number;
  maxZoom?: number;
}

export default function MapGl({
  ads,
  onPinClick,
  onClusterClick,
  minZoom = 3,
  maxZoom = 18,
}: MapGlProps) {
  const { lat: storeLat, lon: storeLon } = useLocationStore();
  const DEFAULT_CENTER: [number, number] = [55.75, 37.57]; // Москва
  const DEFAULT_ZOOM = 4;
  const CITY_ZOOM = 11;

  const targetCenter = useMemo<[number, number]>(() => {
    if (storeLat && storeLon) return [storeLat, storeLon];
    if (ads.length > 0) {
      const first = ads[0].location;
      return [first.lat, first.lng];
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

  const mapRef = useRef<any>(null);

  const ORIGINAL_SIZE: [number, number] = [399, 548];
  const MAX_WIDTH = 50;

  // Вычисляем пропорциональную высоту и смещение
  const aspectRatio = ORIGINAL_SIZE[1] / ORIGINAL_SIZE[0];
  const iconWidth = MAX_WIDTH;
  const iconHeight = Math.round(MAX_WIDTH * aspectRatio);
  const iconOffsetX = -iconWidth / 2;
  const iconOffsetY = -iconHeight;

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
      const adsInCluster = ads.filter((a) => ids.includes(a.id));
      onClusterClick(adsInCluster);
    },
    [ads, onClusterClick]
  );

  return (
    <div className="absolute inset-0">
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
            {ads.map((ad) => (
              <Placemark
                key={ad.id}
                geometry={[ad.location.lat, ad.location.lng]}
                properties={{
                  balloonContentHeader: ad.title,
                  adId: ad.id,
                }}
                options={{
                  iconLayout: 'default#image',
                  iconImageHref: `https://ik.imagekit.io/motorolla29/molla/icons/${ad.category}-map-marker.png`, // или jpg/png
                  iconImageSize: [iconWidth, iconHeight],
                  iconImageOffset: [iconOffsetX, iconOffsetY],
                }}
                onClick={() => handlePin(ad)}
              />
            ))}
          </Clusterer>
        </Map>
      </YMaps>
    </div>
  );
}
