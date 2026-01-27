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

    const formattedChat = {
      id: chat.id,
      adId: chat.ad.id,
      adTitle: chat.ad.title,
      adPhoto: chat.ad.photos[0] || '',
      adPrice: chat.ad.price ? `${chat.ad.price.toLocaleString('ru-RU')} ${chat.ad.currency || 'RUB'}` : undefined,
      adCity: chat.ad.city,
      adCityLabel: chat.ad.cityLabel,
      adCategory: chat.ad.category,
      otherUserId: otherUser.id,
      otherUserName: otherUser.name,
      otherUserAvatar: otherUser.avatar,
      otherUserLastSeenAt: otherUser.lastSeenAt,
      lastMessage: lastMessage
        ? (lastMessage.attachments && lastMessage.attachments.length > 0 &&
           lastMessage.attachments.some((att: any) => att.fileType?.startsWith('image/')) &&
           !lastMessage.content?.trim())
          ? '📎 Фото'
          : lastMessage.content || 'Сообщение'
        : 'Нет сообщений',
      lastMessageTime: lastMessage?.createdAt || chat.createdAt,
      lastMessageStatus: lastMessage?.status || null,
      lastMessageIsOutgoing: lastMessage ? lastMessage.senderId === userId : false,
      unreadCount,
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
