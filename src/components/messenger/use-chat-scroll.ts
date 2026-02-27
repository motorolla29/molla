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
  initialMessages: Message[]; // оставляем для совместимости, но в логике не используем
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

  // Для отслеживания изменений списка сообщений
  const prevMessagesLengthRef = useRef(0);
  const prevLastMessageIdRef = useRef<string | null>(null);
  const hasDoneInitialScrollRef = useRef(false);

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

  // Автопрокрутка:
  // - при первой загрузке сообщений для чата — в самый низ;
  // - при добавлении новых сообщений в конец (append) — в самый низ,
  //   но только если пользователь уже внизу или сообщение от текущего пользователя;
  // - при подгрузке старых сообщений вверх (prepend) позицию не трогаем.

  // 1) Первая загрузка сообщений для чата — всегда один раз скроллим в самый низ
  useEffect(() => {
    if (hasDoneInitialScrollRef.current) return;
    if (isLoading) return;
    if (localMessages.length === 0) return;

    const container = messagesContainerRef.current;
    if (!container) return;

    const scrollToBottom = () => {
      container.scrollTop = container.scrollHeight;
    };

    scrollToBottom();
    setTimeout(scrollToBottom, 50);
    setTimeout(scrollToBottom, 150);

    hasDoneInitialScrollRef.current = true;
  }, [isLoading, localMessages.length]);

  // 2) Дальнейшая автопрокрутка при приходе новых сообщений (append)
  useEffect(() => {
    const currentLength = localMessages.length;
    const currentLastId = localMessages[localMessages.length - 1]?.id ?? null;

    const prevLength = prevMessagesLengthRef.current;
    const prevLastId = prevLastMessageIdRef.current;

    // Добавление новых сообщений в конец (append): определяем по смене id последнего сообщения.
    // (например, temp-id локального сообщения заменился на серверный id)
    // Скроллим, если:
    // - пользователь реально находится внизу (isNearBottom), ИЛИ
    // - последнее сообщение отправлено текущим пользователем
    //   (в этом случае мы всегда хотим показать ему его же отправку,
    //    даже если он был чуть выше).
    if (
      currentLastId &&
      currentLastId !== prevLastId &&
      (isNearBottom ||
        (localMessages[localMessages.length - 1]?.senderId ===
          currentUserId))
    ) {
      const container = messagesContainerRef.current;
      if (container) {
        const scrollToBottom = () => {
          container.scrollTop = container.scrollHeight;
        };
        scrollToBottom();
        setTimeout(scrollToBottom, 50);
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
