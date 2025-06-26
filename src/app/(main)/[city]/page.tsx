import { notFound } from 'next/navigation';
import CityClient from './city-client';

type Props = { params: Promise<{ city: string }> };

export default async function CityPage({ params }: Props) {
  const { city } = await params;

  const citiesMod = await import('@/lib/russia-cities.json');
  const cities = (citiesMod as any).default ?? citiesMod;
  const foundCity = cities.find((c: any) => c.label === city);
  if (!foundCity && city !== 'russia') notFound();

  const cityName =
    foundCity?.namecase?.nominative || foundCity?.name || 'Россия';
  const cityNamePrep = foundCity?.namecase?.prepositional || 'России';
  const lat = foundCity?.coords?.lat ?? null;
  const lon = foundCity?.coords?.lon ?? null;

  // Передаём имя города в клиент
  return (
    <CityClient
      cityLabel={city}
      cityName={cityName}
      cityNamePrep={cityNamePrep}
      lat={lat}
      lon={lon}
    />
  );
}
