'use client';

import { useCallback } from 'react';
import { ChatHeader } from './chat-header';
import MessageInput from './message-input';
import MessageItem from './message-item';
import type { Message, Chat as BaseChat } from './message-item';
import { useChatMessages } from './use-chat-messages';
import { useChatScroll } from './use-chat-scroll';
import { getAvatarColor } from '@/utils';
import { CloudImage } from '@/components/cloud-image/cloud-image';
import { Ban } from 'lucide-react';

type Chat = BaseChat & {
  isBlockedByMe?: boolean;
  isBlockedMe?: boolean;
};

interface ChatAreaProps {
  chat: Chat | null;
  messages: Message[];
  currentUserId: number;
  onSendMessage: (
    content: string,
    attachments?: File[],
    tempMessageId?: string,
    localAttachments?: any[],
  ) => Promise<{ messageId?: string; message?: any } | void>;
  onTyping?: () => void;
  onStopTyping?: () => void;
  isOtherUserOnline?: boolean;
  otherUserLastSeen?: string | null;
  isTyping?: boolean;
  isLoading?: boolean;
  hasMoreMessages?: boolean;
  isLoadingMoreMessages?: boolean;
  onLoadMoreMessages?: () => Promise<void> | void;
  showBackButton?: boolean;
  onImageModalOpen?: (imageUrl: string, altText: string) => void;
  initialScrollBehavior?: 'bottom' | 'none';
}

