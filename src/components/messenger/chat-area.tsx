'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useMemo } from 'react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import MessageInput from './message-input';
import ImageModal from './image-modal';
import MessageItem from './message-item';
import type { Message, Chat } from './message-item';
import { getAvatarColor } from '@/utils';

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
  isScrollLocked?: boolean;
  hasMoreMessages?: boolean;
  isLoadingMoreMessages?: boolean;
  onLoadMoreMessages?: () => Promise<void> | void;
  showBackButton?: boolean;
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
  isScrollLocked = false,
  hasMoreMessages = false,
  isLoadingMoreMessages = false,
  onLoadMoreMessages,
  showBackButton = false,
}: ChatAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [localMessages, setLocalMessages] =
    useState<Message[]>(initialMessages);

  const isSameDay = (d1: Date, d2: Date) => {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  // Мемоизируем обработанные сообщения для предотвращения лишних вычислений
  const processedMessages = useMemo(() => {
    return localMessages.map((message, index) => {
      const prevMessage = localMessages[index - 1];
      const currentDate =
        typeof message.timestamp === 'string'
          ? new Date(message.timestamp)
          : message.timestamp;
      const prevDate: Date | null = prevMessage
        ? typeof prevMessage.timestamp === 'string'
          ? new Date(prevMessage.timestamp)
          : prevMessage.timestamp
        : null;

      // Не показываем divider для первого сообщения, если есть еще сообщения для подгрузки
      const shouldShowDateDivider =
        (!prevDate || !isSameDay(currentDate, prevDate)) &&
        !(index === 0 && hasMoreMessages);

      return {
        message,
        showDateDivider: shouldShowDateDivider,
        isFirstInGroup:
          prevMessage && prevMessage.senderId !== message.senderId,
      };
    });
  }, [localMessages, hasMoreMessages]);
  const prevMessagesLengthRef = useRef(initialMessages.length);
  const prevLastMessageIdRef = useRef<string | null>(
    initialMessages[initialMessages.length - 1]?.id ?? null,
  );

  // Состояние для модального окна просмотра изображений
  const [selectedImage, setSelectedImage] = useState<{
    url: string;
    alt: string;
  } | null>(null);

  // Состояние для отслеживания положения скролла
  const [isNearBottom, setIsNearBottom] = useState(true);
  const isNearBottomRef = useRef(isNearBottom);
  const isLoadingMoreLocalRef = useRef(false);

  // Защита от множественных загрузок с помощью RAF и debounce
  const scrollRafRef = useRef<number | null>(null);
  const loadMoreTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Синхронизируем ref с состоянием
  useEffect(() => {
    isNearBottomRef.current = isNearBottom;
  }, [isNearBottom]);

  // Синхронизируем локальные сообщения с пропсами
  useEffect(() => {
    setLocalMessages(initialMessages);

    // Скроллим вниз после загрузки сообщений для компенсации загрузки изображений
    const scrollToBottom = () => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop =
          messagesContainerRef.current.scrollHeight;
      }
    };

    setTimeout(scrollToBottom, 200);
    setTimeout(scrollToBottom, 400);
  }, [initialMessages]);

  // Оптимизированный обработчик скролла с debounce для предотвращения множественных загрузок
  const handleScroll = useCallback(() => {
    // Отменяем предыдущий RAF если он был
    if (scrollRafRef.current) {
      cancelAnimationFrame(scrollRafRef.current);
    }

    // Используем RAF для оптимизации производительности
    scrollRafRef.current = requestAnimationFrame(() => {
      const container = messagesContainerRef.current;
      if (!container) return;

      const { scrollTop, scrollHeight, clientHeight } = container;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      const newIsNearBottom = distanceFromBottom < 100;

      // Обновляем только если состояние изменилось
      setIsNearBottom((prev) => {
        if (prev !== newIsNearBottom) {
          return newIsNearBottom;
        }
        return prev;
      });

      // Проверяем условия для подгрузки с debounce
      const shouldLoadMore =
        scrollTop <= 50 &&
        !isLoading &&
        hasMoreMessages &&
        !isLoadingMoreMessages &&
        onLoadMoreMessages &&
        !isLoadingMoreLocalRef.current;

      if (shouldLoadMore) {
        // Очищаем предыдущий таймаут если был
        if (loadMoreTimeoutRef.current) {
          clearTimeout(loadMoreTimeoutRef.current);
        }

        // Debounce: ждем 300мс пока скролл остановится
        loadMoreTimeoutRef.current = setTimeout(() => {
          // Повторная проверка условий после debounce
          const currentContainer = messagesContainerRef.current;
          if (!currentContainer || isLoadingMoreLocalRef.current) return;

          const currentScrollTop = currentContainer.scrollTop;
          if (currentScrollTop > 50) return; // Проверяем что все еще у верха

          // Очищаем таймаут так как начинаем загрузку
          if (loadMoreTimeoutRef.current) {
            clearTimeout(loadMoreTimeoutRef.current);
            loadMoreTimeoutRef.current = null;
          }

          isLoadingMoreLocalRef.current = true;

          // Сохраняем текущую позицию скролла и высоту перед подгрузкой
          const prevScrollTop = currentScrollTop;
          const prevScrollHeight = currentContainer.scrollHeight;

          Promise.resolve(onLoadMoreMessages()).finally(() => {
            // После подгрузки восстанавливаем позицию скролла относительно нижнего края
            const restoreScrollPosition = () => {
              const updatedContainer = messagesContainerRef.current;
              if (!updatedContainer) {
                isLoadingMoreLocalRef.current = false;
                return;
              }

              const newScrollHeight = updatedContainer.scrollHeight;
              const heightIncrease = newScrollHeight - prevScrollHeight;

              // Новая позиция скролла: старая позиция + прирост высоты
              const newScrollTop = prevScrollTop + heightIncrease;

              // Проверяем разумность позиции
              if (
                newScrollTop >= 0 &&
                newScrollTop <= newScrollHeight - updatedContainer.clientHeight
              ) {
                updatedContainer.scrollTop = newScrollTop;
              }

              isLoadingMoreLocalRef.current = false;
            };

            // Даем время на обновление DOM
            requestAnimationFrame(() => {
              restoreScrollPosition();
              setTimeout(restoreScrollPosition, 100);
            });
          });
        }, 150); // 150ms debounce
      }
    });
  }, [hasMoreMessages, isLoadingMoreMessages, onLoadMoreMessages, isLoading]);

  // Обработчик скролла для определения положения пользователя
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    // Используем passive listener для лучшей производительности
    container.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      container.removeEventListener('scroll', handleScroll);
      // Очищаем таймауты и RAF при размонтировании
      if (scrollRafRef.current) {
        cancelAnimationFrame(scrollRafRef.current);
      }
      if (loadMoreTimeoutRef.current) {
        clearTimeout(loadMoreTimeoutRef.current);
      }
    };
  }, [handleScroll]);

  // Умная автопрокрутка:
  // - при добавлении новых сообщений ВНИЗ (append) скроллим вниз,
  //   но только если пользователь уже внизу или сообщение от текущего пользователя;
  // - при подгрузке старых сообщений ВВЕРХ (prepend) позицию НЕ меняем.
  useEffect(() => {
    const currentLength = localMessages.length;
    const currentLastId = localMessages[localMessages.length - 1]?.id ?? null;

    const lastMessage = localMessages[localMessages.length - 1];
    const isLastFromCurrentUser =
      lastMessage && lastMessage.senderId === currentUserId;

    const prevLength = prevMessagesLengthRef.current;
    const prevLastId = prevLastMessageIdRef.current;

    // 1) Инициализация: с 0 до N сообщений — всегда скроллим вниз
    if (prevLength === 0 && currentLength > 0) {
      const container = messagesContainerRef.current;
      if (container) {
        // Небольшая задержка для учета изменений высоты при загрузке изображений
        setTimeout(() => {
          container.scrollTop = container.scrollHeight;
        }, 50);
      }
    }
    // 2) Добавление новых сообщений в конец (append):
    // длина увеличилась и изменился id последнего сообщения
    else if (
      currentLength > prevLength &&
      currentLastId &&
      currentLastId !== prevLastId &&
      (isNearBottom || isLastFromCurrentUser)
    ) {
      const container = messagesContainerRef.current;
      if (container) {
        setTimeout(() => {
          container.scrollTop = container.scrollHeight;
        }, 50);
      }
    }

    // Обновляем данные для следующего сравнения
    prevMessagesLengthRef.current = currentLength;
    prevLastMessageIdRef.current = currentLastId;
  }, [localMessages, isNearBottom]);

  // Прокрутка при появлении индикатора печати
  useEffect(() => {
    if (isTyping && isNearBottom) {
      const container = messagesContainerRef.current;
      if (container) {
        // Прокручиваем вниз при появлении индикатора печати
        setTimeout(() => {
          container.scrollTop = container.scrollHeight;
        }, 50);
      }
    }
  }, [isTyping, isNearBottom]);

  const formatTime = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatLastSeen = (value?: string | null) => {
    if (!value) return 'был(а) в сети давно';
    const date = new Date(value);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    if (diffMinutes < 1) return 'был(а) только что';
    if (diffMinutes < 60) return `был(а) ${diffMinutes} мин назад`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `был(а) ${diffHours} ч назад`;
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const addLocalMessage = (content: string, attachments?: File[]) => {
    const stableId = `stable-${Date.now()}-${Math.random()}`;
    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      stableId: stableId,
      content: content,
      senderId: currentUserId,
      senderName: 'Вы',
      timestamp: new Date(),
      type: attachments && attachments.length > 0 ? 'image' : 'text',
      status: 'sending',
      attachments: attachments?.map((file, index) => ({
        id: `temp-attachment-${index}`,
        fileUrl: URL.createObjectURL(file),
        blobUrl: URL.createObjectURL(file),
        fileName: file.name,
        fileType: file.type,
      })),
    };

    setLocalMessages((prev) => [...prev, tempMessage]);
    return { id: tempMessage.id, attachments: tempMessage.attachments };
  };

  const updateMessageStatus = (
    messageId: string,
    status: Message['status'],
  ) => {
    setLocalMessages((prev) =>
      prev.map((msg) => (msg.id === messageId ? { ...msg, status } : msg)),
    );
  };

  // Обработчики для модального окна изображений
  const openImageModal = useCallback((imageUrl: string, altText: string) => {
    setSelectedImage({ url: imageUrl, alt: altText });
  }, []);

  const closeImageModal = () => {
    setSelectedImage(null);
  };

  const handleSendMessage = async (content: string, attachments?: File[]) => {
    if (!content.trim() && (!attachments || attachments.length === 0)) return;

    // Добавляем сообщение локально
    const { id: tempMessageId, attachments: localAttachments } =
      addLocalMessage(content, attachments);

    try {
      // Отправляем на сервер
      const result = await onSendMessage(
        content,
        attachments,
        tempMessageId,
        localAttachments,
      );

      // Все обновления происходят через socket события (message_saved, message_delivered)
      // Не делаем локальных обновлений, чтобы избежать конфликтов
      // Для текстовых сообщений обновление происходит через socket message_saved
    } catch (error) {
      // При ошибке показываем ошибку
      updateMessageStatus(tempMessageId, 'error');
      console.error('Error sending message:', error);
    }
  };

  return (
    <div
      className="h-[calc(100dvh-95px)] lg:h-[calc(100dvh-105px)] flex flex-col"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className=" bg-white p-4 border-b border-gray-200 shrink-0 sticky top-12 z-1 sm:static">
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
                <Link
                  href={`/${chat.adCityLabel}/${chat.adCategory}/${chat.adId}`}
                  target="blank"
                >
                  {chat.adPhoto ? (
                    <img
                      src={`https://ik.imagekit.io/motorolla29/molla/mock-photos/${chat.adPhoto}?tr=w-60`}
                      alt={chat.adTitle}
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
                  <img
                    src={`${chat.otherUserAvatar}?tr=w-40`}
                    alt={chat.otherUserName}
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
                      {formatLastSeen(otherUserLastSeen)}
                    </span>
                  )}
                </div>
              </Link>
            </div>

            <p className="text-xs text-gray-600 truncate">
              {chat?.adTitle || 'Загрузка товара...'}
              {chat?.adPrice && <span className="mx-1">·</span>}
              {chat?.adPrice && (
                <span className="text-xs text-gray-900">{chat?.adPrice}</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Область сообщений - растянута на всё оставшееся место */}
      <div
        ref={messagesContainerRef}
        data-messages-container
        className="flex-1 overflow-y-auto p-4 pb-6 min-h-0 custom-scrollbar-chat flex flex-col"
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
        ) : !isLoading && initialMessages.length === 0 ? (
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
                      <img
                        src={`${chat.otherUserAvatar}?tr=w-40`}
                        alt={chat?.otherUserName}
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

        {/* Реф для прокрутки */}
        <div ref={messagesEndRef} />
      </div>

      {/* Поле ввода сообщения - фиксированная высота внизу */}
      <div className="bg-gray-50 shrink-0">
        <MessageInput
          onSendMessage={handleSendMessage}
          disabled={isLoading}
          onTyping={onTyping}
          onStopTyping={onStopTyping}
        />
      </div>

      {/* Модальное окно для просмотра изображений */}
      <ImageModal
        isOpen={!!selectedImage}
        onClose={closeImageModal}
        imageUrl={selectedImage?.url || ''}
        altText={selectedImage?.alt || ''}
        scrollAlreadyLocked={isScrollLocked}
      />
    </div>
  );
}
