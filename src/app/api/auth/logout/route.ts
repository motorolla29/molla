import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // Создаем response с очисткой cookies
    const response = NextResponse.json({ success: true });

    // Удаляем токен из cookies
    response.cookies.set('token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // Устанавливаем maxAge в 0 для удаления
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Ошибка при выходе:', error);
    return NextResponse.json({ error: 'Ошибка при выходе' }, { status: 500 });
  }
}
