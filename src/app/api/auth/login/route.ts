import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateToken } from '@/lib/jwt';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

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
      maxAge: 86400, // 24 часа
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
