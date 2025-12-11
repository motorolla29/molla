import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Проверка доступа
    const isDevelopment = process.env.NODE_ENV === 'development'
    const authHeader = request.headers.get('authorization')
    const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123'

    // Проверяем пароль из заголовка или development режим
    const providedPassword = authHeader?.replace('Bearer ', '')
    const isAuthenticated = isDevelopment || providedPassword === adminPassword

    if (!isAuthenticated) {
      return NextResponse.json(
        { error: 'Доступ запрещен. Укажите правильный пароль в заголовке Authorization: Bearer password' },
        { status: 403 }
      )
    }
    // Получить статистику
    const [adsCount, sellersCount, recentAds] = await Promise.all([
      prisma.ad.count(),
      prisma.seller.count(),
      prisma.ad.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { seller: true },
      }),
    ]);

    return NextResponse.json({
      stats: {
        totalAds: adsCount,
        totalSellers: sellersCount,
      },
      recentAds: recentAds.map((ad) => ({
        id: ad.id,
        title: ad.title,
        category: ad.category,
        city: ad.city,
        price: ad.price,
        currency: ad.currency,
        datePosted: ad.datePosted.toISOString(),
        seller: {
          name: ad.seller.name,
          rating: ad.seller.rating,
        },
      })),
    });
  } catch (error) {
    console.error('Admin API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin data' },
      { status: 500 }
    );
  }
}
