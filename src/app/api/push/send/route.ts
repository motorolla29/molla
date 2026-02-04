import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import webpush from 'web-push';

// Настройка VAPID ключей (в продакшене должны быть в .env)
const vapidKeys = {
  subject: 'mailto:admin@molla.app',
  publicKey: process.env.VAPID_PUBLIC_KEY || 'BKxQzHdJC8q3yJ8Q3Q3Q3Q3Q3Q3Q3Q3Q3Q3Q3Q3Q3Q3Q3Q3Q3Q3Q3Q3Q3Q3Q3Q3Q3Q3Q3Q3Q3Q3Q3Q3Q3Q3Q3Q3Q3Q3Q3',
  privateKey: process.env.VAPID_PRIVATE_KEY || '3Q3Q3Q3Q3Q3Q3Q3Q3Q3Q3Q3Q3Q3Q3Q3Q3Q3Q3Q3Q3Q3Q3Q3Q3Q3Q3Q3Q3Q3Q3Q3Q3Q3Q3Q3Q3Q3Q3Q3Q3Q3Q3Q',
};

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

    // Получаем подписку пользователя
    const subscription = await prisma.pushSubscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
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
      badge: badge || '/icons/icon-72.png',
      data: data || {},
      timestamp: Date.now(),
    });

    // Отправляем push-уведомление
    const pushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth,
      },
    };

    try {
      await webpush.sendNotification(pushSubscription, payload);
      return NextResponse.json({ success: true });
    } catch (pushError: any) {
      console.error('Push notification failed:', pushError);

      // Если подписка устарела, удаляем её
      if (pushError.statusCode === 410) {
        await prisma.pushSubscription.delete({
          where: { userId },
        });
        return NextResponse.json(
          { error: 'Подписка устарела и была удалена' },
          { status: 410 }
        );
      }

      return NextResponse.json(
        { error: 'Ошибка отправки push-уведомления' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Send push notification error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}