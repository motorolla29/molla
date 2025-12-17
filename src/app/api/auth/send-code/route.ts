import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendVerificationCode } from '@/lib/email';
import { registrationCache, connectRedis } from '@/lib/redis';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { email, name, password, city, isRegistration } =
      await request.json();

    // Нормализуем email к нижнему регистру
    const normalizedEmail = email.toLowerCase().trim();

    if (
      !normalizedEmail ||
      !normalizedEmail.match(/^[^@\s]+@[^@\s]+\.[^@\s]+$/)
    ) {
      return NextResponse.json(
        { error: 'Некорректный email адрес' },
        { status: 400 }
      );
    }

    // Генерируем 6-значный код
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 минут

    if (isRegistration) {
      // Регистрация - проверяем, что normalizedEmail не занят
      if (!name || name.trim() === '') {
        return NextResponse.json(
          { error: 'Имя обязательно для регистрации' },
          { status: 400 }
        );
      }

      if (!password || password.length < 6) {
        return NextResponse.json(
          { error: 'Пароль должен содержать минимум 6 символов' },
          { status: 400 }
        );
      }

      const existingUser = await prisma.seller.findUnique({
        where: { email: normalizedEmail },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: 'Пользователь с таким email уже существует' },
          { status: 400 }
        );
      }

      // Хэшируем пароль
      const hashedPassword = await bcrypt.hash(password, 10);

      // Сохраняем данные регистрации в Redis
      await registrationCache.set(
        normalizedEmail,
        {
          name: name.trim(),
          password: hashedPassword,
          city: city || null,
          verificationCode,
          verificationCodeExpires: expiresAt,
        },
        600
      ); // 10 минут
    } else {
      // Вход - проверяем, что пользователь существует
      const user = await prisma.seller.findUnique({
        where: { email: normalizedEmail },
      });

      if (!user) {
        return NextResponse.json(
          { error: 'Пользователь с таким email не найден' },
          { status: 404 }
        );
      }

      // Сохраняем код верификации в Redis для входа
      await registrationCache.set(normalizedEmail, {
        verificationCode,
        verificationCodeExpires: expiresAt.toISOString(),
      });
    }

    // Отправляем normalizedEmail
    const emailSent = await sendVerificationCode(
      normalizedEmail,
      verificationCode
    );

    if (!emailSent) {
      return NextResponse.json(
        { error: 'Ошибка отправки email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Код подтверждения отправлен на ваш email',
    });
  } catch (error) {
    console.error('Send code error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
