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

    // Проверяем, что пользователь имеет доступ к этому чату
    const chat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        OR: [{ buyerId: userId }, { sellerId: userId }],
      },
    });

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    // Проверяем, скрывал ли пользователь этот чат раньше,
    // чтобы показывать только сообщения после момента удаления
    const hidden = await prisma.chatHidden.findUnique({
      where: {
        chatId_userId: {
          chatId,
          userId,
        },
      },
      select: {
        deletedAt: true,
      },
    });

    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const beforeId = searchParams.get('beforeId');
    const anchorId = searchParams.get('anchorId');

    const limit = Math.min(
      100,
      Math.max(1, Number.isNaN(Number(limitParam)) ? 50 : Number(limitParam)),
    );

    // Базовый where для сообщений текущего чата
    const baseWhere: any = {
      chatId: chatId,
    };

    if (hidden?.deletedAt) {
      baseWhere.createdAt = {
        gt: hidden.deletedAt,
      };
    }

    let messages;
    let hasMore = false;

    if (anchorId && !beforeId) {
      // Режим "якоря": вернуть пачку, содержащую anchor, + всё что новее него (в разумном лимите).
      const anchor = await prisma.message.findFirst({
        where: {
          id: anchorId,
          chatId: chatId,
          ...(baseWhere.createdAt ? { createdAt: baseWhere.createdAt } : {}),
        },
        select: { id: true, createdAt: true },
      });

      if (!anchor) {
        return NextResponse.json(
          { error: 'Anchor message not found' },
          { status: 404 },
        );
      }

      // Берём "контекст" до якоря включительно (limit штук)
      const olderOrEqual = await prisma.message.findMany({
        where: {
          ...baseWhere,
          createdAt: {
            ...(baseWhere.createdAt || {}),
            lte: anchor.createdAt,
          },
        },
        include: {
          sender: { select: { id: true, name: true, avatar: true } },
          attachments: {
            select: { id: true, fileUrl: true, fileName: true, fileType: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      // Всё что новее якоря (cap чтобы не унести много данных)
      const newer = await prisma.message.findMany({
        where: {
          ...baseWhere,
          createdAt: {
            ...(baseWhere.createdAt || {}),
            gt: anchor.createdAt,
          },
        },
        include: {
          sender: { select: { id: true, name: true, avatar: true } },
          attachments: {
            select: { id: true, fileUrl: true, fileName: true, fileType: true },
          },
        },
        orderBy: { createdAt: 'asc' },
        take: 500,
      });

      const orderedOlder = [...olderOrEqual].reverse(); // asc
      messages = [...orderedOlder, ...newer]; // asc

      // Есть ли ещё более старые сообщения выше верхней границы
      if (orderedOlder.length > 0) {
        const oldest = orderedOlder[0];
        const olderCount = await prisma.message.count({
          where: {
            ...baseWhere,
            createdAt: {
              ...(baseWhere.createdAt || {}),
              lt: oldest.createdAt,
            },
          },
        });
        hasMore = olderCount > 0;
      } else {
        hasMore = false;
      }
    } else if (beforeId) {
      // Загрузка более старых сообщений (пачка "выше")
      const beforeMessage = await prisma.message.findUnique({
        where: { id: beforeId },
        select: { createdAt: true },
      });

      if (!beforeMessage) {
        return NextResponse.json(
          { error: 'Message cursor not found' },
          { status: 400 },
        );
      }

      messages = await prisma.message.findMany({
        where: {
          ...baseWhere,
          createdAt: {
            ...(baseWhere.createdAt || {}),
            lt: beforeMessage.createdAt,
          },
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
          attachments: {
            select: {
              id: true,
              fileUrl: true,
              fileName: true,
              fileType: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
      });

      // Проверяем, есть ли еще более старые сообщения
      if (messages.length > 0) {
        const oldestInBatch = messages[messages.length - 1];
        const olderCount = await prisma.message.count({
          where: {
            ...baseWhere,
            createdAt: {
              ...(baseWhere.createdAt || {}),
              lt: oldestInBatch.createdAt,
            },
          },
        });
        hasMore = olderCount > 0;
      } else {
        hasMore = false;
      }
    } else {
      // Первоначальная загрузка: последние N сообщений
      messages = await prisma.message.findMany({
        where: baseWhere,
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
          attachments: {
            select: {
              id: true,
              fileUrl: true,
              fileName: true,
              fileType: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
      });

      const totalCount = await prisma.message.count({
        where: baseWhere,
      });

      hasMore = totalCount > messages.length;
    }

    // Сообщения уже могут быть в asc (anchor-mode) или в desc (обычный режим).
    // Приводим к asc.
    const orderedMessages =
      anchorId && !beforeId ? [...messages] : [...messages].reverse();

    // Форматируем сообщения для фронтенда
    const formattedMessages = orderedMessages.map((message) => ({
      id: message.id,
      stableId: `stable-existing-${message.id}`, // Стабильный ID для существующих сообщений
      content: message.content || '',
      // Если отправитель был удалён, senderId может быть null — даём безопасное значение
      senderId: message.senderId ?? 0,
      senderName: message.sender?.name ?? 'Пользователь удален',
      senderAvatar: message.sender?.avatar ?? null,
      timestamp: message.createdAt,
      type: message.messageType === 'image' ? 'image' : 'text',
      status: message.status,
      attachments: message.attachments.map((attachment) => ({
        id: attachment.id,
        fileUrl: attachment.fileUrl,
        fileName: attachment.fileName,
        fileType: attachment.fileType,
      })),
    }));

    return NextResponse.json({
      messages: formattedMessages,
      hasMore,
      anchorId: anchorId || null,
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
