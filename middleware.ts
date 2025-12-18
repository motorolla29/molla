import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './src/lib/jwt';

export function middleware(request: NextRequest) {
  // Защищенные маршруты
  const protectedRoutes = ['/personal/my-adds', '/personal/profile'];

  const isProtectedRoute = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  if (isProtectedRoute) {
    // Получаем токен из cookies
    const token = request.cookies.get('token')?.value;
    console.log(
      'Middleware: checking route',
      request.nextUrl.pathname,
      'has token:',
      !!token
    );

    if (!token) {
      console.log('Middleware: no token, redirecting to auth');
      // Если токена нет, перенаправляем на авторизацию с сохранением URL
      const authUrl = new URL('/auth', request.url);
      authUrl.searchParams.set(
        'redirect',
        request.nextUrl.pathname + request.nextUrl.search
      );
      return NextResponse.redirect(authUrl);
    }

    try {
      // Проверяем валидность токена
      const payload = verifyToken(token);
      if (!payload) {
        console.log('Middleware: invalid token, redirecting to auth');
        // Если токен невалидный, перенаправляем на авторизацию
        const authUrl = new URL('/auth', request.url);
        authUrl.searchParams.set(
          'redirect',
          request.nextUrl.pathname + request.nextUrl.search
        );
        return NextResponse.redirect(authUrl);
      }
      console.log('Middleware: valid token, allowing access');
    } catch (error) {
      console.log('Middleware: token error, redirecting to auth');
      // Если ошибка при проверке токена, перенаправляем на авторизацию
      const authUrl = new URL('/auth', request.url);
      authUrl.searchParams.set(
        'redirect',
        request.nextUrl.pathname + request.nextUrl.search
      );
      return NextResponse.redirect(authUrl);
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
