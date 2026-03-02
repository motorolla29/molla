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

    // Получаем query параметры для пагинации
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const beforeId = url.searchParams.get('beforeId');

    // Получаем чаты пользователя:
    // - Все чаты где пользователь является покупателем (даже пустые)
    // - Только чаты где пользователь является продавцом И есть сообщения
    const [buyerChats, sellerChats] = await Promise.all([
      // Чаты где пользователь - покупатель (скрытые не фильтруем здесь)
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

    // Сначала сортируем чаты по времени последнего сообщения (для базовой сортировки)
    let chats = [...buyerChats, ...sellerChats].sort((a, b) => {
      const aTime = a.messages[0]?.createdAt || a.createdAt;
      const bTime = b.messages[0]?.createdAt || b.createdAt;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });

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

    // Загружаем скрытия чатов для текущего пользователя
    const hidden = await prisma.chatHidden.findMany({
      where: {
        userId,
        chatId: {
          in: chats.map((c) => c.id),
        },
      },
      select: {
        chatId: true,
        deletedAt: true,
      },
    });

    const hiddenMap = new Map<string, Date>();
    hidden.forEach((h) => hiddenMap.set(h.chatId, h.deletedAt));

    // Собираем ID собеседников для проверки блокировок (фильтруем null-ы)
    const otherUserIds = chats
      .map((chat) => (chat.buyerId === userId ? chat.sellerId : chat.buyerId))
      .filter((id): id is number => typeof id === 'number');

    const blocks = otherUserIds.length
      ? await prisma.userBlock.findMany({
          where: {
            OR: [
              {
                blockerId: userId,
                blockedId: { in: otherUserIds },
              },
              {
                blockerId: { in: otherUserIds },
                blockedId: userId,
              },
            ],
          },
          select: {
            blockerId: true,
            blockedId: true,
          },
        })
      : [];

    // Форматируем данные для фронтенда и подсчитываем непрочитанные сообщения
    const formattedChatsWithNulls = await Promise.all(
      chats.map(async (chat) => {
        const isBuyer = chat.buyerId === userId;
        const otherUser = isBuyer ? chat.seller : chat.buyer;
        const lastMessage = chat.messages[0];

        // Проверяем, скрывал ли пользователь этот чат
        const hiddenAt = hiddenMap.get(chat.id);
        if (hiddenAt) {
          // Считаем эффективное "последнее событие" по времени
          const lastEventTime = lastMessage?.createdAt || chat.createdAt;
          // Если после скрытия не было новых сообщений — чат остаётся скрытым
          if (!lastEventTime || lastEventTime <= hiddenAt) {
            return null;
          }
        }

        // Подсчитываем непрочитанные сообщения параллельно
        const unreadCount = await prisma.message.count({
          where: {
            chatId: chat.id,
            senderId: { not: userId }, // Сообщения от другого пользователя
            status: { not: 'read' }, // Не прочитанные
          },
        });

        // Получаем время последнего непрочитанного сообщения
        let lastUnreadMessageTime = null;
        if (unreadCount > 0) {
          const lastUnreadMessage = await prisma.message.findFirst({
            where: {
              chatId: chat.id,
              senderId: { not: userId },
              status: { not: 'read' },
            },
            orderBy: {
              createdAt: 'desc',
            },
            select: {
              createdAt: true,
            },
          });
          lastUnreadMessageTime = lastUnreadMessage?.createdAt || null;
        }

        // Определяем, удалено ли объявление
        const isAdDeleted = !chat.ad;

        let isBlockedByMe = false;
        let isBlockedMe = false;

        if (otherUser) {
          isBlockedByMe = blocks.some(
            (b) => b.blockerId === userId && b.blockedId === otherUser.id,
          );
          isBlockedMe = blocks.some(
            (b) => b.blockerId === otherUser.id && b.blockedId === userId,
          );
        }

        return {
          id: chat.id,
          adId: chat.adId,
          adTitle: isAdDeleted ? 'Объявление удалено' : chat.ad!.title,
          adPhoto: isAdDeleted ? null : chat.ad!.photos[0] || '',
          adCity: isAdDeleted ? null : chat.ad!.city,
          adCityLabel: isAdDeleted ? null : chat.ad!.cityLabel,
          adCategory: isAdDeleted ? null : chat.ad!.category,
          isAdDeleted,
          otherUserId: otherUser?.id ?? null,
          otherUserName: otherUser?.name ?? 'Пользователь удален',
          otherUserAvatar: otherUser?.avatar ?? null,
          otherUserLastSeenAt: otherUser?.lastSeenAt ?? null,
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
          lastUnreadMessageTime,
          isBlockedByMe,
          isBlockedMe,
        };
      }),
    );

    const formattedChats = formattedChatsWithNulls.filter(
      (chat): chat is NonNullable<typeof chat> => chat !== null,
    );

    return NextResponse.json({
      chats: formattedChats,
      hasMore,
    });
  } catch (error) {
    console.error('Error fetching chats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
