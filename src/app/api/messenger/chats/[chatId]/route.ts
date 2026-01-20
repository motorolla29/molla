import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
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

    const userId = Number((decoded as any).userId);
    const { chatId } = await params;

    // Получаем информацию о чате
    const chat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        OR: [{ buyerId: userId }, { sellerId: userId }],
      },
      include: {
        ad: {
          select: {
            title: true,
            photos: true,
            price: true,
            currency: true,
          },
        },
        buyer: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        seller: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    // Форматируем данные для фронтенда
    const isBuyer = chat.buyerId === userId;
    const otherUser = isBuyer ? chat.seller : chat.buyer;

    const formattedChat = {
      id: chat.id,
      adId: chat.adId,
      adTitle: chat.ad.title,
      adPhoto: chat.ad.photos[0] || '',
      adPrice: chat.ad.price ? `${chat.ad.price.toLocaleString('ru-RU')} ${chat.ad.currency || 'RUB'}` : undefined,
      otherUserId: otherUser.id,
      otherUserName: otherUser.name,
      otherUserAvatar: otherUser.avatar,
      lastMessage: '', // Не нужно для страницы чата
      lastMessageTime: chat.createdAt,
      unreadCount: 0,
    };

    return NextResponse.json(formattedChat);
  } catch (error) {
    console.error('Error fetching chat:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
