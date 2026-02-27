'use client';

import { CloudImage } from '@/components/cloud-image/cloud-image';
import { useConfirmationModal } from '@/components/confirmation-modal/confirmation-modal-context';
import { getAvatarColor } from '@/utils';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Ban,
  Check,
  CheckCheck,
  MoreVertical,
  Trash2,
  UserCheck,
} from 'lucide-react';

export type ChatListItemModel = {
  id: string;
  adTitle: string;
  adPhoto: string;
  adPrice?: string;
  isAdDeleted?: boolean;
  otherUserId: number;
  otherUserName: string;
  otherUserAvatar?: string;
  otherUserLastSeenAt?: string | null;
  lastMessage: string;
  lastMessageTime: Date | string;
  lastMessageStatus?: string | null;
  lastMessageIsOutgoing?: boolean;
  unreadCount: number;
  isBlockedByMe?: boolean;
  isBlockedMe?: boolean;
};

export interface ChatListItemProps {
  chat: ChatListItemModel;
  isOtherUserOnline: boolean;
  isTyping: boolean;
  formatTime: (date: Date | string) => string;
  isMenuOpen: boolean;
  showMenu: boolean;
  onToggleMenu: () => void;
  onHideChat?: (chatId: string) => void;
  onToggleBlock?: (chat: ChatListItemModel) => void;
  onPointerDown: () => void;
  onPointerUp: () => void;
  onPointerLeave: () => void;
}

