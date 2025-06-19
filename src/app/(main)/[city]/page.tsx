import { notFound } from 'next/navigation';
import CityClient from './city-client';

type Props = { params: Promise<{ city: string }> };

export default async function CityPage({ params }: Props) {
  const { city } = await params;

  const citiesMod = await import('@/lib/russia-cities.json');
  const cities = (citiesMod as any).default ?? citiesMod;
  const foundCity = cities.find((c: any) => c.label === city);
  if (!foundCity) notFound();

  // Передаём имя города в клиент
  return (
    <CityClient
      cityLabel={city}
      cityName={foundCity.namecase.nominative}
      cityNamePrep={foundCity.namecase.prepositional}
    />
  );
}
