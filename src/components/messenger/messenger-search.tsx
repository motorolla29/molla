'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import type { ChatListItemModel } from '@/components/messenger/chat-list-item';
import ChatList from '@/components/messenger/chat-list';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

type SearchItem = ChatListItemModel & {
  search?: {
    kind: 'message' | 'chat';
    hitAt: Date | string;
    messageId: string | null;
    snippet: string | null;
  };
};

interface MessengerSearchProps {
  onSelect: (chatId: string, messageId?: string | null) => void;
  onActiveChange?: (active: boolean) => void;
  onHideChat?: (chatId: string) => void;
  onToggleBlock?: (chat: ChatListItemModel) => void;
}

export default function MessengerSearch({
  onSelect,
  onActiveChange,
  onHideChat,
  onToggleBlock,
}: MessengerSearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [q, setQ] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [requestTick, setRequestTick] = useState(0);
  const [display, setDisplay] = useState<{
    kind: 'none' | 'hint' | 'empty' | 'results';
    query: string;
    items: SearchItem[];
    hasMore: boolean;
    cursor: string | null;
  }>({
    kind: 'none',
    query: '',
    items: [],
    hasMore: false,
    cursor: null,
  });
  const abortRef = useRef<AbortController | null>(null);
  const requestSeqRef = useRef(0);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingQueryRef = useRef<string>('');
  const isApplyingUrlRef = useRef(false);
  const restoredFromCacheRef = useRef(false);

  const trimmed = q.trim();
  const canQuery = trimmed.length >= 2;

  const cacheKeyFor = (query: string) => `messenger:search-cache:${query}`;
  const CACHE_TTL_MS = 5 * 60 * 1000;

  const tryRestoreFromCache = (query: string) => {
    try {
      const raw = sessionStorage.getItem(cacheKeyFor(query));
      if (!raw) return false;
      const parsed = JSON.parse(raw) as {
        ts: number;
        items: SearchItem[];
        hasMore: boolean;
        cursor: string | null;
      };
      if (!parsed || typeof parsed.ts !== 'number') return false;
      if (Date.now() - parsed.ts > CACHE_TTL_MS) return false;
      setDisplay({
        kind: parsed.items?.length ? 'results' : 'empty',
        query,
        items: parsed.items || [],
        hasMore: !!parsed.hasMore,
        cursor: parsed.cursor ?? null,
      });
      return true;
    } catch {
      return false;
    }
  };

  const saveToCache = (
    query: string,
    payload: { items: SearchItem[]; hasMore: boolean; cursor: string | null },
  ) => {
    try {
      sessionStorage.setItem(
        cacheKeyFor(query),
        JSON.stringify({
          ts: Date.now(),
          items: payload.items,
          hasMore: payload.hasMore,
          cursor: payload.cursor,
        }),
      );
    } catch {
      // ignore quota / private mode
    }
  };

  const writeQToUrl = (nextTrimmed: string) => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    if (nextTrimmed) params.set('q', nextTrimmed);
    else params.delete('q');
    const qs = params.toString();
    isApplyingUrlRef.current = true;
    router.replace(qs ? `${pathname}?${qs}` : pathname || '/');
    // отпускаем флаг в микротаске, чтобы следующий ререндер от searchParams не вызвал цикл
    queueMicrotask(() => {
      isApplyingUrlRef.current = false;
    });
  };

  const setSearchText = (next: string) => {
    setQ(next);
    const t = next.trim();
    onActiveChange?.(t.length > 0);
    writeQToUrl(t);
    // Мгновенные состояния без запроса:
    if (t.length === 0) {
      abortRef.current?.abort();
      requestSeqRef.current += 1;
      setIsSearching(false);
      setIsLoadingMore(false);
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      setDisplay({
        kind: 'none',
        query: '',
        items: [],
        hasMore: false,
        cursor: null,
      });
    } else if (t.length === 1) {
      abortRef.current?.abort();
      requestSeqRef.current += 1;
      setIsSearching(false);
      setIsLoadingMore(false);
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      setDisplay({
        kind: 'hint',
        query: t,
        items: [],
        hasMore: false,
        cursor: null,
      });
    } else {
      // 2+ символов: гарантированно стартуем запрос (даже если строка вернулась к прежнему значению)
      pendingQueryRef.current = t;
      setRequestTick((x) => x + 1);
    }
  };

  // Синхронизация из URL (Back/Forward): ?q=...
  useEffect(() => {
    if (isApplyingUrlRef.current) return;
    const urlQ = (searchParams?.get('q') || '').toString();
    if (urlQ === q) return;
    // применяем без обратной записи в URL
    setQ(urlQ);
    onActiveChange?.(urlQ.trim().length > 0);
    const t = urlQ.trim();
    if (t.length === 0) {
      setDisplay({
        kind: 'none',
        query: '',
        items: [],
        hasMore: false,
        cursor: null,
      });
    } else if (t.length === 1) {
      setDisplay({
        kind: 'hint',
        query: t,
        items: [],
        hasMore: false,
        cursor: null,
      });
    } else {
      // Сначала пытаемся восстановить выдачу мгновенно из кэша.
      const restored = tryRestoreFromCache(t);
      restoredFromCacheRef.current = restored;
      pendingQueryRef.current = t;
      // Если кэша нет — запускаем запрос сразу.
      if (!restored) {
        setRequestTick((x) => x + 1);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const fetchPage = async (query: string, nextCursor?: string | null) => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    const params = new URLSearchParams();
    params.set('q', query);
    params.set('limit', '20');
    if (nextCursor) params.set('cursor', nextCursor);

    const isFirst = !nextCursor;
    if (isFirst) setIsSearching(true);
    else setIsLoadingMore(true);
    try {
      const seq = ++requestSeqRef.current;
      const res = await fetch(`/api/messenger/search?${params.toString()}`, {
        signal: ac.signal,
      });
      if (!res.ok) throw new Error(await res.text());
      const data: {
        items: SearchItem[];
        hasMore: boolean;
        nextCursor: string | null;
      } = await res.json();

      // если параллельно стартовал новый запрос — игнорируем результат
      if (seq !== requestSeqRef.current) return;

      setDisplay((prev) => {
        if (isFirst) {
          saveToCache(query, {
            items: data.items,
            hasMore: data.hasMore,
            cursor: data.nextCursor,
          });
          return {
            kind: data.items.length > 0 ? 'results' : 'empty',
            query,
            items: data.items,
            hasMore: data.hasMore,
            cursor: data.nextCursor,
          };
        }
        // load more: применяем только если выдача всё ещё по этому же query
        if (prev.query !== query) return prev;
        const merged = [...prev.items, ...data.items];
        saveToCache(query, {
          items: merged,
          hasMore: data.hasMore,
          cursor: data.nextCursor,
        });
        return {
          ...prev,
          kind: prev.items.length > 0 ? 'results' : 'empty',
          items: merged,
          hasMore: data.hasMore,
          cursor: data.nextCursor,
        };
      });
    } finally {
      if (isFirst) setIsSearching(false);
      else setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    const query = pendingQueryRef.current;
    if (!query || query.length < 2) return;
    // Если пришли назад и восстановили выдачу из кэша — не дергаем сеть автоматически.
    // Запрос пойдет только при изменении текста (setSearchText -> requestTick).
    if (restoredFromCacheRef.current) {
      restoredFromCacheRef.current = false;
      return;
    }
    debounceTimerRef.current = setTimeout(() => {
      // display не трогаем — он обновится только по факту ответа
      fetchPage(query, null).catch(() => {});
    }, 250);
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestTick]);

  const loadMore = async () => {
    if (!canQuery) return;
    if (display.query.length < 2) return;
    if (!display.hasMore) return;
    if (!display.cursor) return;
    if (isSearching || isLoadingMore) return;
    await fetchPage(display.query, display.cursor);
  };

  const { chatsForList, messageIdByChatId } = useMemo(() => {
    const msgByChat = new Map<string, string>();
    const mapped: ChatListItemModel[] = display.items.map((c) => {
      if (c.search?.kind === 'message' && c.search.messageId) {
        msgByChat.set(c.id, c.search.messageId);
      }
      const isMessageHit = c.search?.kind === 'message';
      const snippet = isMessageHit ? c.search?.snippet?.trim() : null;
      const hitAt = c.search?.hitAt;

      return {
        ...c,
        // Для совпадения по сообщению — показываем в превью именно то сообщение.
        lastMessage: isMessageHit && snippet ? snippet : c.lastMessage,
        lastMessageTime: isMessageHit && hitAt ? hitAt : c.lastMessageTime,
        // Убираем статус/исходящее, чтобы не показывать "галочки" не к месту
        lastMessageStatus: isMessageHit ? null : c.lastMessageStatus,
        lastMessageIsOutgoing: isMessageHit ? false : c.lastMessageIsOutgoing,
      };
    });
    return { chatsForList: mapped, messageIdByChatId: msgByChat };
  }, [display.items]);

  const isLoadingAny = isSearching || isLoadingMore;

  return (
    <div className="mt-3 min-[500px]:mt-4">
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={q}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Поиск по сообщениям…"
          className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-gray-100 ring-2 ring-gray-100 focus:ring-2 focus:ring-violet-500/50 outline-none text-sm"
        />
        {q.length > 0 && (
          <button
            type="button"
            onClick={() => setSearchText('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 inline-flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
            aria-label={isLoadingAny ? 'Идёт поиск' : 'Очистить поиск'}
            disabled={isLoadingAny}
          >
            {isLoadingAny ? (
              <span className="w-4 h-4 border-2 border-violet-500/75 border-t-transparent rounded-full animate-spin" />
            ) : (
              <X className="w-4 h-4" />
            )}
          </button>
        )}
      </div>

      {display.kind === 'hint' && (
        <div className="py-10 text-center text-sm text-gray-500">
          <div className="font-medium text-gray-700">Уточните запрос</div>
          <div>Напишите хотя бы две буквы.</div>
        </div>
      )}

      {canQuery && (
        <div className="">
          {display.kind === 'empty' ? (
            <div className="py-6 text-center text-sm text-gray-500">
              Ничего не найдено
            </div>
          ) : display.kind === 'results' || isLoadingMore ? (
            <ChatList
              chats={chatsForList}
              onChatSelect={(chatId) =>
                onSelect(chatId, messageIdByChatId.get(chatId) || null)
              }
              hasMore={display.hasMore}
              isLoadingMore={isLoadingMore}
              onLoadMoreChats={loadMore}
              onHideChat={onHideChat}
              onToggleBlock={onToggleBlock}
            />
          ) : null}
        </div>
      )}
    </div>
  );
}
