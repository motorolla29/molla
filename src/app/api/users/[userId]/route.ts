import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Получить информацию о пользователе по ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    const userIdNum = parseInt(userId);

    if (isNaN(userIdNum)) {
      return NextResponse.json(
        { error: 'Неверный ID пользователя' },
        { status: 400 }
      );
    }

    // Получаем информацию о пользователе
    const user = await prisma.seller.findUnique({
      where: { id: userIdNum },
      select: {
        id: true,
        name: true,
        avatar: true,
        phone: true,
        email: true,
        createdAt: true,
        rating: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    // Счётчики объявлений и отзывов пользователя
    const [activeAdsCount, archivedAdsCount, reviewsCount] = await Promise.all([
      prisma.ad.count({
        where: { sellerId: userIdNum, status: 'active' },
      }),
      prisma.ad.count({
        where: { sellerId: userIdNum, status: 'archived' },
      }),
      prisma.review.count({
        where: { sellerId: userIdNum, targetRole: 'seller' },
      }),
    ]);

    // Форматируем данные для клиента
    const formattedUser = {
      id: user.id.toString(),
      name: user.name,
      avatar: user.avatar,
      rating: user.rating,
      joinDate: user.createdAt.toISOString().split('T')[0], // YYYY-MM-DD формат
      phone: user.phone,
      email: user.email,
      activeAdsCount,
      archivedAdsCount,
      reviewsCount,
    };

    return NextResponse.json(formattedUser);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Не удалось загрузить информацию о пользователе' },
      { status: 500 }
    );
  }
}
