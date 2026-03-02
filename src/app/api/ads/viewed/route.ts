import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';
import { convertToAdBase } from '@/utils';

const MAX_LIMIT = 100;

const adSelect = {
  id: true,
  category: true,
  title: true,
  description: true,
  city: true,
  cityLabel: true,
  address: true,
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
 * GET /api/ads/viewed
 * Список просмотренных объявлений пользователя (по userId или localUserToken),
 * отсортированный по дате просмотра (viewedAt desc), максимум 100 штук.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const skip = Math.max(0, parseInt(searchParams.get('skip') || '0', 10));
    const requestedLimit = parseInt(searchParams.get('limit') || '24', 10);
    const limit = Math.min(Math.max(requestedLimit, 1), MAX_LIMIT - skip);

    let userId: number | null = null;
    const token = request.cookies.get('token')?.value;
    if (token) {
      const payload = verifyToken(token);
      if (payload && typeof payload === 'object' && 'userId' in payload) {
        userId = (payload as any).userId as number;
      }
    }
    const localUserToken = searchParams.get('localUserToken') || undefined;

    if (!userId && !localUserToken) {
      // Нет ни авторизации, ни локального токена — просто вернём пустой список
      return NextResponse.json([]);
    }

    const views = await prisma.userView.findMany({
      where: {
        adId: { not: null },
        OR: [
          userId ? { userId } : undefined,
          localUserToken ? { localUserToken } : undefined,
        ].filter(Boolean) as any[],
        ad: {
          // Показываем только живые объявления
          status: 'active',
        },
      },
      select: {
        viewedAt: true,
        ad: {
          select: adSelect,
        },
      },
      orderBy: { viewedAt: 'desc' },
      skip,
      take: limit,
    });

    const ads = views
      .map((v) => v.ad)
      .filter((ad): ad is NonNullable<typeof ad> => Boolean(ad))
      .map((ad) => ({
        ...ad,
        // В этом списке все объявления по определению просмотренные
        isViewed: true,
      }));

    return NextResponse.json(ads.map(convertToAdBase));
  } catch (error) {
    console.error('❌ Error fetching viewed ads:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch viewed ads',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

