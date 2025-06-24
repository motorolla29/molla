'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Heart, List, MessageCircle, User } from 'lucide-react';

const navItems = [
  { href: '/', Icon: Home, label: 'Главная' },
  { href: '/favorites', Icon: Heart, label: 'Избранное' },
  { href: '/ads', Icon: List, label: 'Объявления' },
  { href: '/chats', Icon: MessageCircle, label: 'Сообщения' },
  { href: '/profile', Icon: User, label: 'Профиль' },
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-stone-100 border-t border-t-stone-400 lg:hidden z-50 shadow-md"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex">
        {navItems.map(({ href, Icon, label }) => {
          const isActive =
            href === '/' ? pathname === '/' : pathname.startsWith(href);
          const colorClass = isActive ? 'text-violet-500' : 'text-stone-400';
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 min-w-0 flex flex-col items-center justify-center pt-1 ${colorClass}`}
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
