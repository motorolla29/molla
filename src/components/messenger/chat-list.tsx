'use client';

import { useChatPresenceStore } from '@/store/useChatPresenceStore';
import { useEffect, useRef, useState } from 'react';
import {
  ChatListItem,
  type ChatListItemModel,
} from '@/components/messenger/chat-list-item';

interface ChatListProps {
  chats: ChatListItemModel[];
  onChatSelect: (chatId: string) => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMoreChats?: () => Promise<void> | void;
  onHideChat?: (chatId: string) => void;
  onToggleBlock?: (chat: ChatListItemModel) => void;
}

export default function ChatList({
  chats,
  onChatSelect,
  hasMore = false,
  isLoadingMore = false,
  onLoadMoreChats,
  onHideChat,
  onToggleBlock,
}: ChatListProps) {
  // Real-time presence from Socket.IO
  const { onlineUserIds } = useChatPresenceStore();
  const typingMap = useChatPresenceStore((state) => state.typing);

  const chatListRef = useRef<HTMLDivElement>(null);
  const loadMoreTriggerRef = useRef<HTMLDivElement>(null);
  const [openMenuChatId, setOpenMenuChatId] = useState<string | null>(null);
  const longPressTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef(false);
  const lastMenuOpenFromLongPressRef = useRef<{
    chatId: string;
    ts: number;
  } | null>(null);

  // API-based presence (commented out for now)
  // const { fetchUsersStatuses, getUserStatus } = useOnlineUsersStore();

  // Real-time presence from Socket.IO - no need for API polling

  // Подгрузка чатов при скроле
  useEffect(() => {
    const trigger = loadMoreTriggerRef.current;
    if (!trigger || !onLoadMoreChats) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && hasMore && !isLoadingMore) {
          onLoadMoreChats();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(trigger);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, isLoadingMore, onLoadMoreChats]);

  // API-based presence polling (commented out for now)
  // Загружаем статусы пользователей при монтировании и обновляем каждые 5 минут
  // useEffect(() => {
  //   const userIds = chats.map(chat => chat.otherUserId);
  //   if (userIds.length > 0) {
  //     fetchUsersStatuses(userIds);
  //   }
  //
  //   // Обновляем статусы каждые 30 сек
  //   const interval = setInterval(() => {
  //     if (userIds.length > 0) {
  //       fetchUsersStatuses(userIds);
  //     }
  //   }, 30000);
  //
  //   return () => clearInterval(interval);
  // }, [chats, fetchUsersStatuses]);

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

  const isUserTyping = (chatId: string, otherUserId: number | null) => {
    if (otherUserId == null) return false;
    const typingForChat = typingMap[chatId]?.[otherUserId];
    const isTyping = !!typingForChat && Date.now() - typingForChat < 3000;
    return isTyping;
  };

  const handleCardPointerDown = (chatId: string) => {
    isLongPressRef.current = false;
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
    }
    longPressTimeoutRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      setOpenMenuChatId(chatId);
      lastMenuOpenFromLongPressRef.current = {
        chatId,
        ts: Date.now(),
      };
    }, 500);
  };

  const handleCardPointerUp = (chatId: string) => {
    // Если открыт попап
    if (openMenuChatId) {
      // Если это отпускание после long-press — просто сбрасываем флаг,
      // не закрывая попап и не навигируя
      if (isLongPressRef.current) {
        isLongPressRef.current = false;
        if (longPressTimeoutRef.current) {
          clearTimeout(longPressTimeoutRef.current);
          longPressTimeoutRef.current = null;
        }
        return;
      }

      // Если попап открыт и это обычный тап по карточке,
      // сначала закрываем попап без навигации
      setOpenMenuChatId(null);
      if (longPressTimeoutRef.current) {
        clearTimeout(longPressTimeoutRef.current);
        longPressTimeoutRef.current = null;
      }
      return;
    }

    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
    if (!isLongPressRef.current) {
      onChatSelect(chatId);
    }
    isLongPressRef.current = false;
  };

  const handleCardPointerLeave = () => {
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
    isLongPressRef.current = false;
  };

  const handleMenuActionClick = (chatId: string, action: () => void) => {
    const info = lastMenuOpenFromLongPressRef.current;
    if (info && info.chatId === chatId) {
      const dt = Date.now() - info.ts;
      // Игнорируем первый "случайный" клик сразу после long-press (например, отпускание пальца)
      if (dt < 300) {
        lastMenuOpenFromLongPressRef.current = null;
        return;
      }
      // После первого осознанного нажатия очищаем флаг
      lastMenuOpenFromLongPressRef.current = null;
    }
    action();
  };

  // Глобальное закрытие попапа по клику вне области списка чатов
  useEffect(() => {
    if (!openMenuChatId) return;

    const handleGlobalPointerDown = (event: PointerEvent) => {
      const root = chatListRef.current;
      if (root && !root.contains(event.target as Node)) {
        setOpenMenuChatId(null);
      }
    };

    window.addEventListener('pointerdown', handleGlobalPointerDown);
    return () => {
      window.removeEventListener('pointerdown', handleGlobalPointerDown);
    };
  }, [openMenuChatId]);

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
    <div ref={chatListRef} className="flex-1 max-w-full custom-scrollbar">
      {chats.map((chat) => (
        <ChatListItem
          key={chat.id}
          chat={chat}
          isOtherUserOnline={
            chat.otherUserId != null && onlineUserIds.has(chat.otherUserId)
          }
          isTyping={isUserTyping(chat.id, chat.otherUserId)}
          formatTime={formatTime}
          isMenuOpen={openMenuChatId === chat.id}
          showMenu={!!onHideChat && !!onToggleBlock}
          onToggleMenu={() =>
            setOpenMenuChatId(openMenuChatId === chat.id ? null : chat.id)
          }
          onHideChat={onHideChat}
          onToggleBlock={onToggleBlock}
          onMenuActionClick={handleMenuActionClick}
          onPointerDown={() => handleCardPointerDown(chat.id)}
          onPointerUp={() => handleCardPointerUp(chat.id)}
          onPointerLeave={handleCardPointerLeave}
        />
      ))}

      {/* Триггер для подгрузки */}
      {hasMore && (
        <div ref={loadMoreTriggerRef} className="flex justify-center py-4">
          {isLoadingMore ? (
            <div className="flex justify-center">
              <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="h-5 w-full"></div> // Невидимый триггер
          )}
        </div>
      )}
    </div>
  );
}
