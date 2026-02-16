import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';
import { convertToAdBase } from '@/utils';

const DEFAULT_LIMIT = 24;
const MAX_CANDIDATES = 1000;

/**
 * GET /api/ads/recommended
 * Умные рекомендации: по избранному, просмотрам и чатам пользователя
 * подбираем объявления той же категории/города. Без истории — свежие по дате.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const skip = Math.max(0, parseInt(searchParams.get('skip') || '0'));

    // Ограничиваем limit до 50 за один запрос
    const limit = Math.min(
      50,
      parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT)),
    );
    const localUserToken = searchParams.get('localUserToken') || undefined;

    let userId: number | null = null;
    const token = request.cookies.get('token')?.value;
    if (token) {
      const payload = verifyToken(token);
      if (payload && typeof payload === 'object' && 'userId' in payload) {
        userId = payload.userId as number;
      }
    }

    const preferredCategories: string[] = [];
    const preferredCityLabels: string[] = [];

    if (userId || localUserToken) {
      const [favorites, views, chats] = await Promise.all([
        prisma.favorite.findMany({
          where: {
            isActive: true,
            adId: { not: null },
            ...(userId
              ? { sellerId: userId }
              : { localUserToken: localUserToken! }),
          },
          include: { ad: true },
        }),
        prisma.userView.findMany({
          where: userId ? { userId } : { localUserToken: localUserToken! },
          include: { ad: true },
          orderBy: { viewedAt: 'desc' },
          take: 100,
        }),
        userId
          ? prisma.chat.findMany({
              where: { buyerId: userId, adId: { not: null } },
              include: { ad: true },
            })
          : [],
      ]);

      const seenIds = new Set<string>();

      for (const f of favorites) {
        if (f.adId && f.ad && !seenIds.has(f.adId)) {
          seenIds.add(f.adId);
          preferredCategories.push(f.ad.category);
          preferredCityLabels.push(f.ad.cityLabel);
        }
      }
      for (const v of views) {
        if (v.adId && v.ad && !seenIds.has(v.adId)) {
          seenIds.add(v.adId);
          preferredCategories.push(v.ad.category);
          preferredCityLabels.push(v.ad.cityLabel);
        }
      }
      for (const c of chats) {
        if (c.adId && c.ad && !seenIds.has(c.adId)) {
          seenIds.add(c.adId);
          preferredCategories.push(c.ad.category);
          preferredCityLabels.push(c.ad.cityLabel);
        }
      }
    }

    const needPersonalized =
      preferredCategories.length > 0 || preferredCityLabels.length > 0;

    // Берем максимум 1000 объявлений для полного охвата рекомендованных и остальных
    const takeCandidates = MAX_CANDIDATES;

    const where: {
      status: 'active';
      sellerId?: { not: number };
    } = { status: 'active' };
    if (userId != null) {
      where.sellerId = { not: userId };
    }

    const candidates = await prisma.ad.findMany({
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
        _count: {
          select: { favorites: true, userViews: true },
        },
        userViews: {
          where: {
            viewedAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
          select: { id: true },
        },
      },
      orderBy: { datePosted: 'desc' },
      take: takeCandidates,
    });

    // Сортировка: сначала рекомендованные (совпадение категории/города), затем остальные
    let ordered = candidates;
    if (needPersonalized && preferredCategories.length > 0) {
      const catSet = new Set(preferredCategories);
      const citySet = new Set(preferredCityLabels);
      ordered = [...candidates].sort((a, b) => {
        // Вычисляем скор: совпадение категории = 2 балла, совпадение города = 1 балл
        const scoreA =
          (catSet.has(a.category) ? 2 : 0) + (citySet.has(a.cityLabel) ? 1 : 0);
        const scoreB =
          (catSet.has(b.category) ? 2 : 0) + (citySet.has(b.cityLabel) ? 1 : 0);

        // Сначала идут объявления с большим скором (рекомендованные)
        if (scoreB !== scoreA) return scoreB - scoreA;

        // Внутри одной группы сортируем по дате (новые сверху)
        return (
          new Date(b.datePosted).getTime() - new Date(a.datePosted).getTime()
        );
      });
    }

    // Применяем пагинацию к отсортированному списку
    const slice = ordered.slice(skip, skip + limit);
    const converted = slice.map((ad) => convertToAdBase(ad));

    return NextResponse.json(converted);
  } catch (error) {
    console.error('❌ Error fetching recommended ads:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch recommended ads',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
