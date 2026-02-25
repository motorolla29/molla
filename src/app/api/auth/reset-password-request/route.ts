import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { registrationCache } from '@/lib/redis';
import { sendPasswordResetEmail } from '@/lib/email';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    const normalizedEmail =
      typeof email === 'string' ? email.toLowerCase().trim() : '';

    if (
      !normalizedEmail ||
      !normalizedEmail.match(/^[^@\s]+@[^@\s]+\.[^@\s]+$/)
    ) {
      return NextResponse.json(
        { error: 'Некорректный email адрес' },
        { status: 400 }
      );
    }

    const user = await prisma.seller.findUnique({
      where: { email: normalizedEmail },
      select: { email: true },
    });

    // Не раскрываем, существует ли такой пользователь
    if (!user) {
      return NextResponse.json({
        message:
          'Если такой email зарегистрирован, мы отправили письмо с инструкциями по сбросу пароля',
      });
    }

    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 минут

    await registrationCache.set(
      token,
      {
        type: 'password_reset',
        email: normalizedEmail,
        expiresAt: expiresAt.toISOString(),
      },
      15 * 60
    );

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.CORS_ORIGIN ||
      'http://localhost:3000';

    const resetLink = `${appUrl.replace(/\/+$/, '')}/password-reset/${token}`;

    const emailSent = await sendPasswordResetEmail(normalizedEmail, resetLink);

    if (!emailSent) {
      return NextResponse.json(
        { error: 'Ошибка отправки email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message:
        'Если такой email зарегистрирован, мы отправили письмо с инструкциями по сбросу пароля',
    });
  } catch (error) {
    console.error('Reset password request error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

