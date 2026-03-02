'use client';

import { memo, Fragment, useState, useCallback } from 'react';
import { Check, CheckCheck, User } from 'lucide-react';
import { FaUser } from 'react-icons/fa6';
import { getAvatarColor } from '@/utils';
import { CloudImage } from '@/components/cloud-image/cloud-image';

export interface Message {
  id: string;
  stableId: string; // Стабильный ID для предотвращения перерисовки
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
    blobUrl: string;
    fileName: string;
    fileType: string;
    isError?: boolean;
    isLoading?: boolean; // Для отслеживания загрузки серверного изображения
  }>;
}

export interface Chat {
  id: string;
  adId: string;
  adTitle: string;
  adPhoto: string;
  adPrice?: string;
  adCity: string;
  adCityLabel: string;
  adCategory: string;
  isAdDeleted?: boolean;
  otherUserName: string;
  otherUserAvatar?: string;
  otherUserId: number | null;
  lastMessageTime?: Date | string;
  isBlockedByMe?: boolean;
  isBlockedMe?: boolean;
}

export interface MessageItemProps {
  message: Message;
  showDateDivider: boolean;
  isFirstInGroup: boolean;
  chat: Chat | null;
  currentUserId: number;
  messagesContainerRef: React.RefObject<HTMLDivElement>;
  openImageModal: (imageUrl: string, altText: string) => void;
  isNearBottomRef: React.MutableRefObject<boolean>;
}

const MessageItem = memo(
  ({
    message,
    showDateDivider,
    isFirstInGroup,
    chat,
    currentUserId,
    messagesContainerRef,
    openImageModal,
    isNearBottomRef,
  }: MessageItemProps) => {
    // Локальное состояние для отслеживания загрузки изображений этого сообщения
    const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>(
      {},
    );

    // Функция для обновления состояния загрузки изображения
    const updateLoadedImage = useCallback(
      (attachmentId: string, loaded: boolean) => {
        setLoadedImages((prev) => ({
          ...prev,
          [attachmentId]: loaded,
        }));
      },
      [],
    );

    const currentDate =
      typeof message.timestamp === 'string'
        ? new Date(message.timestamp)
        : message.timestamp;

    const formatTime = (date: Date | string) => {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return dateObj.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    const isSameDay = (d1: Date, d2: Date) => {
      return (
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate()
      );
    };

    const formatDateDivider = (date: Date) => {
      const now = new Date();
      const isToday = isSameDay(date, now);

      if (isToday) return 'Сегодня';

      const base = date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
      });

      if (date.getFullYear() === now.getFullYear()) {
        // Например: "22 января"
        return base;
      }

      // Например: "22 января 2022 г."
      return `${base} ${date.getFullYear()} г.`;
    };

    const marginTop = isFirstInGroup ? 'mt-4' : 'mt-1';

    return (
      <Fragment key={`message-${message.stableId}`}>
        {showDateDivider && (
          <div className="flex justify-center mb-4 my-8">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-gray-200 text-xs text-gray-700">
              {formatDateDivider(currentDate)}
            </div>
          </div>
        )}

        <div
          data-message-id={message.id}
          className={`flex ${marginTop} ${
            message.senderId === currentUserId ? 'justify-end' : 'justify-start'
          }`}
        >
          {/* Аватарка собеседника для входящих сообщений */}
          {message.senderId !== currentUserId && (
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
                    alt={chat?.otherUserName}
                    className="w-full h-full object-cover"
                  />
                ) : chat && chat.otherUserId == null ? (
                  <FaUser className="w-3 h-3 text-gray-400" />
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
            className={`max-w-36 min-[320px]:max-w-48 min-[390px]:max-w-56 ${message.attachments && message.attachments.length > 0 ? 'sm:max-w-[350px]' : 'sm:max-w-120'} px-3 py-1 rounded-lg relative ${
              message.senderId === currentUserId
                ? 'bg-violet-500 text-white'
                : 'bg-gray-100 text-gray-900'
            }`}
          >
            {/* Фото в сообщении */}
            {message.attachments && message.attachments.length > 0 && (
              <div className="mb-2 flex flex-col gap-2">
                {message.attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="relative aspect-square max-w-full w-36 min-[320px]:w-48 min-[390px]:w-56 sm:w-[350px] bg-gray-300/25 rounded-lg overflow-hidden"
                  >
                    {/*
                      Фейд-ин делаем только для исходящих "локальных" вложений (blob),
                      чтобы не залипать в opacity-0 после перезагрузки/загрузки с сервера.
                    */}
                    {(() => {
                      const isOutgoing = message.senderId === currentUserId;
                      const isLocalBlob =
                        attachment.fileUrl.startsWith('blob:') ||
                        !!attachment.blobUrl;
                      const shouldFadeIn = isOutgoing && isLocalBlob;
                      const opacityClass = shouldFadeIn
                        ? loadedImages[attachment.id]
                          ? 'opacity-100'
                          : 'opacity-0'
                        : 'opacity-100';

                      if (
                        attachment.fileUrl.startsWith('blob:') ||
                        (isOutgoing && attachment.blobUrl)
                      ) {
                        return (
                          <img
                            src={
                              isOutgoing && attachment.blobUrl
                                ? attachment.blobUrl
                                : attachment.fileUrl
                            }
                            alt={attachment.fileName}
                            className={`w-full h-full object-cover cursor-pointer transition-opacity duration-150 ${opacityClass}`}
                            onClick={() =>
                              openImageModal(
                                isOutgoing &&
                                  attachment.blobUrl &&
                                  loadedImages[attachment.id]
                                  ? attachment.blobUrl
                                  : attachment.fileUrl,
                                attachment.fileName,
                              )
                            }
                            onLoad={() => {
                              updateLoadedImage(attachment.id, true);
                            }}
                          />
                        );
                      }

                      return (
                        <CloudImage
                          src={attachment.fileUrl}
                          variant="md"
                          alt={attachment.fileName}
                          className={`w-full h-full object-cover cursor-pointer transition-opacity duration-150 ${opacityClass}`}
                          onClick={() =>
                            openImageModal(
                              attachment.fileUrl,
                              attachment.fileName,
                            )
                          }
                          onLoad={() => {
                            updateLoadedImage(attachment.id, true);
                          }}
                        />
                      );
                    })()}
                    {message.senderId === currentUserId &&
                      attachment.blobUrl &&
                      attachment.isError && (
                        <div className="absolute inset-0 bg-red-500/50 rounded-lg flex items-center justify-center">
                          <span className="text-xs sm:text-sm font-semibold text-white">
                            Ошибка отправки
                          </span>
                        </div>
                      )}
                    {message.senderId === currentUserId &&
                      attachment.blobUrl &&
                      !attachment.isError &&
                      (!loadedImages[attachment.id] ||
                        attachment.fileUrl.startsWith('blob:')) && (
                        <div className="absolute inset-0 bg-white/25 rounded-lg flex items-center justify-center">
                          <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      )}
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
      </Fragment>
    );
  },
);

MessageItem.displayName = 'MessageItem';

export default MessageItem;
