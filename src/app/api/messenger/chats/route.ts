import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
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

    // Получаем все чаты пользователя (как покупателя или продавца)
    const chats = await prisma.chat.findMany({
      where: {
        OR: [{ buyerId: userId }, { sellerId: userId }],
      },
      include: {
        ad: {
          select: {
            id: true,
            title: true,
            photos: true,
            city: true,
            category: true,
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
        messages: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
          select: {
            content: true,
            createdAt: true,
            attachments: {
              select: {
                fileType: true,
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    // Форматируем данные для фронтенда
    const formattedChats = chats.map((chat) => {
      const isBuyer = chat.buyerId === userId;
      const otherUser = isBuyer ? chat.seller : chat.buyer;
      const lastMessage = chat.messages[0];

      return {
        id: chat.id,
        adId: chat.adId,
        adTitle: chat.ad.title,
        adPhoto: chat.ad.photos[0] || '',
        adCity: chat.ad.city,
        adCityLabel: chat.ad.cityLabel,
        adCategory: chat.ad.category,
        otherUserId: otherUser.id,
        otherUserName: otherUser.name,
        otherUserAvatar: otherUser.avatar,
        lastMessage: lastMessage
          ? lastMessage.attachments.length > 0
            ? '📎 Фото'
            : lastMessage.content || 'Сообщение'
          : 'Нет сообщений',
        lastMessageTime: lastMessage?.createdAt || chat.createdAt,
        unreadCount: 0, // Пока без подсчета непрочитанных
      };
    });

    return NextResponse.json(formattedChats);
  } catch (error) {
    console.error('Error fetching chats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
