import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';
import { convertToAdBase } from '@/utils';

const DEFAULT_LIMIT = 24;
const MAX_CANDIDATES = 1000;

const adSelect = {
  id: true,
  category: true,
  title: true,
  description: true,
  city: true,
  cityLabel: true,
  address: true,
  lat: true,
  lng: true,
  price: true,
  currency: true,
  datePosted: true,
  photos: true,
  details: true,
  status: true,
  showPhone: true,
  showEmail: true,
  sellerId: true,
  seller: {
    select: {
      id: true,
      name: true,
      avatar: true,
      rating: true,
    },
  },
} as const;

/**
 * GET /api/ads/fresh
 * Свежие объявления с приоритизацией по городу:
 * 1. Сначала объявления из текущего города пользователя
 * 2. Затем все остальные
 * Внутри каждой группы - сортировка по дате (новые сверху)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const skip = Math.max(0, parseInt(searchParams.get('skip') || '0'));
    // Ограничиваем limit до 50 за один запрос (защита от внешних запросов)
    const requestedLimit = Math.min(
      50,
      parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT)),
    );

    // Параметр города пользователя для приоритизации
    const prioritizeCityLabel = searchParams.get('cityLabel') || null;

    let userId: number | null = null;
    const token = request.cookies.get('token')?.value;
    if (token) {
      const payload = verifyToken(token);
      if (payload && typeof payload === 'object' && 'userId' in payload) {
        userId = payload.userId as number;
      }
    }

    const where: {
      status: 'active';
      sellerId?: { not: number };
    } = { status: 'active' };
    if (userId != null) {
      where.sellerId = { not: userId };
    }

    // Общий потолок выдачи: максимум 1000 объявлений через пагинацию
    if (skip >= MAX_CANDIDATES) {
      return NextResponse.json([]);
    }
    const limit = Math.min(requestedLimit, MAX_CANDIDATES - skip);
    if (limit <= 0) {
      return NextResponse.json([]);
    }

    // Если нет понятного текущего города — просто свежие по дате (пагинация в БД)
    if (!prioritizeCityLabel || prioritizeCityLabel === 'russia') {
      const ads = await prisma.ad.findMany({
        where,
        select: adSelect,
        orderBy: { datePosted: 'desc' },
        skip,
        take: limit,
      });
      return NextResponse.json(ads.map(convertToAdBase));
    }

    // Порядок: 1) текущий город, 2) остальные. Внутри — datePosted desc.
    const whereCity = { ...where, cityLabel: prioritizeCityLabel };
    const cityTotal = await prisma.ad.count({ where: whereCity });
    const cityCap = Math.min(cityTotal, MAX_CANDIDATES);
    const otherCap = MAX_CANDIDATES - cityCap;

    let remainingSkip = skip;
    let remainingTake = limit;

    const result: any[] = [];

    // 1) Текущий город
    if (remainingSkip < cityCap && remainingTake > 0) {
      const citySkip = remainingSkip;
      const cityTake = Math.min(remainingTake, cityCap - citySkip);

      const cityAds = await prisma.ad.findMany({
        where: whereCity,
        select: adSelect,
        orderBy: { datePosted: 'desc' },
        skip: citySkip,
        take: cityTake,
      });
      result.push(...cityAds);
      remainingTake -= cityAds.length;
      remainingSkip = 0;
    } else if (remainingSkip >= cityCap) {
      remainingSkip -= cityCap;
    }

    // 2) Остальные города
    if (remainingTake > 0 && otherCap > 0 && remainingSkip < otherCap) {
      const otherSkip = remainingSkip;
      const otherTake = Math.min(remainingTake, otherCap - otherSkip);
      if (otherTake > 0) {
        const otherAds = await prisma.ad.findMany({
          where: { ...where, cityLabel: { not: prioritizeCityLabel } },
          select: adSelect,
          orderBy: { datePosted: 'desc' },
          skip: otherSkip,
          take: otherTake,
        });
        result.push(...otherAds);
      }
    }

    return NextResponse.json(result.map(convertToAdBase));
  } catch (error) {
    console.error('❌ Error fetching fresh ads:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch fresh ads',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
