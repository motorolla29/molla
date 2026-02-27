import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // Получаем токен из cookies
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'Требуется авторизация' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded || typeof decoded !== 'object' || !('userId' in decoded)) {
      return NextResponse.json({ error: 'Неверный токен' }, { status: 401 });
    }

    const buyerId = Number((decoded as any).userId);
    const { adId, sellerId }: { adId: string; sellerId: number } =
      await request.json();

    if (!adId || !sellerId) {
      return NextResponse.json(
        { error: 'Необходимо указать ID объявления и продавца' },
        { status: 400 }
      );
    }

    // Проверяем, что покупатель не пытается написать сам себе
    if (buyerId === sellerId) {
      return NextResponse.json(
        { error: 'Нельзя начать чат с самим собой' },
        { status: 400 }
      );
    }

    // Проверяем, существует ли объявление и принадлежит ли оно продавцу
    const ad = await prisma.ad.findFirst({
      where: {
        id: adId,
        sellerId: sellerId,
        status: 'active', // Только активные объявления
      },
    });

    if (!ad) {
      return NextResponse.json(
        { error: 'Объявление не найдено или недоступно' },
        { status: 404 },
      );
    }

    // Проверяем блокировки между пользователями
    const block = await prisma.userBlock.findFirst({
      where: {
        OR: [
          {
            blockerId: buyerId,
            blockedId: sellerId,
          },
          {
            blockerId: sellerId,
            blockedId: buyerId,
          },
        ],
      },
    });

    if (block) {
      const isBlockedByMe = block.blockerId === buyerId;
      const message = isBlockedByMe
        ? 'Вы заблокировали этого пользователя и не можете начать с ним чат.'
        : 'Вы не можете начать чат, так как пользователь заблокировал вас.';

      return NextResponse.json({ error: message }, { status: 403 });
    }

    // Проверяем, существует ли уже чат между этими пользователями по этому объявлению
    let chat = await prisma.chat.findFirst({
      where: {
        adId: adId,
        buyerId: buyerId,
        sellerId: sellerId,
      },
    });

    // Если чат не существует, создаем его
    if (!chat) {
      chat = await prisma.chat.create({
        data: {
          adId: adId,
          buyerId: buyerId,
          sellerId: sellerId,
        },
      });
    }

    return NextResponse.json({
      chatId: chat.id,
      message: 'Чат готов',
    });
  } catch (error) {
    console.error('Error creating/getting chat:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}