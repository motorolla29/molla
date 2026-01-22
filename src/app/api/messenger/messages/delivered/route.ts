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

    const userId = Number((decoded as any).userId);

    const { messageIds }: { messageIds: string[] } = await request.json();

    if (!messageIds || messageIds.length === 0) {
      return NextResponse.json(
        { error: 'Message IDs are required' },
        { status: 400 }
      );
    }

    // Обновляем статус сообщений на delivered
    const updateResult = await prisma.message.updateMany({
      where: {
        id: { in: messageIds },
        status: 'sent', // Только сообщения со статусом sent
      },
      data: {
        status: 'delivered',
      },
    });

    // Отправляем WebSocket событие для обновления статуса в реальном времени
    if (updateResult.count > 0) {
      try {
        const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4001';
        const response = await fetch(`${socketUrl}/emit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            event: 'message_delivered',
            data: {
              messageIds: messageIds,
              userId: userId,
            },
          }),
        });

        if (!response.ok) {
          console.error('Error sending socket event via HTTP:', response.status, await response.text());
        }
      } catch (socketError) {
        console.error('Error sending socket event:', socketError);
      }
    }

    return NextResponse.json({
      success: true,
      updatedCount: updateResult.count,
    });
  } catch (error) {
    console.error('Error marking messages as delivered:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}