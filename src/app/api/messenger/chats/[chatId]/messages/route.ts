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

    if (beforeId) {
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

    // Мы запрашивали сообщения в порядке `desc`, поэтому разворачиваем,
    // чтобы на фронте они были в привычном `asc`
    const orderedMessages = [...messages].reverse();

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
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
