import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';
import { registrationCache } from '@/lib/redis';

export async function PATCH(request: NextRequest) {
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

    const { name, phone, city, email, avatar, verificationCode } =
      await request.json();

    // Получаем текущего пользователя
    const currentUser = await prisma.seller.findUnique({
      where: { id: userId },
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    // Валидация данных
    if (name !== undefined) {
      if (typeof name !== 'string') {
        return NextResponse.json(
          { error: 'Имя должно быть строкой' },
          { status: 400 }
        );
      }

      const trimmedName = name.trim();
      if (trimmedName === '') {
        return NextResponse.json(
          { error: 'Имя не может быть пустым' },
          { status: 400 }
        );
      }

      // Имя должно содержать минимум 2 буквы (латиница или кириллица)
      const lettersMatch = trimmedName.match(/[A-Za-zА-Яа-яЁё]/g);
      if (!lettersMatch || lettersMatch.length < 2) {
        return NextResponse.json(
          { error: 'Имя должно содержать минимум 2 буквы' },
          { status: 400 }
        );
      }
    }

    if (
      phone !== undefined &&
      phone !== null &&
      (typeof phone !== 'string' || phone.trim() === '')
    ) {
      return NextResponse.json(
        { error: 'Телефон должен быть непустой строкой или null' },
        { status: 400 }
      );
    }

    if (
      city !== undefined &&
      city !== null &&
      (typeof city !== 'string' || city.trim() === '')
    ) {
      return NextResponse.json(
        { error: 'Город должен быть непустой строкой или null' },
        { status: 400 }
      );
    }

    if (
      avatar !== undefined &&
      avatar !== null &&
      (typeof avatar !== 'string' || avatar.trim() === '')
    ) {
      return NextResponse.json(
        { error: 'Аватар должен быть непустой строкой или null' },
        { status: 400 }
      );
    }

    // Специальная логика для изменения email
    if (email !== undefined) {
      // Улучшенная валидация email с поддержкой международных доменов
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (typeof email !== 'string' || !emailRegex.test(email)) {
        return NextResponse.json(
          { error: 'Некорректный email адрес' },
          { status: 400 }
        );
      }

      // Проверяем, что email не занят другим пользователем
      const existingUser = await prisma.seller.findUnique({
        where: { email },
      });

      if (existingUser && existingUser.id !== userId) {
        return NextResponse.json(
          { error: 'Этот email уже используется другим пользователем' },
          { status: 400 }
        );
      }

      // Если email не меняется, просто обновляем другие данные
      if (email === currentUser.email) {
        // Обновляем остальные данные без email
        const updatedUser = await prisma.seller.update({
          where: { id: userId },
          data: {
            ...(name !== undefined && { name: name.trim() }),
            ...(phone !== undefined && {
              phone: phone === null ? null : phone.trim(),
            }),
            ...(city !== undefined && {
              city: city === null ? null : city.trim(),
            }),
            ...(avatar !== undefined && {
              avatar: avatar === null ? null : avatar.trim(),
            }),
          },
        });

        return NextResponse.json({
          user: {
            id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            avatar: updatedUser.avatar,
            phone: updatedUser.phone,
            rating: updatedUser.rating,
            city: updatedUser.city,
          },
        });
      }

      // Email меняется - требуется верификация
      if (!verificationCode || verificationCode.length !== 6) {
        return NextResponse.json(
          { error: 'Для изменения email требуется код подтверждения' },
          { status: 400 }
        );
      }

      // Проверяем код верификации из Redis
      const tempData = await registrationCache.get(
        `email_change_${currentUser.email}`
      );

      if (!tempData) {
        return NextResponse.json(
          {
            error:
              'Код подтверждения не найден. Повторите запрос на изменение email.',
          },
          { status: 400 }
        );
      }

      if (tempData.newEmail !== email) {
        return NextResponse.json(
          { error: 'Email в запросе не соответствует ожидаемому' },
          { status: 400 }
        );
      }

      if (tempData.verificationCode !== verificationCode) {
        return NextResponse.json(
          { error: 'Неверный код подтверждения' },
          { status: 400 }
        );
      }

      // Проверяем срок действия кода
      if (new Date(tempData.verificationCodeExpires) < new Date()) {
        await registrationCache.delete(`email_change_${currentUser.email}`);
        return NextResponse.json(
          { error: 'Код подтверждения истек' },
          { status: 400 }
        );
      }

      // Всё ок - обновляем email и другие данные
      const updatedUser = await prisma.seller.update({
        where: { id: userId },
        data: {
          email: email,
          ...(name !== undefined && { name: name.trim() }),
          ...(phone !== undefined && {
            phone: phone === null ? null : phone.trim(),
          }),
          ...(city !== undefined && {
            city: city === null ? null : city.trim(),
          }),
          ...(avatar !== undefined && {
            avatar: avatar === null ? null : avatar.trim(),
          }),
        },
      });

      // Удаляем временные данные из Redis
      await registrationCache.delete(`email_change_${currentUser.email}`);

      return NextResponse.json({
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          avatar: updatedUser.avatar,
          phone: updatedUser.phone,
          rating: updatedUser.rating,
          city: updatedUser.city,
        },
      });
    }

    // Обычное обновление данных без изменения email
    const updatedUser = await prisma.seller.update({
      where: { id: userId },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(phone !== undefined && {
          phone: phone === null ? null : phone.trim(),
        }),
        ...(city !== undefined && { city: city === null ? null : city.trim() }),
        ...(avatar !== undefined && {
          avatar: avatar === null ? null : avatar.trim(),
        }),
      },
    });

    return NextResponse.json({
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        avatar: updatedUser.avatar,
        phone: updatedUser.phone,
        rating: updatedUser.rating,
        city: updatedUser.city,
      },
    });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
