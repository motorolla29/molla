'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Home, Heart, List, MessageCircle, User } from 'lucide-react';

const navItems = [
  { href: '/', Icon: Home, label: 'Главная', id: 'home' },
  { href: '/favorites', Icon: Heart, label: 'Избранное', id: 'favorites' },
  { href: '/personal/my-adds', Icon: List, label: 'Объявления', id: 'ads' },
  { href: '/chats', Icon: MessageCircle, label: 'Сообщения', id: 'chats' },
  { href: '/personal/profile', Icon: User, label: 'Профиль', id: 'profile' },
];

const NAV_CONTEXT_KEY = 'mobile-nav-context';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const [navContext, setNavContext] = useState<string | null>(null);

  // Загружаем сохраненный контекст при монтировании
  useEffect(() => {
    const saved = sessionStorage.getItem(NAV_CONTEXT_KEY);
    if (saved) {
      setNavContext(saved);
    }
  }, []);

  // Сохраняем контекст при переходе на специальные страницы
  useEffect(() => {
    if (pathname === '/') {
      setNavContext('home');
      sessionStorage.setItem(NAV_CONTEXT_KEY, 'home');
    } else if (pathname.startsWith('/favorites')) {
      setNavContext('favorites');
      sessionStorage.setItem(NAV_CONTEXT_KEY, 'favorites');
    } else if (pathname.startsWith('/personal/my-adds')) {
      setNavContext('ads');
      sessionStorage.setItem(NAV_CONTEXT_KEY, 'ads');
    } else if (pathname.startsWith('/chats')) {
      setNavContext('chats');
      sessionStorage.setItem(NAV_CONTEXT_KEY, 'chats');
    } else if (pathname.startsWith('/personal/profile')) {
      setNavContext('profile');
      sessionStorage.setItem(NAV_CONTEXT_KEY, 'profile');
    }
  }, [pathname]);

  const specialPaths = [
    '/favorites',
    '/personal/my-adds',
    '/chats',
    '/personal/profile',
  ];
  const isHomeActive =
    pathname === '/' ||
    (!specialPaths.some((p) => pathname.startsWith(p)) &&
      navContext === 'home');

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-neutral-100 border-t border-t-neutral-400 lg:hidden z-50 shadow-md h-12"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingRight: 'var(--scrollbar-compensation, 0px)',
      }}
    >
      <div className="flex h-full">
        {navItems.map(({ href, Icon, label, id }) => {
          let isActive = false;

          if (href === '/' && isHomeActive) {
            isActive = true;
          } else if (specialPaths.includes(href) && pathname.startsWith(href)) {
            isActive = true;
          } else if (pathname === href) {
            isActive = true;
          } else if (
            !specialPaths.some((p) => pathname.startsWith(p)) &&
            navContext === id
          ) {
            // Для страниц товаров показываем активной иконку в зависимости от контекста
            isActive = true;
          }
          const colorClass = isActive ? 'text-violet-500' : 'text-neutral-400';
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 min-w-0 flex flex-col items-center justify-center mt-1 ${colorClass}`}
            >
              <Icon size={18} className={colorClass} />
              {/* Показываем подпись только на ширине >=640px, иначе скрываем */}
              <span
                className={`text-[10px] mb-1 mt-0.5 truncate ${colorClass}`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
