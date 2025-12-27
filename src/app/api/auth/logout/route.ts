import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Создаем response с очисткой cookies
    const response = NextResponse.json({ success: true });

    // Определяем настройки cookies на основе протокола
    const isSecure = request.nextUrl.protocol === 'https:';

    // Удаляем токен из cookies
    response.cookies.set('token', '', {
      httpOnly: true, // Должен соответствовать настройкам при установке
      secure: isSecure,
      sameSite: isSecure ? 'none' : 'lax',
      maxAge: 0, // Устанавливаем maxAge в 0 для удаления
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Ошибка при выходе:', error);
    return NextResponse.json({ error: 'Ошибка при выходе' }, { status: 500 });
  }
}
