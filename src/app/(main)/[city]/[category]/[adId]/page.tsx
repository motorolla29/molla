import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import AdClient from './ad-client';
import SimilarAds, { SimilarAdsSkeleton } from './similar-ads';
import { categoryOptions } from '@/const';
import { AdBase, CategoryKey, Currency } from '@/types/ad';
import { prisma } from '@/lib/prisma';

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

  // 3. Реальный запрос к базе через Prisma
  let adFromDb;
  try {
    adFromDb = await prisma.ad.findUnique({
      where: { id: adId },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            avatar: true,
            rating: true,
            phone: true,
            email: true,
          },
        },
        _count: {
          select: {
            favorites: true,
            userViews: true,
          },
        },
        userViews: {
          where: {
            viewedAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)), // просмотры с начала сегодняшнего дня
            },
          },
        },
      },
    });
  } catch (error) {
    console.error('Failed to fetch ad from DB:', error);
    redirect('/offline');
  }

  if (!adFromDb) {
    notFound();
  }

  const ad: AdBase = {
    id: adFromDb.id,
    category: adFromDb.category.toLowerCase() as CategoryKey,
    title: adFromDb.title,
    description: adFromDb.description,
    city: adFromDb.city,
    cityLabel: adFromDb.cityLabel,
    address: adFromDb.address,
    location: {
      lat: adFromDb.lat,
      lng: adFromDb.lng,
    },
    price: adFromDb.price ? Number(adFromDb.price) : undefined, // Конвертируем BigInt в число
    currency: (adFromDb.currency as Currency) || undefined,
    datePosted: adFromDb.datePosted.toISOString(),
    photos: adFromDb.photos,
    seller: {
      id: adFromDb.seller.id,
      avatar: adFromDb.seller.avatar,
      name: adFromDb.seller.name,
      rating: adFromDb.seller.rating,
      contact: {
        phone: adFromDb.seller.phone || undefined,
        email: adFromDb.seller.email || undefined,
      },
    },
    details: adFromDb.details,
    status: adFromDb.status,
    viewCount: adFromDb._count?.userViews || 0,
    viewsToday: adFromDb.userViews?.length || 0,
    favoritesCount: adFromDb._count?.favorites || 0,
  };

  // 4. Доп. проверка: чтобы URL-адрес совпадал с данными объявления
  if (ad.cityLabel !== city || ad.category !== category) {
    notFound();
  }

  return (
    <AdClient
      ad={ad}
      similarAds={
        <Suspense fallback={<SimilarAdsSkeleton />}>
          <SimilarAds ad={ad} />
        </Suspense>
      }
    />
  );
}
