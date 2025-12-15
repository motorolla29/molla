import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateToken } from '@/lib/jwt';
import { getTempRegistration, deleteTempRegistration } from '@/lib/tempStorage';

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
      // Регистрация - проверяем временное хранилище
      const tempData = await getTempRegistration(email);

      if (!tempData) {
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
      if (tempData.verificationCodeExpires < new Date()) {
        await deleteTempRegistration(email);
        return NextResponse.json(
          { error: 'Код подтверждения истек' },
          { status: 400 }
        );
      }

      // Создаем пользователя в БД
      user = await prisma.seller.create({
        data: {
          name: tempData.name,
          email: tempData.email,
          password: tempData.password,
        },
      });

      // Удаляем временные данные
      await deleteTempRegistration(email);
    } else {
      // Вход - проверяем существующего пользователя
      user = await prisma.seller.findUnique({
        where: { email },
      });

      if (!user) {
        return NextResponse.json(
          { error: 'Пользователь не найден' },
          { status: 404 }
        );
      }

      // Проверяем код
      if (!user.verificationCode || user.verificationCode !== code) {
        return NextResponse.json(
          { error: 'Неверный код подтверждения' },
          { status: 400 }
        );
      }

      // Проверяем срок действия кода
      if (
        !user.verificationCodeExpires ||
        user.verificationCodeExpires < new Date()
      ) {
        return NextResponse.json(
          { error: 'Код подтверждения истек' },
          { status: 400 }
        );
      }

      // Очищаем код верификации
      await prisma.seller.update({
        where: { email },
        data: {
          verificationCode: null,
          verificationCodeExpires: null,
        },
      });
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
