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
        // Для рейтинга можно добавить логику подсчета на основе отзывов/оценок
        // Пока возвращаем mock рейтинг
        _count: {
          select: {
            ads: {
              where: { status: 'active' },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    // Форматируем данные для клиента
    const formattedUser = {
      id: user.id.toString(),
      name: user.name,
      avatar: user.avatar,
      // Mock рейтинг - в реальности нужно рассчитывать на основе отзывов
      rating: 4.8,
      joinDate: user.createdAt.toISOString().split('T')[0], // YYYY-MM-DD формат
      phone: user.phone,
      email: user.email,
      activeAdsCount: user._count.ads,
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
