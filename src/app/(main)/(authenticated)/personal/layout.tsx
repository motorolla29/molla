'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { User, List, ArrowLeft, MessageCircle, Bell, Star } from 'lucide-react';
import { useUnreadMessagesStore } from '@/store/useUnreadMessagesStore';
import { useNotificationsStore } from '@/store/useNotificationsStore';

const primaryNavItems = [
  { href: '/personal/profile', Icon: User, label: 'Профиль' },
  { href: '/personal/notifications', Icon: Bell, label: 'Уведомления' },
  { href: '/personal/messenger', Icon: MessageCircle, label: 'Сообщения' },
];

const secondaryNavItems = [
  { href: '/personal/my-adds', Icon: List, label: 'Мои объявления' },
  { href: '/personal/my-reviews', Icon: Star, label: 'Мои отзывы' },
];

export default function PersonalLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const totalUnreadCount = useUnreadMessagesStore(
    (state) => state.totalUnreadCount,
  );
  const unreadNotifications = useNotificationsStore(
    (state) => state.unreadCount,
  );

  return (
    <div className="min-h-[calc(100svh-95px)] bg-gray-50 flex flex-col">
      {/* Header с кнопкой назад */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 lg:px-6 hidden lg:block">
        <div className="flex items-center">
          <Link
            href="/"
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={20} className="mr-2" />
            <span className="text-sm font-semibold">На главную</span>
          </Link>
        </div>
      </div>

      <div className="flex flex-1 max-w-full">
        {/* Боковая навигация - всегда рендерится, но скрыта на мобильных через CSS */}
        <aside className="min-w-64 bg-white border-r border-gray-200 min-h-[calc(100svh-105px)] lg:block hidden">
          <nav className="p-4">
            <div className="space-y-1">
              {primaryNavItems.map(({ href, Icon, label }) => {
                const isActive = pathname?.startsWith(href) ?? false;
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center px-3 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                      isActive
                        ? 'bg-violet-50 text-violet-700'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <div className="relative mr-3">
                      <Icon
                        size={18}
                        className={`transition-colors ${
                          isActive ? 'text-violet-700' : 'text-gray-400'
                        }`}
                      />
                      {href === '/personal/messenger' &&
                        totalUnreadCount > 0 && (
                          <div className="absolute -top-0.5 -right-0.5 bg-red-500 outline-2 outline-white rounded-full w-2 h-2" />
                        )}
                      {href === '/personal/notifications' &&
                        unreadNotifications > 0 && (
                          <div className="absolute -top-0.5 -right-0.5 bg-red-500 outline-2 outline-white rounded-full w-2 h-2" />
                        )}
                    </div>
                    {label}
                  </Link>
                );
              })}
            </div>

            <div className="my-3 border-t border-gray-200" />

            <div className="space-y-1 mt-1">
              {secondaryNavItems.map(({ href, Icon, label }) => {
                const isActive = pathname?.startsWith(href) ?? false;
                const finalHref =
                  href === '/personal/my-adds'
                    ? '/personal/my-adds/active'
                    : href;

                return (
                  <Link
                    key={href}
                    href={finalHref}
                    className={`flex items-center px-3 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                      isActive
                        ? 'bg-violet-50 text-violet-700'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon
                      size={18}
                      className={`mr-3 transition-colors ${
                        isActive ? 'text-violet-700' : 'text-gray-400'
                      }`}
                    />
                    {label}
                  </Link>
                );
              })}
            </div>
          </nav>
        </aside>

        {/* Основной контент */}
        <main className="flex-1 max-w-full lg:max-w-[calc(100%-16rem)]">
          <div>{children}</div>
        </main>
      </div>
    </div>
  );
}
