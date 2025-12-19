import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AdBase, CategoryKey, Currency } from '@/types/ad';
import { verifyToken } from '@/lib/jwt';

// Конвертация Prisma модели в AdBase тип
function convertToAdBase(ad: any): AdBase {
  try {
    const result = {
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
          phone: ad.seller.phone || undefined,
          email: ad.seller.email || undefined,
        },
      },
      details: ad.details,
    };

    return result;
  } catch (error) {
    console.error(`❌ Error converting ad ${ad.id}:`, error);
    throw error;
  }
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
    const skip = parseInt(searchParams.get('skip') || '0');
    const limit = parseInt(searchParams.get('limit') || '24');

    // Строим условия фильтрации
    const where: any = {};

    // Фильтр по городу
    if (cityLabel && cityLabel !== 'russia') {
      where.cityLabel = cityLabel;
    }

    // Фильтр по категории
    if (category) {
      where.category = category;
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

    const ads = await prisma.ad.findMany({
      where,
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
      orderBy,
      skip,
      take: limit,
    });

    // Конвертируем в формат AdBase
    const convertedAds = ads.map(convertToAdBase);

    return NextResponse.json(convertedAds);
  } catch (error) {
    console.error('❌ Error fetching ads:', error);
    console.error(
      'Stack trace:',
      error instanceof Error ? error.stack : 'Unknown error'
    );
    return NextResponse.json(
      {
        error: 'Failed to fetch ads',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || typeof payload !== 'object' || !('userId' in payload)) {
      return NextResponse.json({ error: 'Неверный токен' }, { status: 401 });
    }

    const sellerId = Number((payload as any).userId);

    const body = await request.json();
    const {
      title,
      description,
      category,
      city,
      cityLabel,
      address,
      lat,
      lng,
      price,
      currency,
      details,
      photos,
    } = body || {};

    if (
      !title ||
      !description ||
      !category ||
      !city ||
      !cityLabel ||
      !address ||
      typeof lat !== 'number' ||
      typeof lng !== 'number'
    ) {
      return NextResponse.json(
        { error: 'Отсутствуют обязательные поля' },
        { status: 400 }
      );
    }

    const ad = await prisma.ad.create({
      data: {
        title,
        description,
        category,
        city,
        cityLabel,
        address,
        lat,
        lng,
        price: typeof price === 'number' ? price : null,
        currency: currency || null,
        details: details || '',
        photos: Array.isArray(photos) ? photos : [],
        sellerId,
      },
    });

    return NextResponse.json({ id: ad.id }, { status: 201 });
  } catch (error) {
    console.error('❌ Error creating ad:', error);
    return NextResponse.json({ error: 'Failed to create ad' }, { status: 500 });
  }
}
