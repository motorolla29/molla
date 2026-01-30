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
        { status: 401 },
      );
    }

    const decoded = verifyToken(token);
    if (!decoded || typeof decoded !== 'object' || !('userId' in decoded)) {
      return NextResponse.json({ error: 'Неверный токен' }, { status: 401 });
    }

    const userId = Number((decoded as any).userId);

    // Получаем query параметры для пагинации
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const beforeId = url.searchParams.get('beforeId');

    // Получаем чаты пользователя:
    // - Все чаты где пользователь является покупателем (даже пустые)
    // - Только чаты где пользователь является продавцом И есть сообщения
    const [buyerChats, sellerChats] = await Promise.all([
      // Чаты где пользователь - покупатель
      prisma.chat.findMany({
        where: {
          buyerId: userId,
        },
        include: {
          ad: {
            select: {
              id: true,
              title: true,
              photos: true,
              city: true,
              cityLabel: true,
              category: true,
            },
          },
          buyer: {
            select: {
              id: true,
              name: true,
              avatar: true,
              lastSeenAt: true,
            },
          },
          seller: {
            select: {
              id: true,
              name: true,
              avatar: true,
              lastSeenAt: true,
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
              status: true,
              senderId: true,
              attachments: {
                select: {
                  fileType: true,
                },
              },
            },
          },
        },
      }),
      // Чаты где пользователь - продавец, но только с сообщениями
      prisma.chat.findMany({
        where: {
          sellerId: userId,
          messages: {
            some: {}, // Есть хотя бы одно сообщение
          },
        },
        include: {
          ad: {
            select: {
              id: true,
              title: true,
              photos: true,
              city: true,
              cityLabel: true,
              category: true,
            },
          },
          buyer: {
            select: {
              id: true,
              name: true,
              avatar: true,
              lastSeenAt: true,
            },
          },
          seller: {
            select: {
              id: true,
              name: true,
              avatar: true,
              lastSeenAt: true,
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
              status: true,
              senderId: true,
              attachments: {
                select: {
                  fileType: true,
                },
              },
            },
          },
        },
      }),
    ]);

    // Сортируем чаты по времени последнего обновления
    let chats = [...buyerChats, ...sellerChats].sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );

    // Применяем пагинацию
    let hasMore = false;
    if (beforeId) {
      const beforeIndex = chats.findIndex((chat) => chat.id === beforeId);
      if (beforeIndex !== -1) {
        chats = chats.slice(beforeIndex + 1);
      }
    }

    if (chats.length > limit) {
      chats = chats.slice(0, limit);
      hasMore = true;
    }

    // Форматируем данные для фронтенда и подсчитываем непрочитанные сообщения
    const formattedChats = await Promise.all(
      chats.map(async (chat) => {
        const isBuyer = chat.buyerId === userId;
        const otherUser = isBuyer ? chat.seller : chat.buyer;
        const lastMessage = chat.messages[0];

        // Подсчитываем непрочитанные сообщения параллельно
        const unreadCount = await prisma.message.count({
          where: {
            chatId: chat.id,
            senderId: { not: userId }, // Сообщения от другого пользователя
            status: { not: 'read' }, // Не прочитанные
          },
        });

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
          otherUserLastSeenAt: otherUser.lastSeenAt,
          lastMessage: lastMessage
            ? lastMessage.attachments &&
              lastMessage.attachments.length > 0 &&
              lastMessage.attachments.some((att: any) =>
                att.fileType?.startsWith('image/'),
              ) &&
              !lastMessage.content?.trim()
              ? '📎 Фото'
              : lastMessage.content || 'Сообщение'
            : 'Нет сообщений',
          lastMessageTime: lastMessage?.createdAt || chat.createdAt,
          lastMessageStatus: lastMessage?.status || null,
          lastMessageIsOutgoing: lastMessage
            ? lastMessage.senderId === userId
            : false,
          unreadCount,
        };
      }),
    );

    return NextResponse.json({
      chats: formattedChats,
      hasMore,
    });
  } catch (error) {
    console.error('Error fetching chats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
