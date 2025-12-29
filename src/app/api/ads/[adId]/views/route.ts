import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ adId: string }> }
) {
  try {
    const { adId } = await params;

    // Получаем токен пользователя (опционально для просмотров)
    const token = request.cookies.get('token')?.value;
    let userId: number | null = null;

    if (token) {
      const payload = verifyToken(token);
      if (payload && typeof payload === 'object' && 'userId' in payload) {
        userId = payload.userId as number;
      }
    }

    // Проверяем существование объявления
    const ad = await prisma.ad.findUnique({
      where: { id: adId },
      select: { id: true, sellerId: true, viewCount: true, viewsToday: true },
    });

    if (!ad) {
      return NextResponse.json(
        { error: 'Объявление не найдено' },
        { status: 404 }
      );
    }

    // Инкрементируем счетчики просмотров для всех пользователей
    const now = new Date();

    // Обновляем общее количество просмотров и просмотры сегодня
    await prisma.ad.update({
      where: { id: adId },
      data: {
        viewCount: { increment: 1 },
        viewsToday: { increment: 1 },
        updatedAt: now,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Ошибка при записи просмотра:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
