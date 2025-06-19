import { notFound } from 'next/navigation';
import CategoryClient from './category-client';
import { categoryOptions } from '@/const';

type Props = { params: Promise<{ city: string; category: string }> };

export default async function CategoryPage({ params }: Props) {
  const { city, category } = await params;

  // грузим города
  const citiesMod = await import('@/lib/russia-cities.json');
  const cities = (citiesMod as any).default ?? citiesMod;
  const foundCity = cities.find((c: any) => c.label === city);
  const foundCategory = categoryOptions.find((c) => c.key === category);

  if (!foundCity || !foundCategory) {
    notFound();
  }

  return (
    <CategoryClient
      cityLabel={city}
      cityName={foundCity.namecase.nominative || foundCity.name}
      cityNamePrep={foundCity.namecase.prepositional}
      categoryKey={category}
      categoryLabel={foundCategory.label}
    />
  );
}
