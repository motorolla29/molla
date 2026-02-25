'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { CloudImage } from '@/components/cloud-image/cloud-image';
import { getAvatarColor } from '@/utils';
import type { Chat } from './message-item';

interface ChatHeaderProps {
  chat: Chat | null;
  showBackButton?: boolean;
  isOtherUserOnline?: boolean;
  otherUserLastSeen?: string | null;
  isLoading?: boolean;
  formatLastSeen: (value?: string | null) => string;
}

export function ChatHeader({
  chat,
  showBackButton = false,
  isOtherUserOnline = false,
  otherUserLastSeen,
  isLoading = false,
  formatLastSeen,
}: ChatHeaderProps) {
  return (
    <div className=" bg-white p-4 border-b border-gray-200 shrink-0 sticky top-12 z-1 lg:static">
      <div className="flex items-center space-x-4">
        {/* Кнопка назад */}
        {showBackButton && (
          <Link
            href="/personal/messenger"
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors shrink-0"
          >
            <ArrowLeft size={20} />
          </Link>
        )}

        {/* Визуализация товара с аватаром */}
        <div className="relative shrink-0">
          {/* Фото товара */}
          <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100">
            {chat ? (
              chat.isAdDeleted ? (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center opacity-50">
                  <svg
                    className="w-6 h-6 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              ) : (
                <Link
                  href={`/${chat.adCityLabel}/${chat.adCategory}/${chat.adId}`}
                  target="blank"
                >
                  {chat.adPhoto ? (
                    <CloudImage
                      src={`ad-photos/${chat.adPhoto}`}
                      variant="sm"
                      className="w-full h-full object-cover cursor-pointer transition-opacity"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  )}
                </Link>
              )
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            )}
          </div>

          {/* Аватар собеседника в левом верхнем углу */}
          <Link href={`/user/${chat?.otherUserId}/active`} target="blank">
            <div className="absolute -top-1.5 -left-1.5 w-7 h-7 rounded-full border-2 border-white overflow-hidden bg-white cursor-pointer transition-opacity">
              {chat?.otherUserAvatar ? (
                <CloudImage
                  src={chat.otherUserAvatar}
                  variant="xs"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{
                    backgroundColor: chat?.otherUserId
                      ? getAvatarColor(chat.otherUserId)
                      : 'rgba(209, 213, 219, 0.2)',
                  }}
                >
                  <span className="text-white font-semibold text-xs">
                    {chat?.otherUserName?.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </Link>
        </div>

        {/* Информация о чате */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <Link
              href={`/user/${chat?.otherUserId}/active`}
              className="flex-1 min-w-0 max-w-fit"
            >
              <div className="flex items-center gap-2 min-w-0">
                <h3 className="text-sm font-semibold text-gray-900 truncate cursor-pointer hover:opacity-90 transition-colors">
                  {chat?.otherUserName || 'Загрузка...'}
                </h3>
                {/* Онлайн индикатор возле имени */}
                {isOtherUserOnline ? (
                  <div className="shrink-0 w-2 h-2 bg-emerald-500 rounded-full" />
                ) : (
                  <span className="items-center gap-2 text-xs text-gray-500 shrink-0 hidden sm:flex">
                    {!isLoading &&
                      otherUserLastSeen &&
                      formatLastSeen(otherUserLastSeen)}
                  </span>
                )}
              </div>
            </Link>
          </div>

          <p className="text-xs text-gray-600 truncate">
            {chat?.isAdDeleted ? (
              <span className="text-gray-500 italic">Объявление удалено</span>
            ) : (
              <>
                {chat?.adTitle || 'Загрузка товара...'}
                {chat?.adPrice && <span className="mx-1">·</span>}
                {chat?.adPrice && (
                  <span className="text-xs text-gray-900">
                    {chat?.adPrice}
                  </span>
                )}
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