export default function ChatArea({
  chat,
  messages: initialMessages,
  currentUserId,
  onSendMessage,
  onTyping,
  onStopTyping,
  isOtherUserOnline = false,
  otherUserLastSeen,
  isTyping = false,
  isLoading = false,
  hasMoreMessages = false,
  isLoadingMoreMessages = false,
  onLoadMoreMessages,
  showBackButton = false,
  onImageModalOpen,
  initialScrollBehavior = 'bottom',
}: ChatAreaProps) {
  const {
    localMessages,
    processedMessages,
    addLocalMessage,
    updateMessageStatus,
    markLocalMessageAttachmentsError,
  } = useChatMessages(initialMessages, currentUserId, hasMoreMessages);

  const {
    messagesContainerRef,
    messagesEndRef,
    isNearBottom,
    isNearBottomRef,
  } = useChatScroll({
    localMessages,
    initialMessages,
    currentUserId,
    isLoading,
    hasMoreMessages,
    isLoadingMoreMessages,
    onLoadMoreMessages,
    isTyping,
    initialScrollBehavior,
  });

  const formatLastSeen = (value?: string | null) => {
    if (!value) return 'был(а) в сети давно';
    const date = new Date(value);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffYears = Math.floor(diffDays / 365);

    // Если прошло более года
    if (diffYears >= 1) return 'был(а) давно';

    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    if (diffMinutes < 1) return 'был(а) только что';
    if (diffMinutes < 60) return `был(а) ${diffMinutes} мин назад`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `был(а) ${diffHours} ч назад`;

    // Если прошло больше суток, но менее года - показываем дату и время
    return `был(а) ${date.toLocaleString('ru-RU', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  };

  // Обработчики для модального окна изображений
  const openImageModal = useCallback(
    (imageUrl: string, altText: string) => {
      if (onImageModalOpen) {
        onImageModalOpen(imageUrl, altText);
      }
    },
    [onImageModalOpen],
  );

  const isInputHidden =
    !chat ||
    isLoading ||
    chat.isBlockedByMe ||
    chat.isBlockedMe ||
    chat.otherUserId == null;

  const handleSendMessage = async (content: string, attachments?: File[]) => {
    if (!content.trim() && (!attachments || attachments.length === 0)) return;

    // Добавляем сообщение локально
    const { id: tempMessageId, attachments: localAttachments } =
      addLocalMessage(content, attachments);

    try {
      // Отправляем на сервер / через сокет (реализация в page.tsx),
      // дальше всё обновляется через socket события.
      await onSendMessage(
        content,
        attachments,
        tempMessageId,
        localAttachments,
      );
    } catch (error) {
      // При ошибке помечаем сообщение и вложения как ошибочные —
      // текст/фото остаются на месте, но пользователь видит "Ошибка отправки".
      updateMessageStatus(tempMessageId, 'error');
      markLocalMessageAttachmentsError(tempMessageId);
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="fixed inset-0 top-12 flex flex-col bg-white lg:static lg:bg-transparent lg:top-auto lg:h-[calc(100dvh-105px)]">
      <ChatHeader
        chat={chat}
        showBackButton={showBackButton}
        isOtherUserOnline={isOtherUserOnline}
        otherUserLastSeen={otherUserLastSeen}
        isLoading={isLoading}
        formatLastSeen={formatLastSeen}
      />

      {/* Область сообщений - растянута на всё оставшееся место */}
      <div
        ref={messagesContainerRef}
        data-messages-container
        className={`flex-1 overflow-y-auto p-4 ${isInputHidden ? 'pb-0 mb-12' : ''}  lg:mb-0 min-h-0 custom-scrollbar-chat flex flex-col`}
      >
        {/* Индикатор подгрузки более старых сообщений */}
        {hasMoreMessages && (
          <div className="flex justify-center mb-8 mt-2">
            {isLoadingMoreMessages ? (
              <div className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <div className="w-4 h-4" /> // Плейсхолдер для сохранения высоты
            )}
          </div>
        )}

        {/* Пустой блок для прижимания сообщений к низу */}
        <div className="flex-1"></div>

        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-sm text-gray-600">Загрузка сообщений...</p>
            </div>
          </div>
        ) : !isLoading &&
          initialMessages.length === 0 &&
          localMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
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
              <p className="text-sm text-gray-500">Начните разговор</p>
            </div>
          </div>
        ) : (
          processedMessages.map(
            ({ message, showDateDivider, isFirstInGroup }) => (
              <MessageItem
                key={`message-${message.stableId}`}
                message={message}
                showDateDivider={showDateDivider}
                isFirstInGroup={isFirstInGroup}
                chat={chat}
                currentUserId={currentUserId}
                messagesContainerRef={messagesContainerRef}
                openImageModal={openImageModal}
                isNearBottomRef={isNearBottomRef}
              />
            ),
          )
        )}

        {/* Typing indicator - показывается только если пользователь в конце чата */}
        {isTyping &&
          isNearBottom &&
          (() => {
            // Определяем отступ как для сообщений
            const lastMessage = localMessages[localMessages.length - 1];
            const isFirstInGroup =
              !lastMessage || lastMessage.senderId !== currentUserId;
            const marginTop = isFirstInGroup ? 'mt-1' : 'mt-4';

            return (
              <div className={`flex justify-start ${marginTop}`}>
                {/* Аватарка собеседника для индикатора печати */}
                <div className="shrink-0 mr-2 self-start">
                  <div
                    className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center"
                    style={{
                      backgroundColor: chat?.otherUserAvatar
                        ? 'transparent'
                        : chat?.otherUserId
                          ? getAvatarColor(chat.otherUserId)
                          : 'rgba(209, 213, 219, 0.2)',
                    }}
                  >
                    {chat?.otherUserAvatar ? (
                      <CloudImage
                        src={chat.otherUserAvatar}
                        variant="xs"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-semibold text-sm">
                        {chat?.otherUserName?.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-2xl">
                  <span className="flex items-center gap-1">
                    <span className="inline-block w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.2s]" />
                    <span className="inline-block w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.1s]" />
                    <span className="inline-block w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
                  </span>
                </div>
              </div>
            );
          })()}

        {/* В конце чата: инфо о блокировке / удалённом профиле */}
        {!isLoading &&
          chat &&
          (chat.isBlockedByMe ||
            chat.isBlockedMe ||
            chat.otherUserId == null) && (
            <div className="w-full flex justify-center my-6">
              <div className="max-w-[520px] w-full px-4">
                <div className="w-full rounded-2xl border border-red-100 bg-red-50 px-4 py-3 flex items-start gap-3">
                  <div className="mt-0.5">
                    <Ban className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
                  </div>
                  <div className="text-xs sm:text-sm text-red-700 leading-snug">
                    {chat.otherUserId == null
                      ? 'Профиль вашего собеседника удалён. Ему больше нельзя написать сообщение.'
                      : chat.isBlockedByMe
                        ? 'Вы заблокировали этого пользователя. Чтобы снова написать, разблокируйте его в списке чатов.'
                        : 'Вы не можете отправлять сообщения, так как пользователь заблокировал вас.'}
                  </div>
                </div>
              </div>
            </div>
          )}

        {/* Реф для прокрутки */}
        <div ref={messagesEndRef} />
      </div>

      {/* Поле ввода сообщения внизу показываем только когда чат загружен,
          нет блокировки и профиль собеседника не удалён */}
      {!chat ||
      isLoading ||
      chat.isBlockedByMe ||
      chat.isBlockedMe ||
      chat.otherUserId == null ? null : (
        <div className="bg-gray-50 shrink-0 mb-12 lg:mb-0">
          <MessageInput
            onSendMessage={handleSendMessage}
            disabled={isLoading}
            onTyping={onTyping}
            onStopTyping={onStopTyping}
          />
        </div>
      )}
    </div>
  );
}
