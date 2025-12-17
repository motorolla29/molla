import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './src/lib/jwt';

export function middleware(request: NextRequest) {
  // Защищенные маршруты (только personal страницы)
  const protectedRoutes = ['/personal/my-adds', '/personal/profile'];

  const isProtectedRoute = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  if (isProtectedRoute) {
    // Получаем токен из cookies (предполагаем, что он там есть)
    const token = request.cookies.get('token')?.value;

    if (!token) {
      // Если токена нет, перенаправляем на страницу авторизации
      return NextResponse.redirect(new URL('/auth', request.url));
    }

    try {
      // Проверяем валидность токена
      const payload = verifyToken(token);
      if (!payload) {
        // Если токен невалидный, перенаправляем на авторизацию
        return NextResponse.redirect(new URL('/auth', request.url));
      }
    } catch (error) {
      // Если произошла ошибка при проверке токена, перенаправляем на авторизацию
      return NextResponse.redirect(new URL('/auth', request.url));
    }
  }

  // Публичные маршруты, которые не должны быть доступны авторизованным пользователям
  const authRoutes = ['/auth'];
  const isAuthRoute = authRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  if (isAuthRoute) {
    // Проверяем, авторизован ли пользователь
    const token = request.cookies.get('token')?.value;

    if (token) {
      try {
        const payload = verifyToken(token);
        if (payload) {
          // Если пользователь авторизован, перенаправляем на главную
          return NextResponse.redirect(new URL('/', request.url));
        }
      } catch (error) {
        // Токен невалидный, продолжаем на страницу авторизации
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
