import { notFound } from 'next/navigation';
import AdClient from './ad-client';
import { categoryOptions } from '@/const';
import { mockAds } from '@/data/mockAds';

type Props = {
  params: Promise<{ city: string; category: string; adId: string }>;
};

export default async function AdPage({ params }: Props) {
  const { city, category, adId } = await params;

  // 1. Проверка города
  const citiesMod = await import('@/lib/russia-cities.json');
  const cities = (citiesMod as any).default ?? citiesMod;
  const foundCity = cities.find((c: any) => c.label === city);
  if (!foundCity && city !== 'russia') {
    notFound();
  }

  // 2. Проверка категории
  const foundCategory = categoryOptions.find((c) => c.key === category);
  if (!foundCategory) {
    notFound();
  }

  // Можно имитировать задержку, если хотите: await new Promise(r => setTimeout(r, 500));
  await new Promise((r) => setTimeout(r, 500));
  const ad = mockAds.find((x) => x.id === adId);
  if (!ad) {
    notFound();
  }
  // Дополнительная проверка URL на соответствие данным
  if (ad.cityLabel !== city || ad.category !== category) {
    notFound();
  }

  // // 3. Запрос к backend API
  // // Здесь предполагаем, что API возвращает объект объявления по adId
  // // Можно делать fetch к относительному пути: '/api/ads/[adId]'
  // const res = await fetch(
  //   `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/ads/${adId}`,
  //   { cache: 'no-store' }
  // );
  // if (!res.ok) {
  //   notFound();
  // }
  // const ad = await res.json();

  // // 4. Доп. проверка: чтобы URL-адрес совпадал с данными объявления
  // if (ad.cityLabel !== city || ad.category !== category) {
  //   notFound();
  // }

  return <AdClient ad={ad} />;
}
