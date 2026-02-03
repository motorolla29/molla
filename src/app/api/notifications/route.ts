import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

export async function GET(request: NextRequest) {
  try {
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
    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const last30days = searchParams.get('last30days') === 'true';

    if (unreadOnly) {
      // Дата 30 дней назад
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const whereCondition: any = {
        userId,
        isRead: false,
      };

      // Если запрошено только за последние 30 дней
      if (last30days) {
        whereCondition.createdAt = {
          gte: thirtyDaysAgo,
        };
      }

      // Быстрый запрос только для счетчика непрочитанных
      const unreadCount = await prisma.inAppNotification.count({
        where: whereCondition,
        take: 20, // Ограничиваем счетчик до 20 для производительности
      });

      return NextResponse.json({ unreadCount });
    }

    // Дата 30 дней назад
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Получаем последние 20 уведомлений за последние 30 дней
    const notifications = await prisma.inAppNotification.findMany({
      where: {
        userId,
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error('Get notifications error:', error);
    return NextResponse.json(
      { error: 'Ошибка получения уведомлений' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
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
    const { type, title, message, data } = await request.json();

    if (!type || !title || !message) {
      return NextResponse.json(
        { error: 'Необходимо указать type, title и message' },
        { status: 400 }
      );
    }

    // Создаем уведомление
    const notification = await prisma.inAppNotification.create({
      data: {
        userId,
        type,
        title,
        message,
        data: data || {},
      },
    });

    // Отправляем событие через Socket.IO асинхронно
    (async () => {
      try {
        await fetch(
          `${process.env.NEXT_PUBLIC_SOCKET_URL} || 'http://localhost:4001`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              event: 'user-notification',
              data: {
                userId,
                notification: {
                  id: notification.id,
                  type: notification.type,
                  title: notification.title,
                  message: notification.message,
                  createdAt: notification.createdAt.toISOString(),
                },
              },
            }),
          }
        );
        console.log('Notification sent via Socket.IO:', notification);
      } catch (error) {
        console.error('Failed to send notification via Socket.IO:', error);
      }
    })();

    return NextResponse.json({ notification }, { status: 201 });
  } catch (error) {
    console.error('Create notification error:', error);
    return NextResponse.json(
      { error: 'Ошибка создания уведомления' },
      { status: 500 }
    );
  }
}
