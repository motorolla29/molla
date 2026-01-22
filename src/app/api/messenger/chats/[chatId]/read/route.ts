import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const { chatId } = await params;

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

    // Проверяем, что чат существует и пользователь является участником
    const chat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        OR: [{ buyerId: userId }, { sellerId: userId }],
      },
    });

    if (!chat) {
      return NextResponse.json(
        { error: 'Чат не найден' },
        { status: 404 }
      );
    }

    // Определяем ID другого пользователя
    const otherUserId = chat.buyerId === userId ? chat.sellerId : chat.buyerId;

    // Получаем ID сообщений которые будут обновлены (для отправки через WebSocket)
    const messagesToUpdate = await prisma.message.findMany({
      where: {
        chatId: chatId,
        senderId: otherUserId, // Только сообщения от другого пользователя
        status: { not: 'read' }, // Не прочитанные
      },
      select: { id: true },
    });

    // Отмечаем все сообщения от другого пользователя как прочитанные
    const updateResult = await prisma.message.updateMany({
      where: {
        chatId: chatId,
        senderId: otherUserId, // Только сообщения от другого пользователя
        status: { not: 'read' }, // Не прочитанные
      },
      data: {
        status: 'read',
      },
    });

    // Отправляем WebSocket событие для обновления статуса в реальном времени
    if (updateResult.count > 0 && messagesToUpdate.length > 0) {
      try {
        const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4001';
        const response = await fetch(`${socketUrl}/emit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            event: 'mark_messages_read',
            data: {
              chatId: chatId,
              userId: userId,
              updatedMessageIds: messagesToUpdate.map(msg => msg.id),
            },
          }),
        });

        if (!response.ok) {
          console.error('Error sending socket event via HTTP:', response.status, await response.text());
        }
      } catch (socketError) {
        console.error('Error sending socket event:', socketError);
        // Не прерываем выполнение API из-за ошибки сокета
      }
    }

    // Возвращаем количество обновленных сообщений
    return NextResponse.json({
      success: true,
      updatedCount: updateResult.count,
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}