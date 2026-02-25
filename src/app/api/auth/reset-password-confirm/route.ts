import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { registrationCache } from '@/lib/redis';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (
      !token ||
      typeof token !== 'string' ||
      !password ||
      typeof password !== 'string'
    ) {
      return NextResponse.json(
        { error: 'Некорректные данные' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Пароль должен содержать минимум 6 символов' },
        { status: 400 }
      );
    }

    const tempData = await registrationCache.get(token);

    if (!tempData || tempData.type !== 'password_reset') {
      return NextResponse.json(
        { error: 'Ссылка для сброса пароля недействительна или устарела' },
        { status: 400 }
      );
    }

    if (new Date(tempData.expiresAt) < new Date()) {
      await registrationCache.delete(token);
      return NextResponse.json(
        { error: 'Ссылка для сброса пароля истекла' },
        { status: 400 }
      );
    }

    const email = tempData.email as string | undefined;

    if (!email) {
      await registrationCache.delete(token);
      return NextResponse.json(
        { error: 'Некорректные данные для сброса пароля' },
        { status: 400 }
      );
    }

    const user = await prisma.seller.findUnique({
      where: { email },
    });

    if (!user) {
      await registrationCache.delete(token);
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.seller.update({
      where: { email },
      data: { password: hashedPassword },
    });

    await registrationCache.delete(token);

    const userId = user.id;

    (async () => {
      try {
        const notification = await prisma.inAppNotification.create({
          data: {
            userId,
            type: 'system',
            title: 'Пароль изменен',
            message:
              'Вы успешно изменили пароль. Если это были не вы, немедленно сбросьте пароль и свяжитесь с поддержкой.',
            data: {
              type: 'password_change',
              timestamp: new Date().toISOString(),
            },
          },
        });

        await fetch(
          `${
            process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4001'
          }/emit`,
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

        await fetch(
          `${process.env.CORS_ORIGIN || 'http://localhost:3000'}/api/push/send`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId,
              title: '🔑 Пароль изменен',
              body: 'Ваш пароль был успешно изменен.',
              data: {
                type: 'password_change',
                timestamp: new Date().toISOString(),
              },
            }),
          }
        ).catch((err) => {
          console.error(
            'Failed to send push notification for password change:',
            err
          );
        });
      } catch (err) {
        console.error('Failed to create/send password change notification:', err);
      }
    })();

    return NextResponse.json({
      message: 'Пароль успешно изменен. Теперь вы можете войти с новым паролем.',
    });
  } catch (error) {
    console.error('Reset password confirm error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
