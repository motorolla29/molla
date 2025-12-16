import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateToken } from '@/lib/jwt';
import { registrationCache, connectRedis } from '@/lib/redis';

export async function POST(request: NextRequest) {
  try {
    const { email, code, isRegistration } = await request.json();

    if (!email || !code || code.length !== 6) {
      return NextResponse.json(
        { error: 'Некорректные данные' },
        { status: 400 }
      );
    }

    let user;

    if (isRegistration) {
      // Регистрация - проверяем данные в Redis
      const tempData = await registrationCache.get(email);

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
        await registrationCache.delete(email);
        return NextResponse.json(
          { error: 'Код подтверждения истек' },
          { status: 400 }
        );
      }

      // Создаем пользователя в БД
      user = await prisma.seller.create({
        data: {
          name: tempData.name,
          email: email, // Используем email из параметра запроса
          password: tempData.password,
          city: tempData.city,
        },
      });

      // Удаляем временные данные из Redis
      await registrationCache.delete(email);
    } else {
      // Вход - проверяем данные в Redis
      const tempData = await registrationCache.get(email);

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
        await registrationCache.delete(email);
        return NextResponse.json(
          { error: 'Код подтверждения истек' },
          { status: 400 }
        );
      }

      // Находим пользователя в БД
      user = await prisma.seller.findUnique({
        where: { email },
      });

      if (!user) {
        await registrationCache.delete(email);
        return NextResponse.json(
          { error: 'Пользователь не найден' },
          { status: 404 }
        );
      }

      // Удаляем временные данные из Redis
      await registrationCache.delete(email);
    }

    // Генерируем JWT токен
    const token = generateToken({
      userId: user.id,
      email: user.email,
    });

    return NextResponse.json({
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
  } catch (error) {
    console.error('Verify code error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
