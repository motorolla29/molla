import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Тип для маркеров карты (минимальные данные для производительности)
interface MapMarker {
  id: string;
  location: {
    lat: number;
    lng: number;
  };
  title: string;
  category: string;
  price?: number;
  photos: string[];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Параметры viewport - обязательные
    const north = searchParams.get('north');
    const south = searchParams.get('south');
    const east = searchParams.get('east');
    const west = searchParams.get('west');

    // Параметры фильтрации
    const category = searchParams.get('category');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const isVip = searchParams.get('vip') === '1';
    const timeFilter = searchParams.get('time');

    // Валидация обязательных параметров
    if (!north || !south || !east || !west) {
      return NextResponse.json(
        { error: 'Viewport bounds (north, south, east, west) are required' },
        { status: 400 }
      );
    }

    // Парсим границы
    const bounds = {
      north: parseFloat(north),
      south: parseFloat(south),
      east: parseFloat(east),
      west: parseFloat(west),
    };

    // Строим условия фильтрации для базы данных
    const where: any = {
      status: 'active', // показываем только активные объявления
    };

    // ВКЛЮЧАЕМ VIEWPORT ФИЛЬТР ОБРАТНО
    where.lat = {
      gte: bounds.south, // >= южной границы
      lte: bounds.north, // <= северной границы
    };
    where.lng = {
      gte: bounds.west, // >= западной границы
      lte: bounds.east, // <= восточной границы
    };

    // Фильтр по категории
    if (category) {
      where.category = {
        equals: category as any, // Приведение типа для enum
      };
    }

    // Фильтр по цене
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseInt(minPrice);
      if (maxPrice) where.price.lte = parseInt(maxPrice);
    }

    // Фильтр по VIP
    if (isVip) {
      where.isVip = true;
    }

    // Фильтр по времени
    if (timeFilter && timeFilter !== 'all') {
      const now = new Date();
      let dateFilter: Date;

      switch (timeFilter) {
        case '24': // 24 часа = 1 день
          dateFilter = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7': // 7 дней = 1 неделя
          dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        default:
          dateFilter = new Date(0);
      }

      where.datePosted = {
        gte: dateFilter,
      };
    }

    // Запрашиваем объявления с примененными фильтрами
    const ads = await prisma.ad.findMany({
      where,
      include: {
        seller: false, // Не нужны данные продавца для маркеров
      },
      take: 100, // Максимум 100 маркеров
      orderBy: {
        datePosted: 'desc',
      },
    });

    // Преобразуем в формат маркеров
    const markers: MapMarker[] = ads.map((ad) => ({
      id: ad.id,
      location: {
        lat: ad.lat,
        lng: ad.lng,
      },
      title: ad.title,
      category: ad.category.toLowerCase(),
      price: ad.price ? Number(ad.price) : undefined,
      photos: ad.photos,
    }));

    return NextResponse.json(markers);
  } catch (error) {
    console.error('❌ Error loading map markers:', error);
    return NextResponse.json(
      {
        error: 'Failed to load map markers',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
