'use client';

import { useState, useRef, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import MessageInput from './message-input';
import ImageModal from './image-modal';

interface Message {
  id: string;
  content: string;
  senderId: number;
  senderName: string;
  senderAvatar?: string;
  timestamp: Date;
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
  isLoading?: boolean;
  showBackButton?: boolean;
}

export default function ChatArea({
  chat,
  messages: initialMessages,
  currentUserId,
  onSendMessage,
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

  // Синхронизируем локальные сообщения с пропсами
  useEffect(() => {
    setLocalMessages(initialMessages);
  }, [initialMessages]);

  // Автопрокрутка к последнему сообщению без таймаутов
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      // Используем scrollTop вместо scrollIntoView для изоляции от скролла страницы
      container.scrollTop = container.scrollHeight;
    }
  }, [localMessages]);

  const formatTime = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleTimeString('ru-RU', {
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
    <div className="max-h-[calc(100vh-95px)] lg:max-h-[calc(100vh-105px)] flex flex-col">
      <div className="bg-white p-4 border-b border-gray-200 shrink-0 sticky top-12 z-1 sm:static">
        <div className="flex items-center space-x-4">
          {/* Кнопка назад */}
          {showBackButton && (
            <Link
              href="/personal/messenger"
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors flex-shrink-0"
            >
              <ArrowLeft size={20} />
            </Link>
          )}

          {/* Визуализация товара с аватаром */}
          <div className="relative flex-shrink-0">
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
                    <span className="text-white font-medium text-xs">
                      {chat?.otherUserName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            </Link>
          </div>

          {/* Информация о чате */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Link href={`/user/${chat?.otherUserId}/active`}>
                <h3 className="text-sm font-semibold text-gray-900 truncate cursor-pointer hover:opacity-90 transition-colors">
                  {chat?.otherUserName || 'Загрузка...'}
                </h3>
              </Link>
              <span className="text-xs text-gray-400 flex-shrink-0">
                в сети в 16:09
              </span>
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
        className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 custom-scrollbar-chat"
      >
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
          localMessages.map((message) => (
            <div
              key={message.id}
              className={`flex mb-1 ${
                message.senderId === currentUserId
                  ? 'justify-end'
                  : 'justify-start'
              }`}
            >
              {/* Индикатор статуса для исходящих сообщений - слева от блока */}
              {message.senderId === currentUserId && (
                <div className="flex items-end justify-start mr-1 mb-1">
                  {message.status === 'sending' && (
                    <div className="w-3 h-3 border border-violet-500 border-t-transparent rounded-full animate-spin"></div>
                  )}
                  {message.status === 'sent' && (
                    <div className="text-xs text-violet-500">✓</div>
                  )}
                  {message.status === 'delivered' && (
                    <div className="text-xs text-violet-500">✓✓</div>
                  )}
                  {message.status === 'read' && (
                    <div className="text-xs text-violet-500">✓✓</div>
                  )}
                  {message.status === 'error' && (
                    <div className="text-xs text-red-500">⚠</div>
                  )}
                </div>
              )}

              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg relative ${
                  message.senderId === currentUserId
                    ? 'bg-violet-500 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                {/* Фото в сообщении */}
                {message.attachments && message.attachments.length > 0 && (
                  <div className="mb-2">
                    {message.attachments.map((attachment) => (
                      <img
                        key={attachment.id}
                        src={
                          attachment.fileUrl.startsWith('blob:')
                            ? attachment.fileUrl
                            : attachment.fileUrl // Теперь полный URL из ImageKit
                        }
                        alt={attachment.fileName}
                        className="rounded-lg max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() =>
                          openImageModal(
                            attachment.fileUrl.startsWith('blob:')
                              ? attachment.fileUrl
                              : attachment.fileUrl,
                            attachment.fileName
                          )
                        }
                      />
                    ))}
                  </div>
                )}

                {/* Текст сообщения */}
                {message.content && (
                  <p className="text-sm whitespace-pre-wrap break-words">
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
          ))
        )}

        {/* Реф для прокрутки */}
        <div ref={messagesEndRef} />
      </div>

      {/* Поле ввода сообщения - фиксированная высота внизу */}
      <div className="bg-gray-50 shrink-0">
        <MessageInput onSendMessage={handleSendMessage} disabled={isLoading} />
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
