'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Message } from './message-item';

interface UseChatMessagesResult {
  localMessages: Message[];
  processedMessages: {
    message: Message;
    showDateDivider: boolean;
    isFirstInGroup: boolean;
  }[];
  addLocalMessage: (content: string, attachments?: File[]) => {
    id: string;
    attachments?: Message['attachments'];
  };
  updateMessageStatus: (messageId: string, status: Message['status']) => void;
  markLocalMessageAttachmentsError: (messageId: string) => void;
}

export function useChatMessages(
  initialMessages: Message[],
  currentUserId: number,
  hasMoreMessages: boolean,
): UseChatMessagesResult {
  const [localMessages, setLocalMessages] =
    useState<Message[]>(initialMessages);

  // Синхронизируем локальные сообщения с пропсами
  useEffect(() => {
    // Мерджим серверные сообщения с локальными,
    // но добавляем только локальные сообщения с ошибкой (status === 'error'),
    // чтобы не дублировать успешно отправленные сообщения.
    setLocalMessages((prev) => {
      const byId = new Map<string, Message>();

      // Сначала кладём серверные сообщения (они считаются источником истины)
      for (const msg of initialMessages) {
        byId.set(msg.id, msg);
      }

      // Затем добавляем локальные, которых нет на сервере и которые в статусе error
      for (const msg of prev) {
        if (!byId.has(msg.id) && msg.status === 'error') {
          byId.set(msg.id, msg);
        }
      }

      const merged = Array.from(byId.values());

      // Сортируем по времени отправки по возрастанию,
      // чтобы локальные сообщения с ошибкой оставались на своей хронологической позиции.
      merged.sort((a, b) => {
        const ta =
          typeof a.timestamp === 'string'
            ? new Date(a.timestamp).getTime()
            : a.timestamp.getTime();
        const tb =
          typeof b.timestamp === 'string'
            ? new Date(b.timestamp).getTime()
            : b.timestamp.getTime();
        return ta - tb;
      });

      return merged;
    });
  }, [initialMessages]);

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
          !!prevMessage && prevMessage.senderId !== message.senderId,
      };
    });
  }, [localMessages, hasMoreMessages]);

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

  const markLocalMessageAttachmentsError = (messageId: string) => {
    setLocalMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId && msg.attachments
          ? {
              ...msg,
              attachments: msg.attachments.map((att) => ({
                ...att,
                isError: true,
              })),
            }
          : msg,
      ),
    );
  };

  const updateMessageStatus = (
    messageId: string,
    status: Message['status'],
  ) => {
    setLocalMessages((prev) =>
      prev.map((msg) => (msg.id === messageId ? { ...msg, status } : msg)),
    );
  };

  return {
    localMessages,
    processedMessages,
    addLocalMessage,
    updateMessageStatus,
    markLocalMessageAttachmentsError,
  };
}

