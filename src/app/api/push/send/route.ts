import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import webpush from 'web-push';

// Настройка VAPID ключей
const vapidKeys = {
  subject: 'mailto:eutyou@gmail.com',
  publicKey: process.env.VAPID_PUBLIC_KEY,
  privateKey: process.env.VAPID_PRIVATE_KEY,
};

// Проверяем наличие VAPID ключей
if (!vapidKeys.publicKey || !vapidKeys.privateKey) {
  throw new Error(
    'VAPID keys not configured. Please set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY environment variables.'
  );
}

// Настройка web-push
webpush.setVapidDetails(
  vapidKeys.subject,
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

export async function POST(request: NextRequest) {
  try {
    const { userId, title, body, data, icon, badge } = await request.json();

    if (!userId || !title || !body) {
      return NextResponse.json(
        { error: 'Отсутствуют обязательные поля: userId, title, body' },
        { status: 400 }
      );
    }

    // Получаем все подписки пользователя (несколько устройств)
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId },
    });

    if (!subscriptions.length) {
      return NextResponse.json(
        { error: 'Пользователь не подписан на push-уведомления' },
        { status: 404 }
      );
    }

    // Формируем payload для push-уведомления
    const payload = JSON.stringify({
      title,
      body,
      icon: icon || '/icons/icon-192.png',
      badge: badge || '/icons/icon-badge-72.png',
      data: data || {},
      timestamp: Date.now(),
    });

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

    // Чистим устаревшие подписки (410 Gone)
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const sub = subscriptions[i];

      if (
        result.status === 'rejected' &&
        (result.reason as any)?.statusCode === 410
      ) {
        await prisma.pushSubscription.delete({
          where: { id: sub.id },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Send push notification error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
