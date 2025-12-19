'use client';

import { ReactNode, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { User, List, ArrowLeft } from 'lucide-react';

const navItems = [
  { href: '/personal/profile', Icon: User, label: 'Профиль' },
  { href: '/personal/my-adds', Icon: List, label: 'Мои объявления' },
];

export default function PersonalLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header с кнопкой назад */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 lg:px-6">
        <div className="flex items-center">
          <Link
            href="/"
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={20} className="mr-2" />
            <span className="text-sm font-medium">На главную</span>
          </Link>
        </div>
      </div>

      <div className="flex">
        {/* Боковая навигация - скрыта на мобильных */}
        {!isMobile && (
          <aside className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-73px)]">
            <nav className="p-4">
              <div className="space-y-1">
                {navItems.map(({ href, Icon, label }) => {
                  const isActive = pathname === href;
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={`flex items-center px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-violet-50 text-violet-700'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
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
        )}

        {/* Основной контент */}
        <main className="flex-1">
          <div className="p-4 lg:p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
