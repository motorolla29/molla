import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/jwt';

// Функция для определения нужно ли использовать secure cookies
const shouldUseSecureCookies = (request: NextRequest) => {
  // Использовать secure cookies только для HTTPS соединений
  return request.nextUrl.protocol === 'https:';
};

// Функция для определения sameSite политики
const getSameSitePolicy = (request: NextRequest) => {
  return shouldUseSecureCookies(request) ? 'none' : 'lax';
};

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

  // Проверяем, если пользователь идет на страницу авторизации и уже авторизован
  if (request.nextUrl.pathname === '/auth') {
    const token = request.cookies.get('token')?.value;

    if (token) {
      try {
        // Проверяем валидность токена
        const payload = verifyToken(token);
        if (payload) {
          // Если токен валидный, перенаправляем на главную
          return NextResponse.redirect(new URL('/', request.url));
        } else {
          // Если токен невалидный, удаляем его из cookies
          const response = NextResponse.next();
          response.cookies.set('token', '', {
            httpOnly: true,
            secure: shouldUseSecureCookies(request),
            sameSite: getSameSitePolicy(request),
            maxAge: 0,
            path: '/',
          });
          return response;
        }
      } catch (error) {
        console.error('[MIDDLEWARE] Error verifying token:', error);
        // Если ошибка при проверке токена, удаляем его из cookies
        const response = NextResponse.next();
        response.cookies.set('token', '', {
          httpOnly: true,
          secure: shouldUseSecureCookies(request),
          sameSite: getSameSitePolicy(request),
          maxAge: 0,
          path: '/',
        });
        return response;
      }
    }
  }

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
        // Если токен невалидный, удаляем его из cookies и перенаправляем на авторизацию
        const authUrl = new URL('/auth', request.url);
        authUrl.searchParams.set(
          'redirect',
          request.nextUrl.pathname + request.nextUrl.search
        );
        const response = NextResponse.redirect(authUrl);
        response.cookies.set('token', '', {
          httpOnly: true,
          secure: shouldUseSecureCookies(request),
          sameSite: getSameSitePolicy(request),
          maxAge: 0,
          path: '/',
        });
        return response;
      }
    } catch (error) {
      console.error(
        '[MIDDLEWARE] Error checking token on protected route:',
        error
      );
      // Если ошибка при проверке токена, удаляем его из cookies и перенаправляем на авторизацию
      const authUrl = new URL('/auth', request.url);
      authUrl.searchParams.set(
        'redirect',
        request.nextUrl.pathname + request.nextUrl.search
      );
      const response = NextResponse.redirect(authUrl);
      response.cookies.set('token', '', {
        httpOnly: true,
        secure: shouldUseSecureCookies(request),
        sameSite: getSameSitePolicy(request),
        maxAge: 0,
        path: '/',
      });
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  runtime: 'nodejs', // Required for jsonwebtoken library
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
