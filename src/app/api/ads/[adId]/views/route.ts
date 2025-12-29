import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ adId: string }> }
) {
  try {
    const { adId } = await params;
    const body = await request.json();
    const { localUserToken } = body;

    // Получаем данные для идентификации пользователя
    let userId: number | null = null;

    // Проверяем авторизацию
    const token = request.cookies.get('token')?.value;
    if (token) {
      const payload = verifyToken(token);
      if (payload && typeof payload === 'object' && 'userId' in payload) {
        userId = payload.userId as number;
      }
    }

    // Если не авторизован, проверяем localUserToken
    if (!userId && !localUserToken) {
      return NextResponse.json(
        { error: 'Требуется авторизация или localUserToken' },
        { status: 401 }
      );
    }

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

    // Проверяем, был ли уже просмотр от этого пользователя (по userId или localUserToken)
    const existingView = await prisma.userView.findFirst({
      where: {
        adId: adId,
        OR: [
          userId ? { userId: userId } : {},
          localUserToken ? { localUserToken: localUserToken } : {},
        ].filter((condition) => Object.keys(condition).length > 0),
      },
    });

    // Если просмотр уже был, не создаем новый
    if (existingView) {
      return NextResponse.json({ success: true });
    }

    // Создаем новую запись просмотра
    const viewData: any = {
      adId: adId,
    };

    // Добавляем оба поля, если они присутствуют
    if (userId) {
      viewData.userId = userId;
    }
    if (localUserToken) {
      viewData.localUserToken = localUserToken;
    }

    await prisma.userView.create({
      data: viewData,
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
