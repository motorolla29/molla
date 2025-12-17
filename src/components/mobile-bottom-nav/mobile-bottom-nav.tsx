'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Heart, List, MessageCircle, User } from 'lucide-react';

const navItems = [
  { href: '/', Icon: Home, label: 'Главная' },
  { href: '/favorites', Icon: Heart, label: 'Избранное' },
  { href: '/personal/my-adds', Icon: List, label: 'Объявления' },
  { href: '/chats', Icon: MessageCircle, label: 'Сообщения' },
  { href: '/personal/profile', Icon: User, label: 'Профиль' },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  const nonHomePaths = [
    '/favorites',
    '/personal/my-adds',
    '/chats',
    '/personal/profile',
  ];
  const isHomeActive = pathname === '/' || !nonHomePaths.includes(pathname);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-neutral-100 border-t border-t-neutral-400 lg:hidden z-50 shadow-md h-12"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex h-full">
        {navItems.map(({ href, Icon, label }) => {
          const isActive = href === '/' ? isHomeActive : pathname === href;
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
