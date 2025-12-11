import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AdBase, CategoryKey, Currency } from '@/types/ad';

// Конвертация Prisma модели в AdBase тип
function convertToAdBase(ad: any): AdBase {
  return {
    id: ad.id,
    category: ad.category.toLowerCase() as CategoryKey,
    title: ad.title,
    description: ad.description,
    city: ad.city,
    cityLabel: ad.cityLabel,
    address: ad.address,
    location: {
      lat: ad.lat,
      lng: ad.lng,
    },
    price: ad.price || undefined,
    currency: (ad.currency as Currency) || undefined,
    datePosted: ad.datePosted.toISOString(),
    photos: ad.photos,
    seller: {
      id: ad.seller.id,
      avatar: ad.seller.avatar,
      name: ad.seller.name,
      rating: ad.seller.rating,
      contact: {
        type: ad.seller.contactType === 'phone' ? 'phone' : 'email',
        value: ad.seller.contactValue,
      },
    },
    details: ad.details,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Получаем параметры фильтрации из URL
    const cityLabel = searchParams.get('cityLabel');
    const category = searchParams.get('category') as CategoryKey | null;
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const search = searchParams.get('search');
    const isVip = searchParams.get('vip') === '1';
    const timeFilter = searchParams.get('time');
    const sort = searchParams.get('sort') || 'datePosted';

    // Строим условия фильтрации
    const where: any = {};

    // Фильтр по городу
    if (cityLabel && cityLabel !== 'russia') {
      where.cityLabel = cityLabel;
    }

    // Фильтр по категории
    if (category) {
      where.category = category.toUpperCase();
    }

    // Фильтр по цене
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseInt(minPrice);
      if (maxPrice) where.price.lte = parseInt(maxPrice);
    }

    // Фильтр по поисковому запросу
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { details: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Фильтр VIP объявлений
    if (isVip) {
      where.isVip = true;
    }

    // Фильтр по времени
    if (timeFilter) {
      const now = new Date();
      if (timeFilter === '7') {
        // За последние 7 дней
        where.datePosted = {
          gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        };
      } else if (timeFilter === '24') {
        // За последние 24 часа
        where.datePosted = {
          gte: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        };
      }
    }

    // Сортировка
    let orderBy: any = undefined; // По умолчанию - без сортировки

    if (sort === 'new') {
      orderBy = { datePosted: 'desc' };
    } else if (sort === 'price_asc') {
      orderBy = { price: 'asc' };
    }

    // Получаем объявления из базы данных
    const ads = await prisma.ad.findMany({
      where,
      include: {
        seller: true,
      },
      orderBy,
      take: 50, // Ограничение для производительности
    });

    // Конвертируем в формат AdBase
    const convertedAds = ads.map(convertToAdBase);

    return NextResponse.json(convertedAds);
  } catch (error) {
    console.error('Error fetching ads:', error);
    return NextResponse.json({ error: 'Failed to fetch ads' }, { status: 500 });
  }
}
