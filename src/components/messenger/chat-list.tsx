'use client';

import { useState } from 'react';

interface Chat {
  id: string;
  adTitle: string;
  adPhoto: string;
  adPrice?: string;
  otherUserName: string;
  otherUserAvatar?: string;
  lastMessage: string;
  lastMessageTime: Date | string;
  unreadCount: number;
}

interface ChatListProps {
  chats: Chat[];
  onChatSelect: (chatId: string) => void;
}

export default function ChatList({ chats, onChatSelect }: ChatListProps) {
  const formatTime = (date: Date | string) => {
    const now = new Date();
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const diff = now.getTime() - dateObj.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'только что';
    if (minutes < 60) return `${minutes} мин`;
    if (hours < 24) return `${hours} ч`;
    if (days < 7) return `${days} д`;
    return dateObj.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
    });
  };

  if (chats.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
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
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <p className="text-sm text-gray-500">Нет активных чатов</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      {chats.map((chat) => (
        <div
          key={chat.id}
          onClick={() => onChatSelect(chat.id)}
          className="p-4 rounded-2xl border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center space-x-4">
            {/* Визуализация товара с аватаром */}
            <div className="relative flex-shrink-0">
              {/* Фото товара */}
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100">
                {chat.adPhoto ? (
                  <img
                    src={`https://ik.imagekit.io/motorolla29/molla/mock-photos/${chat.adPhoto}`}
                    alt={chat.adTitle}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <svg
                      className="w-7 h-7 text-gray-400"
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
              <div className="absolute -top-1 -left-1 w-8 h-8 rounded-full border-2 border-white overflow-hidden bg-white">
                {chat.otherUserAvatar ? (
                  <img
                    src={`https://ik.imagekit.io/motorolla29/molla/user-avatars/${chat.otherUserAvatar}`}
                    alt={chat.otherUserName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-violet-500 flex items-center justify-center">
                    <span className="text-white font-medium text-xs">
                      {chat.otherUserName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              {/* Индикатор непрочитанных сообщений - убрал из аватара */}
            </div>

            {/* Информация о чате */}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <div className="relative flex items-start justify-between">
                <h3 className="text-sm font-semibold text-gray-900 truncate">
                  {chat.otherUserName}
                </h3>
                <span className="text-xs text-gray-500 shrink-0">
                  {formatTime(chat.lastMessageTime)}
                </span>
                {/* Индикатор непрочитанных сообщений */}
                {chat.unreadCount > 0 && (
                  <div className="absolute right-0 top-6 bg-amber-500 text-white text-xs rounded-full w-7 h-7 flex items-center justify-center font-medium">
                    {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                  </div>
                )}
              </div>

              <p className="text-xs text-gray-600 truncate mb-1">
                {chat.adTitle}
                {chat.adPrice && <span className="mx-1">·</span>}
                {chat.adPrice && (
                  <span className="text-xs text-gray-900">{chat.adPrice}</span>
                )}
              </p>

              <p
                className={`text-sm truncate ${
                  chat.unreadCount > 0
                    ? 'text-gray-900 font-medium'
                    : 'text-gray-600'
                }`}
              >
                {chat.lastMessage}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
