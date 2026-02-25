'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MutableRefObject,
} from 'react';
import type { Message } from './message-item';

interface UseChatScrollArgs {
  localMessages: Message[];
  initialMessages: Message[];
  currentUserId: number;
  isLoading: boolean;
  hasMoreMessages: boolean;
  isLoadingMoreMessages: boolean;
  onLoadMoreMessages?: () => Promise<void> | void;
  isTyping: boolean;
}

interface UseChatScrollResult {
  messagesContainerRef: React.RefObject<HTMLDivElement>;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  isNearBottom: boolean;
  isNearBottomRef: MutableRefObject<boolean>;
}

export function useChatScroll({
  localMessages,
  initialMessages,
  currentUserId,
  isLoading,
  hasMoreMessages,
  isLoadingMoreMessages,
  onLoadMoreMessages,
  isTyping,
}: UseChatScrollArgs): UseChatScrollResult {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Состояние для отслеживания положения скролла
  const [isNearBottom, setIsNearBottom] = useState(true);
  const isNearBottomRef = useRef(isNearBottom);
  const isLoadingMoreLocalRef = useRef(false);

  // Защита от множественных загрузок с помощью RAF и debounce
  const scrollRafRef = useRef<number | null>(null);
  const loadMoreTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const prevMessagesLengthRef = useRef(initialMessages.length);
  const prevLastMessageIdRef = useRef<string | null>(
    initialMessages[initialMessages.length - 1]?.id ?? null,
  );

  // Синхронизируем ref с состоянием
  useEffect(() => {
    isNearBottomRef.current = isNearBottom;
  }, [isNearBottom]);

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
    const isLastFromOtherUser =
      lastMessage && lastMessage.senderId !== currentUserId;

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
    // либо длина увеличилась, либо изменился id последнего сообщения
    // (например, temp-id локального сообщения заменился на серверный id)
    // Скроллим, если:
    // - пользователь реально находится внизу (isNearBottom), ИЛИ
    // - последнее сообщение отправлено текущим пользователем
    //   (в этом случае мы всегда хотим показать ему его же отправку,
    //    даже если он был чуть выше).
    else if (
      (currentLength > prevLength || currentLastId !== prevLastId) &&
      currentLastId &&
      (isNearBottom || isLastFromCurrentUser)
    ) {
      const container = messagesContainerRef.current;
      if (container) {
        const lastMessageElement = container.querySelector<HTMLElement>(
          `[data-message-id="${currentLastId}"]`,
        );

        if (lastMessageElement) {
          const scrollOnce = () => {
            lastMessageElement.scrollIntoView({
              block: 'end',
            });
          };

          scrollOnce();
          setTimeout(scrollOnce, 100);
          setTimeout(scrollOnce, 300);
        }
      }
    }

    // Обновляем данные для следующего сравнения
    prevMessagesLengthRef.current = currentLength;
    prevLastMessageIdRef.current = currentLastId;
  }, [localMessages, isNearBottom, currentUserId]);

  // Прокрутка при появлении индикатора печати:
  // если пользователь уже внизу (isNearBottom === true),
  // дотягиваем скролл к низу, чтобы индикатор и новые сообщения
  // оказывались в зоне видимости. Если пользователь читает историю
  // (isNearBottom === false), вообще не трогаем скролл.
  useEffect(() => {
    if (!isTyping || !isNearBottom) return;

    const container = messagesContainerRef.current;
    if (!container) return;

    const scrollToBottom = () => {
      container.scrollTop = container.scrollHeight;
    };

    // Небольшая задержка, чтобы индикатор успел отрендериться.
    setTimeout(scrollToBottom, 50);
  }, [isTyping, isNearBottom]);

  return {
    messagesContainerRef,
    messagesEndRef,
    isNearBottom,
    isNearBottomRef,
  };
}
