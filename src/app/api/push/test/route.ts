import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

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
    const { title, body } = await request.json();

    console.log('[push/test] incoming request', {
      userId,
      title,
      body,
    });

    if (!title || !body) {
      return NextResponse.json(
        { error: 'Необходимо указать title и body' },
        { status: 400 }
      );
    }

    // Получаем все подписки пользователя
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId },
    });

    console.log('[push/test] found subscriptions', {
      count: subscriptions.length,
      endpoints: subscriptions.map((s) => s.endpoint),
    });

    if (!subscriptions.length) {
      return NextResponse.json(
        { error: 'Пользователь не подписан на push-уведомления' },
        { status: 404 }
      );
    }

    // Импортируем web-push динамически
    const webpush = (await import('web-push')).default;

    // Настройка VAPID ключей
    webpush.setVapidDetails(
      'mailto:eutyou@gmail.com',
      process.env.VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!
    );

    // Формируем payload
    const payload = JSON.stringify({
      title,
      body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-badge-72.png',
      data: {
        type: 'test',
        timestamp: Date.now(),
      },
    });

    // Отправляем push на все устройства
    const results = await Promise.allSettled(
      subscriptions.map((subscription) => {
        const pushSubscription = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth,
          },
        };

        return webpush.sendNotification(pushSubscription, payload);
      })
    );

    console.log('[push/test] sendNotification results', results);

    // Чистим устаревшие подписки
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const sub = subscriptions[i];

      if (result.status === 'rejected') {
        console.error('[push/test] sendNotification error', {
          endpoint: sub.endpoint,
          reason: result.reason,
        });

        if ((result.reason as any)?.statusCode === 410) {
          await prisma.pushSubscription.delete({
            where: { id: sub.id },
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Push-уведомление отправлено',
    });
  } catch (error) {
    console.error('Send test push error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
