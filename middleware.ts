import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './src/lib/jwt';

export function middleware(request: NextRequest) {
  // Защищенные маршруты
  const protectedRoutes = [
    '/personal/my-adds',
    '/personal/profile',
    '/ad/create',
  ];

  const isProtectedRoute = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  if (isProtectedRoute) {
    // Получаем токен из cookies
    const token = request.cookies.get('token')?.value;

    if (!token) {
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
        // Если токен невалидный, перенаправляем на авторизацию
        const authUrl = new URL('/auth', request.url);
        authUrl.searchParams.set(
          'redirect',
          request.nextUrl.pathname + request.nextUrl.search
        );
        return NextResponse.redirect(authUrl);
      }
      // #region agent log
      fetch(
        'http://127.0.0.1:7242/ingest/b6bcc12e-b6f4-497b-834e-142385050765',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            location: 'middleware.ts:51',
            message: 'Valid token, allowing access',
            data: { route: request.nextUrl.pathname, userId: payload.userId },
            timestamp: Date.now(),
            sessionId: 'debug-session',
            runId: 'run1',
            hypothesisId: 'A',
          }),
        }
      ).catch(() => {});
      // #endregion
    } catch (error) {
      // #region agent log
      fetch(
        'http://127.0.0.1:7242/ingest/b6bcc12e-b6f4-497b-834e-142385050765',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            location: 'middleware.ts:54',
            message: 'Token verification error, redirecting to auth',
            data: { route: request.nextUrl.pathname, error: String(error) },
            timestamp: Date.now(),
            sessionId: 'debug-session',
            runId: 'run1',
            hypothesisId: 'A',
          }),
        }
      ).catch(() => {});
      // #endregion
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
