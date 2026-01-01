import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateToken } from '@/lib/jwt';
import { registrationCache, connectRedis } from '@/lib/redis';

export async function POST(request: NextRequest) {
  try {
    const { email, code, isRegistration } = await request.json();

    // Нормализуем email к нижнему регистру для нечувствительности к регистру
    const normalizedEmail = email.toLowerCase().trim();

    if (!normalizedEmail || !code || code.length !== 6) {
      return NextResponse.json(
        { error: 'Некорректные данные' },
        { status: 400 }
      );
    }

    let user;

    if (isRegistration) {
      // Регистрация - проверяем данные в Redis
      const tempData = await registrationCache.get(normalizedEmail);

      if (!tempData) {
        console.log('No temp data found in Redis');
        return NextResponse.json(
          {
            error:
              'Данные регистрации не найдены. Повторите процесс регистрации.',
          },
          { status: 404 }
        );
      }

      // Проверяем код
      if (tempData.verificationCode !== code) {
        return NextResponse.json(
          { error: 'Неверный код подтверждения' },
          { status: 400 }
        );
      }

      // Проверяем срок действия кода
      if (new Date(tempData.verificationCodeExpires) < new Date()) {
        await registrationCache.delete(normalizedEmail);
        return NextResponse.json(
          { error: 'Код подтверждения истек' },
          { status: 400 }
        );
      }

      // Находим максимальный ID среди существующих пользователей
      const maxUser = await prisma.seller.findFirst({
        orderBy: { id: 'desc' },
        select: { id: true },
      });

      // Начальный ID для новых пользователей - 10000
      const nextId = Math.max((maxUser?.id || 0) + 1, 10000);

      // Создаем пользователя в БД
      user = await prisma.seller.create({
        data: {
          id: nextId,
          name: tempData.name,
          email: normalizedEmail, // Сохраняем нормализованный email
          password: tempData.password,
          city: tempData.city,
        },
      });

      // Удаляем временные данные из Redis
      await registrationCache.delete(normalizedEmail);
    } else {
      // Вход - проверяем данные в Redis
      const tempData = await registrationCache.get(normalizedEmail);

      if (!tempData) {
        console.log('No temp data found in Redis for login');
        return NextResponse.json(
          {
            error:
              'Данные для входа не найдены. Повторите процесс авторизации.',
          },
          { status: 404 }
        );
      }

      // Проверяем код
      if (tempData.verificationCode !== code) {
        return NextResponse.json(
          { error: 'Неверный код подтверждения' },
          { status: 400 }
        );
      }

      // Проверяем срок действия кода
      if (new Date(tempData.verificationCodeExpires) < new Date()) {
        await registrationCache.delete(normalizedEmail);
        return NextResponse.json(
          { error: 'Код подтверждения истек' },
          { status: 400 }
        );
      }

      // Находим пользователя в БД
      user = await prisma.seller.findUnique({
        where: { email: normalizedEmail },
      });

      if (!user) {
        await registrationCache.delete(normalizedEmail);
        return NextResponse.json(
          { error: 'Пользователь не найден' },
          { status: 404 }
        );
      }

      // Удаляем временные данные из Redis
      await registrationCache.delete(normalizedEmail);
    }

    // Генерируем JWT токен
    const token = generateToken({
      userId: user.id,
      email: user.email,
    });

    // Создаем response с токеном в cookies
    const response = NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        phone: user.phone,
        rating: user.rating,
        city: (user as any).city,
      },
      token,
    });

    // Устанавливаем токен в httpOnly cookie для безопасности
    const isSecure = request.nextUrl.protocol === 'https:';
    response.cookies.set('token', token, {
      httpOnly: true, // Защищает от XSS атак
      secure: isSecure,
      sameSite: isSecure ? 'none' : 'lax', // Защита от CSRF
      maxAge: 2592000, // 30 дней
      path: '/', // Доступен для всего сайта
    });

    return response;
  } catch (error) {
    console.error('Verify code error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
