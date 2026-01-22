'use client';

import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Check, CheckCheck } from 'lucide-react';
import Link from 'next/link';
import MessageInput from './message-input';
import ImageModal from './image-modal';

interface Message {
  id: string;
  content: string;
  senderId: number;
  senderName: string;
  senderAvatar?: string;
  timestamp: Date | string;
  type: 'text' | 'image';
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'error';
  attachments?: Array<{
    id: string;
    fileUrl: string;
    fileName: string;
    fileType: string;
  }>;
}

interface Chat {
  id: string;
  adId: string;
  adTitle: string;
  adPhoto: string;
  adPrice?: string;
  adCity: string;
  adCityLabel: string;
  adCategory: string;
  otherUserName: string;
  otherUserAvatar?: string;
  otherUserId: number;
  lastMessageTime?: Date | string;
}

interface ChatAreaProps {
  chat: Chat | null;
  messages: Message[];
  currentUserId: number;
  onSendMessage: (
    content: string,
    attachments?: File[],
    tempMessageId?: string
  ) => Promise<{ messageId?: string } | void>;
  onTyping?: () => void;
  onStopTyping?: () => void;
  isOtherUserOnline?: boolean;
  otherUserLastSeen?: string | null;
  isTyping?: boolean;
  isLoading?: boolean;
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
  showBackButton = false,
}: ChatAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [localMessages, setLocalMessages] =
    useState<Message[]>(initialMessages);

  // Состояние для модального окна просмотра изображений
  const [selectedImage, setSelectedImage] = useState<{
    url: string;
    alt: string;
  } | null>(null);

  // Состояние для отслеживания положения скролла
  const [isNearBottom, setIsNearBottom] = useState(true);

  // Синхронизируем локальные сообщения с пропсами
  useEffect(() => {
    setLocalMessages(initialMessages);
  }, [initialMessages]);

  // Обработчик скролла для определения положения пользователя
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      // Считаем пользователя "в конце" если он в пределах 100px от конца
      setIsNearBottom(distanceFromBottom < 100);
    };

    container.addEventListener('scroll', handleScroll);
    // Инициализируем состояние
    handleScroll();

    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Умная автопрокрутка - только если пользователь в конце чата
  useEffect(() => {
    if (isNearBottom) {
      const container = messagesContainerRef.current;
      if (container) {
        // Небольшая задержка для учета изменений высоты при загрузке изображений
        setTimeout(() => {
          container.scrollTop = container.scrollHeight;
        }, 50);
      }
    }
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
    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      content: content,
      senderId: currentUserId,
      senderName: 'Вы',
      timestamp: new Date(),
      type: attachments && attachments.length > 0 ? 'image' : 'text',
      status: 'sending',
      attachments: attachments?.map((file, index) => ({
        id: `temp-attachment-${index}`,
        fileUrl: URL.createObjectURL(file),
        fileName: file.name,
        fileType: file.type,
      })),
    };

    setLocalMessages((prev) => [...prev, tempMessage]);
    return tempMessage.id;
  };

  const updateMessageStatus = (
    messageId: string,
    status: Message['status']
  ) => {
    setLocalMessages((prev) =>
      prev.map((msg) => (msg.id === messageId ? { ...msg, status } : msg))
    );
  };

  // Обработчики для модального окна изображений
  const openImageModal = (imageUrl: string, altText: string) => {
    setSelectedImage({ url: imageUrl, alt: altText });
  };

  const closeImageModal = () => {
    setSelectedImage(null);
  };

  const handleSendMessage = async (content: string, attachments?: File[]) => {
    if (!content.trim() && (!attachments || attachments.length === 0)) return;

    // Добавляем сообщение локально
    const tempMessageId = addLocalMessage(content, attachments);

    try {
      // Отправляем на сервер
      const result = await onSendMessage(content, attachments, tempMessageId);

      // Если сервер вернул реальный ID сообщения, обновляем локальное сообщение
      if (result && result.messageId) {
        setLocalMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempMessageId
              ? { ...msg, id: result.messageId!, status: 'sent' as const }
              : msg
          )
        );
      } else {
        // Если ID не вернулся, просто обновляем статус
        updateMessageStatus(tempMessageId, 'sent');
      }
    } catch (error) {
      // При ошибке показываем ошибку
      updateMessageStatus(tempMessageId, 'error');
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="h-[calc(100vh-95px)] lg:h-[calc(100vh-105px)] flex flex-col">
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
              {chat?.adPhoto ? (
                <Link
                  href={`/${chat.adCityLabel}/${chat.adCategory}/${chat.adId}`}
                >
                  <img
                    src={`https://ik.imagekit.io/motorolla29/molla/mock-photos/${chat.adPhoto}?tr=w-80`}
                    alt={chat.adTitle}
                    className="w-full h-full object-cover cursor-pointer transition-opacity"
                  />
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
            <Link href={`/user/${chat?.otherUserId}/active`}>
              <div className="absolute -top-1.5 -left-1.5 w-7 h-7 rounded-full border-2 border-white overflow-hidden bg-white cursor-pointer transition-opacity">
                {chat?.otherUserAvatar ? (
                  <img
                    src={`https://ik.imagekit.io/motorolla29/molla/user-avatars/${chat.otherUserAvatar}`}
                    alt={chat.otherUserName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-violet-500 flex items-center justify-center">
                    <span className="text-white font-semibold text-xs">
                      {chat?.otherUserName.charAt(0).toUpperCase()}
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
                className="flex-1 min-w-0"
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
              {/* <div className="flex items-center gap-2 text-xs text-gray-500 shrink-0">
                <span
                  className={`inline-block w-2.5 h-2.5 rounded-full ${
                    isOtherUserOnline ? 'bg-emerald-500' : 'bg-gray-300'
                  }`}
                  aria-label={isOtherUserOnline ? 'online' : 'offline'}
                />
                <span>
                  {isOtherUserOnline
                    ? 'В сети'
                    : formatLastSeen(otherUserLastSeen)}
                </span>
              </div> */}
            </div>

            <p className="text-xs text-gray-600 truncate">
              {chat?.adTitle || 'Загрузка товара...'}
              {chat?.adPrice && <span className="mx-1">·</span>}
              {chat?.adPrice && (
                <span className="text-xs text-gray-900">{chat.adPrice}</span>
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
        {/* Пустой блок для прижимания сообщений к низу */}
        <div className="flex-1"></div>

        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-sm text-gray-600">Загрузка сообщений...</p>
            </div>
          </div>
        ) : localMessages.length === 0 ? (
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
          localMessages.map((message, index) => {
            const prevMessage = localMessages[index - 1];
            const isFirstInGroup =
              !prevMessage || prevMessage.senderId !== message.senderId;
            const marginTop = isFirstInGroup ? 'mt-4' : 'mt-1';
            return (
              <div
                key={message.id}
                className={`flex ${marginTop} ${
                  message.senderId === currentUserId
                    ? 'justify-end'
                    : 'justify-start'
                }`}
              >
                {/* Аватарка собеседника для входящих сообщений */}
                {message.senderId !== currentUserId && (
                  <div className="shrink-0 mr-2 self-start">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-violet-500 flex items-center justify-center">
                      {chat?.otherUserAvatar ? (
                        <img
                          src={`https://ik.imagekit.io/motorolla29/molla/user-avatars/${chat.otherUserAvatar}?tr=w-32,h-32`}
                          alt={chat.otherUserName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-white font-semibold text-sm">
                          {chat?.otherUserName?.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                )}
                {/* Индикатор статуса для исходящих сообщений - слева от блока */}
                {message.senderId === currentUserId && (
                  <div className="flex items-end justify-start mr-1 mb-1 self-end">
                    {message.status === 'sending' && (
                      <div className="w-3 h-3 border border-violet-500 border-t-transparent rounded-full animate-spin"></div>
                    )}
                    {message.status === 'sent' && (
                      <Check className="w-3 h-3 text-gray-500" />
                    )}
                    {message.status === 'delivered' && (
                      <Check className="w-3 h-3 text-violet-500" />
                    )}
                    {message.status === 'read' && (
                      <CheckCheck className="w-3 h-3 text-violet-500" />
                    )}
                    {message.status === 'error' && (
                      <div className="text-xs text-red-500">⚠</div>
                    )}
                  </div>
                )}

                <div
                  className={`max-w-36 min-[320px]:max-w-48 min-[390px]:max-w-56 min-[480px]:max-w-72 sm:max-w-100 px-3 py-1 rounded-lg relative ${
                    message.senderId === currentUserId
                      ? 'bg-violet-500 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  {/* Фото в сообщении */}
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="mb-2 flex flex-col gap-2">
                      {message.attachments.map((attachment) => (
                        <div key={attachment.id} className="relative">
                          {/* Loading overlay for non-blob URLs */}
                          {!attachment.fileUrl.startsWith('blob:') && message.status === 'sending' && (
                            <div className="absolute inset-0 bg-white bg-opacity-75 rounded-lg flex items-center justify-center z-10">
                              <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                          )}
                          <img
                            src={
                              attachment.fileUrl.startsWith('blob:')
                                ? attachment.fileUrl
                                : `${attachment.fileUrl}?tr=w-300` // Миниатюра для чата
                            }
                            alt={attachment.fileName}
                            className="rounded-lg max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() =>
                              openImageModal(
                                attachment.fileUrl.startsWith('blob:')
                                  ? attachment.fileUrl
                                  : attachment.fileUrl, // Полный размер для модала
                                attachment.fileName
                              )
                            }
                            onLoad={() => {
                              // Smart scroll: only scroll if user is near bottom
                              setTimeout(() => {
                                if (isNearBottom) {
                                  const container = messagesContainerRef.current;
                                  if (container) {
                                    container.scrollTop = container.scrollHeight;
                                  }
                                }
                              }, 100);
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Текст сообщения */}
                  {message.content && (
                    <p className="text-sm whitespace-pre-wrap wrap-break-word">
                      {message.content}
                    </p>
                  )}

                  {/* Время отправки - прижато справа */}
                  <div className="flex justify-end mt-1">
                    <p
                      className={`text-xs ${
                        message.senderId === currentUserId
                          ? 'text-violet-200'
                          : 'text-gray-500'
                      }`}
                    >
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Typing indicator - показывается только если пользователь в конце чата */}
        {isTyping && isNearBottom && (() => {
          // Определяем отступ как для сообщений
          const lastMessage = localMessages[localMessages.length - 1];
          const isFirstInGroup = !lastMessage || lastMessage.senderId !== currentUserId;
          const marginTop = isFirstInGroup ? 'mt-1' : 'mt-4';

          return (
            <div className={`flex justify-start ${marginTop}`}>
            {/* Аватарка собеседника для индикатора печати */}
            <div className="shrink-0 mr-2 self-start">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-violet-500 flex items-center justify-center">
                {chat?.otherUserAvatar ? (
                  <img
                    src={`https://ik.imagekit.io/motorolla29/molla/user-avatars/${chat.otherUserAvatar}?tr=w-32,h-32`}
                    alt={chat.otherUserName}
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
      />
    </div>
  );
}
