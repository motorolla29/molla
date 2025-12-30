import { notFound } from 'next/navigation';
import AdClient from './ad-client';
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
  const adFromDb = await prisma.ad.findUnique({
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

  // 5. Похожие объявления: до 6 объявлений той же категории,
  // отсортированных по расстоянию от текущих координат (чем ближе, тем выше),
  // без ограничения по городу
  const SIMILAR_LIMIT = 6;
  const SAME_CATEGORY_LIMIT = 128;

  const sameCategoryRaw = await prisma.ad.findMany({
    where: {
      category: adFromDb.category,
      id: { not: ad.id },
      status: 'active',
    },
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
    },
    take: SAME_CATEGORY_LIMIT,
  });

  const withDistance = sameCategoryRaw.map((item) => ({
    item,
    dist:
      item.lat && item.lng && ad.location.lat && ad.location.lng
        ? (item.lat - ad.location.lat) * (item.lat - ad.location.lat) +
          (item.lng - ad.location.lng) * (item.lng - ad.location.lng)
        : Infinity, // Если координаты отсутствуют, ставим бесконечное расстояние
  }));

  withDistance.sort((a, b) => a.dist - b.dist);

  const nearestSameCategory = withDistance
    .slice(0, SIMILAR_LIMIT)
    .map((x) => x.item);

  const similarAds: AdBase[] = nearestSameCategory.map((item) => ({
    id: item.id,
    category: item.category.toLowerCase() as CategoryKey,
    title: item.title,
    description: item.description,
    city: item.city,
    cityLabel: item.cityLabel,
    address: item.address,
    location: {
      lat: item.lat,
      lng: item.lng,
    },
    price: item.price ? Number(item.price) : undefined, // Конвертируем BigInt в число
    currency: (item.currency as Currency) || undefined,
    datePosted: item.datePosted.toISOString(),
    photos: item.photos,
    seller: {
      id: item.seller.id,
      avatar: item.seller.avatar,
      name: item.seller.name,
      rating: item.seller.rating,
      contact: {
        phone: item.seller.phone || undefined,
        email: item.seller.email || undefined,
      },
    },
    details: item.details,
    status: item.status,
  }));

  return <AdClient ad={ad} similarAds={similarAds} />;
}
