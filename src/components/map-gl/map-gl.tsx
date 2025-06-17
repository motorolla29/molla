'use client';

import { YMaps, Map, Placemark, Clusterer } from '@pbe/react-yandex-maps';
import { useMemo } from 'react';

export default function MapGl({ ads }) {
  const center = useMemo(() => {
    if (ads.length === 0) return [55.75, 37.57];
    const first = ads[0].location;
    return [first.lat, first.lng];
  }, [ads]);

  return (
    <YMaps query={{ apikey: process.env.NEXT_PUBLIC_YANDEX_API_KEY }}>
      <Map
        options={{ suppressMapOpenBlock: true }}
        defaultState={{ center, zoom: 4 }}
        width="100%"
        height="100%"
        modules={['templateLayoutFactory', 'layout.ImageWithContent']}
      >
        <Clusterer
          options={{
            preset: 'islands#invertedVioletClusterIcons',
            groupByCoordinates: false,
            clusterDisableClickZoom: false,
            clusterOpenBalloonOnClick: false,
          }}
        >
          {ads.map((ad) => (
            <Placemark
              key={ad.id}
              geometry={[ad.location.lat, ad.location.lng]}
              properties={{
                balloonContentHeader: ad.title,
              }}
              options={{
                iconLayout: 'default#image',
                iconImageHref: '/pin.svg', // или jpg/png
                iconImageSize: [30, 30],
                iconImageOffset: [-15, -30],
              }}
            />
          ))}
        </Clusterer>
      </Map>
    </YMaps>
  );
}
