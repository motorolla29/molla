import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';
import { sendVerificationCode } from '@/lib/email';
import { registrationCache } from '@/lib/redis';

export async function POST(request: NextRequest) {
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

    const { newEmail } = await request.json();

    // Улучшенная валидация email с поддержкой международных доменов
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!newEmail || !emailRegex.test(newEmail)) {
      return NextResponse.json(
        { error: 'Некорректный email адрес' },
        { status: 400 }
      );
    }

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

    // Проверяем, что новый email не совпадает со старым
    if (newEmail === currentUser.email) {
      return NextResponse.json(
        { error: 'Новый email должен отличаться от текущего' },
        { status: 400 }
      );
    }

    // Проверяем, что email не занят другим пользователем
    const existingUser = await prisma.seller.findUnique({
      where: { email: newEmail },
    });

    if (existingUser && existingUser.id !== userId) {
      return NextResponse.json(
        { error: 'Этот email уже используется другим пользователем' },
        { status: 400 }
      );
    }

    // Генерируем 6-значный код
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 минут

    // Сохраняем данные в Redis с ключом, содержащим старый email
    await registrationCache.set(
      `email_change_${currentUser.email}`,
      {
        newEmail,
        verificationCode,
        verificationCodeExpires: expiresAt.toISOString(),
      },
      600
    ); // 10 минут

    // Отправляем email
    const emailSent = await sendVerificationCode(newEmail, verificationCode);

    if (!emailSent) {
      return NextResponse.json(
        { error: 'Ошибка отправки email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Код подтверждения отправлен на новый email адрес',
    });
  } catch (error) {
    console.error('Send email change code error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
