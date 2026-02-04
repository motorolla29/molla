import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateToken } from '@/lib/jwt';
import bcrypt from 'bcryptjs';
import { createDeviceDescription } from '@/utils/device';

// Вспомогательная функция для извлечения IP
function getClientIp(req: NextRequest): string | null {
  const xForwardedFor = req.headers.get('x-forwarded-for');
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim();
  }
  return req.ip ?? null;
}

export async function POST(request: NextRequest) {
  try {
    const { email, password, deviceId } = await request.json();

    // Нормализуем email к нижнему регистру
    const normalizedEmail = email.toLowerCase().trim();

    if (!normalizedEmail || !password) {
      return NextResponse.json(
        { error: 'Email и пароль обязательны' },
        { status: 400 }
      );
    }

    // Находим пользователя
    const user = await prisma.seller.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user || !user.password) {
      return NextResponse.json(
        { error: 'Неверный email или пароль' },
        { status: 401 }
      );
    }

    // Проверяем пароль
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Неверный email или пароль' },
        { status: 401 }
      );
    }

    // Генерируем JWT токен
    const token = generateToken({
      userId: user.id,
      email: user.email,
    });

    const response = NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        phone: user.phone,
        rating: user.rating,
      },
      token,
    });

    // Устанавливаем токен в httpOnly cookie для middleware (клиент не может читать для безопасности)
    const isSecure = request.nextUrl.protocol === 'https:';
    response.cookies.set('token', token, {
      httpOnly: true, // Защищает от XSS атак
      secure: isSecure,
      sameSite: isSecure ? 'none' : 'lax',
      maxAge: 2592000, // 30 дней
      path: '/',
    });

    // Детектим вход с нового устройства (асинхронно, чтобы не тормозить ответ)
    (async () => {
      try {
        // deviceId должен приходить с клиента (например, генерируем и храним в localStorage и отправляем в теле запроса)
        const rawDeviceId =
          typeof deviceId === 'string' && deviceId.trim().length > 0
            ? deviceId.trim()
            : null;

        const ua = request.headers.get('user-agent') || 'Unknown';
        const ip = getClientIp(request);

        if (!rawDeviceId) {
          // Если нет deviceId, просто выходим — считаем устройство "неидентифицированным"
          return;
        }

        const existing = await prisma.loginDevice.findUnique({
          where: {
            userId_deviceId: {
              userId: user.id,
              deviceId: rawDeviceId,
            },
          },
        });

        if (existing) {
          // Обновляем lastSeen — устройство нам уже знакомо
          await prisma.loginDevice.update({
            where: { id: existing.id },
            data: {
              lastSeen: new Date(),
              userAgent: ua,
              ip: ip ?? existing.ip,
            },
          });
          return;
        }

        // Новое устройство — сохраняем и создаём in-app уведомление
        const newDevice = await prisma.loginDevice.create({
          data: {
            userId: user.id,
            deviceId: rawDeviceId,
            userAgent: ua,
            ip: ip ?? undefined,
          },
        });

        // Готовим человекочитаемое описание устройства
        const deviceDescription = await createDeviceDescription(
          ua,
          ip,
          new Date()
        );

        const notification = await prisma.inAppNotification.create({
          data: {
            userId: user.id,
            type: 'login_new_device',
            title: 'Вход с нового устройства',
            message: `Мы зафиксировали вход с нового устройства: ${deviceDescription}. Если это были не вы, смените пароль.`,
            data: {
              deviceId: newDevice.deviceId,
              userAgent: newDevice.userAgent,
              ip: newDevice.ip,
              createdAt: newDevice.createdAt.toISOString(),
            },
          },
        });

        // Отправляем событие через Socket.IO, чтобы обновить счётчик уведомлений в реальном времени
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
                userId: user.id,
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
      } catch (err) {
        console.error('Failed to handle new device login notification:', err);
      }
    })();

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