export function ChatListItem({
  chat,
  isOtherUserOnline,
  isTyping,
  formatTime,
  isMenuOpen,
  showMenu,
  onToggleMenu,
  onHideChat,
  onToggleBlock,
  onPointerDown,
  onPointerUp,
  onPointerLeave,
}: ChatListItemProps) {
  const { confirm } = useConfirmationModal();

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerLeave}
      className="group relative px-1 py-2.5 min-[500px]:p-4 rounded-2xl border-gray-100 cursor-pointer active:bg-gray-100 min-[500px]:hover:bg-gray-100 transition-colors select-none"
    >
      <div className="flex max-w-full items-center space-x-4">
        {/* Визуализация товара с аватаром */}
        <div className="relative shrink-0">
          {/* Фото товара */}
          <div className="w-18 h-18 rounded-xl overflow-hidden bg-gray-100">
            {chat.adPhoto ? (
              <CloudImage
                src={`ad-photos/${chat.adPhoto}`}
                variant="sm"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-gray-400"
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
          <div className="absolute -top-1.5 -left-1.5 w-9 h-9 rounded-full border-2 border-white overflow-hidden bg-white">
            {chat.otherUserAvatar ? (
              <CloudImage
                src={chat.otherUserAvatar}
                variant="xs"
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{
                  backgroundColor: getAvatarColor(chat.otherUserId),
                }}
              >
                <span className="text-white font-semibold text-xs">
                  {chat.otherUserName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Информация о чате */}
        <div className="flex-1 min-w-0 max-w-full flex flex-col justify-center">
          <div className="flex items-start justify-between">
            <div className="flex items-center min-w-0">
              <h3 className="text-sm font-semibold text-gray-900 truncate">
                {chat.otherUserName}
              </h3>
              {isOtherUserOnline && (
                <div className="shrink-0 w-2 h-2 mx-2 bg-emerald-500 rounded-full" />
              )}
            </div>

            <div className="relative flex items-center shrink-0">
              {/* Статус последнего сообщения (если исходящее) */}
              {chat.lastMessageIsOutgoing && chat.lastMessageStatus && (
                <div className="flex items-center ml-2">
                  {chat.lastMessageStatus === 'sending' && (
                    <div className="w-3 h-3 border border-violet-500 border-t-transparent rounded-full animate-spin" />
                  )}
                  {chat.lastMessageStatus === 'sent' && (
                    <Check className="w-3 h-3 text-gray-500" />
                  )}
                  {chat.lastMessageStatus === 'delivered' && (
                    <Check className="w-3 h-3 text-violet-500" />
                  )}
                  {chat.lastMessageStatus === 'read' && (
                    <CheckCheck className="w-3 h-3 text-violet-500" />
                  )}
                  {chat.lastMessageStatus === 'error' && (
                    <div className="text-xs text-red-500">⚠</div>
                  )}
                </div>
              )}

              <span className="text-xs ml-1 text-gray-500 transition-all duration-150 sm:group-hover:mr-12">
                {formatTime(chat.lastMessageTime)}
              </span>

              {/* Кнопка меню (три точки) только на десктопе */}
              {showMenu && (
                <>
                  <button
                    type="button"
                    className="hidden sm:inline-flex items-center justify-center w-9 h-9 rounded-full text-gray-500 hover:text-gray-600 bg-neutral-200 hover:bg-neutral-300 opacity-0 sm:group-hover:opacity-100 transition-opacity duration-150 absolute right-0 top-1/2 -translate-y-1/2"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleMenu();
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                    onPointerUp={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="w-[18px] h-[18px]" />
                  </button>

                  {/* Попап меню действий по чату (привязан к кнопке) */}
                  <AnimatePresence>
                    {isMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: -6 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -4 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        className="absolute right-0 top-full mt-1 sm:mt-3 z-30 w-44 sm:w-52 min-w-fit whitespace-nowrap bg-white border border-gray-200 rounded-lg shadow-lg"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="py-1">
                          <button
                            type="button"
                            className="w-full px-3 sm:px-4 py-2 text-left text-xs sm:text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            onClick={() => {
                              onToggleMenu();
                              onToggleBlock?.(chat);
                            }}
                          >
                            {chat.isBlockedByMe ? (
                              <UserCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500" />
                            ) : (
                              <Ban className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500" />
                            )}
                            <span>
                              {chat.isBlockedByMe
                                ? 'Разблокировать пользователя'
                                : 'Заблокировать пользователя'}
                            </span>
                          </button>

                          <button
                            type="button"
                            className="w-full px-3 sm:px-4 py-2 text-left text-xs sm:text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                            onClick={() => {
                              if (!onHideChat) return;
                              confirm(
                                'Вы уверены, что хотите удалить этот чат? История останется у собеседника, но у вас появятся только новые сообщения.',
                                () => {
                                  onHideChat(chat.id);
                                },
                                {
                                  title: 'Удалить чат',
                                  icon: Trash2,
                                  iconBgColor: 'bg-red-100',
                                  iconColor: 'text-red-500',
                                },
                              );
                              onToggleMenu();
                            }}
                          >
                            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            <span>Удалить чат</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </div>

            {/* Индикатор непрочитанных сообщений */}
            {chat.unreadCount > 0 && (
              <div className="absolute right-0 top-6 bg-amber-500 text-white text-xs rounded-full w-7 h-7 flex items-center justify-center font-semibold">
                {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
              </div>
            )}
          </div>

          <p className="mr-8 text-xs text-gray-600 truncate mb-1">
            {chat.isAdDeleted ? (
              <span className="text-gray-500 italic">Объявление удалено</span>
            ) : (
              <>
                {chat.adTitle}
                {chat.adPrice && <span className="mx-1">·</span>}
                {chat.adPrice && (
                  <span className="text-xs text-gray-900">{chat.adPrice}</span>
                )}
              </>
            )}
          </p>

          <div
            className={`mr-8 max-w-fit py-1 px-2 rounded-xl text-sm truncate ${
              chat.unreadCount > 0
                ? 'bg-stone-200 text-gray-700 font-semibold'
                : 'bg-stone-200/40 text-gray-600'
            } ${isTyping ? 'bg-transparent' : ''}`}
          >
            {isTyping ? (
              <div>
                <div className="inline-block align-baseline">
                  <span className="inline-block w-1.5 h-1.5 bg-violet-500 rounded-full animate-bounce [animation-delay:-0.2s]" />
                  <span className="inline-block w-1.5 h-1.5 bg-violet-500 rounded-full animate-bounce [animation-delay:-0.1s] ml-0.5" />
                  <span className="inline-block w-1.5 h-1.5 bg-violet-500 rounded-full animate-bounce ml-0.5" />
                </div>
                <span className="inline-block ml-1 align-baseline font-semibold text-violet-500">
                  Печатает...
                </span>
              </div>
            ) : (
              chat.lastMessage
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
