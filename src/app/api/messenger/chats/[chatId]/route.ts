import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> },
) {
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
    const { chatId } = await params;

    // Получаем информацию о чате с последним сообщением
    const chat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        OR: [{ buyerId: userId }, { sellerId: userId }],
      },
      include: {
        ad: {
          select: {
            id: true,
            title: true,
            photos: true,
            price: true,
            currency: true,
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
    });

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    // Форматируем данные для фронтенда
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

    // Определяем, удалено ли объявление
    const isAdDeleted = !chat.ad;

    // Проверяем блокировки между пользователями (только если собеседник ещё существует)
    let isBlockedByMe = false;
    let isBlockedMe = false;

    if (otherUser) {
      const blocks = await prisma.userBlock.findMany({
        where: {
          OR: [
            {
              blockerId: userId,
              blockedId: otherUser.id,
            },
            {
              blockerId: otherUser.id,
              blockedId: userId,
            },
          ],
        },
        select: {
          blockerId: true,
          blockedId: true,
        },
      });

      isBlockedByMe = blocks.some(
        (b) => b.blockerId === userId && b.blockedId === otherUser.id,
      );
      isBlockedMe = blocks.some(
        (b) => b.blockerId === otherUser.id && b.blockedId === userId,
      );
    }

    const formattedChat = {
      id: chat.id,
      adId: chat.adId,
      adTitle: isAdDeleted ? 'Объявление удалено' : chat.ad!.title,
      adPhoto: isAdDeleted ? '' : chat.ad!.photos[0] || '',
      adPrice: isAdDeleted
        ? undefined
        : chat.ad!.price
          ? `${chat.ad!.price.toLocaleString('ru-RU')} ${
              chat.ad!.currency || 'RUB'
            }`
          : undefined,
      adCity: isAdDeleted ? '' : chat.ad!.city,
      adCityLabel: isAdDeleted ? '' : chat.ad!.cityLabel,
      adCategory: isAdDeleted ? 'goods' : chat.ad!.category,
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
      isBlockedByMe,
      isBlockedMe,
    };

    return NextResponse.json(formattedChat);
  } catch (error) {
    console.error('Error fetching chat:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
