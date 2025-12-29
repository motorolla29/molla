import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ adId: string }> }
) {
  try {
    const { adId } = await params;

    // Получаем токен пользователя (обязательно для просмотров)
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || typeof payload !== 'object' || !('userId' in payload)) {
      return NextResponse.json({ error: 'Неверный токен' }, { status: 401 });
    }

    const userId = payload.userId as number;

    // Проверяем существование объявления
    const ad = await prisma.ad.findUnique({
      where: { id: adId },
      select: { id: true },
    });

    if (!ad) {
      return NextResponse.json(
        { error: 'Объявление не найдено' },
        { status: 404 }
      );
    }

    // Создаем запись просмотра, если её ещё нет (игнорируем дубликаты)
    try {
      await prisma.userView.create({
        data: {
          userId: userId,
          adId: adId,
        },
      });
    } catch (error: any) {
      // Игнорируем ошибку дубликата (P2002), но логируем другие ошибки
      if (error.code !== 'P2002') {
        throw error;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Ошибка при записи просмотра:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
