'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocationStore } from '@/store/useLocationStore';
import { DEFAULT_TOP_SEARCH_SUGGESTIONS } from '@/const';
import { lockScroll, unlockScroll } from '@/utils/scroll-lock';
import {
  MagnifyingGlassIcon,
  ClockIcon,
  SparklesIcon,
  ChevronRightIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface MobileSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryName: string | null;
  categoryKey: string | null;
  initialQuery: string;
  onSearchApplied?: (value: string) => void;
}

interface HistoryItem {
  text: string;
  count: number;
  lastAt: number;
}

export function MobileSearchModal({
  isOpen,
  onClose,
  categoryName,
  categoryKey,
  initialQuery,
  onSearchApplied,
}: MobileSearchModalProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { cityLabel, cityNamePreposition } = useLocationStore();

  const [query, setQuery] = useState(initialQuery);
  const [forceBasePlaceholder, setForceBasePlaceholder] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [remoteSuggestions, setRemoteSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Блокируем скролл страницы при открытой модалке
  useEffect(() => {
    if (!isOpen) return;
    lockScroll();
    return () => {
      unlockScroll();
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setQuery(initialQuery);
    setForceBasePlaceholder(false);
  }, [isOpen, initialQuery]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem('search-history');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setHistory(parsed);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const saveHistory = (items: HistoryItem[]) => {
    setHistory(items);
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem('search-history', JSON.stringify(items));
    } catch {
      // ignore
    }
  };

  const updateHistoryOnSearch = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const now = Date.now();
    const existingIndex = history.findIndex(
      (item) => item.text.toLowerCase() === trimmed.toLowerCase(),
    );

    let next: HistoryItem[];

    if (existingIndex >= 0) {
      const existing = history[existingIndex];
      const updated = {
        ...existing,
        count: existing.count + 1,
        lastAt: now,
      };
      next = [updated, ...history.filter((_, idx) => idx !== existingIndex)];
    } else {
      next = [{ text: trimmed, count: 1, lastAt: now }, ...history];
    }

    if (next.length > 100) {
      next = next.slice(0, 100);
    }

    saveHistory(next);
  };

  const handleLogSearch = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    updateHistoryOnSearch(trimmed);

    try {
      void fetch('/api/search/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: trimmed }),
      });
    } catch {
      // ignore
    }
  };

  const performSearch = async (term: string) => {
    const trimmed = term.trim();
    const params = new URLSearchParams(searchParams?.toString() ?? '');

    if (trimmed) {
      params.set('search', trimmed);
    } else {
      params.delete('search');
    }

    const basePath = categoryKey
      ? `/${cityLabel}/${categoryKey}`
      : `/${cityLabel}`;

    await handleLogSearch(trimmed);

    onSearchApplied?.(trimmed);
    onClose();

    router.push(`${basePath}?${params.toString()}`);
  };

  const fetchRemoteSuggestions = async (q: string) => {
    const trimmed = q.trim();
    try {
      const url = trimmed
        ? `/api/search/suggestions?q=${encodeURIComponent(trimmed)}`
        : '/api/search/suggestions';
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error('Failed to fetch suggestions');
      }
      const data = (await res.json()) as string[];
      setRemoteSuggestions(Array.isArray(data) ? data : []);
    } catch {
      setRemoteSuggestions([]);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    fetchRemoteSuggestions(query);
  }, [isOpen, query]);

  const localSuggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return history
        .slice()
        .sort((a, b) => b.count - a.count || b.lastAt - a.lastAt)
        .slice(0, 8)
        .map((h) => h.text);
    }

    return history
      .filter((h) => h.text.toLowerCase().startsWith(q))
      .sort((a, b) => b.count - a.count || b.lastAt - a.lastAt)
      .slice(0, 8)
      .map((h) => h.text);
  }, [history, query]);

  const mergedSuggestions = useMemo(() => {
    const set = new Set<string>();
    const result: { text: string; source: 'local' | 'remote' }[] = [];

    for (const text of localSuggestions) {
      const trimmed = text.trim();
      if (!trimmed || set.has(trimmed.toLowerCase())) continue;
      set.add(trimmed.toLowerCase());
      result.push({ text: trimmed, source: 'local' });
    }

    for (const text of remoteSuggestions) {
      const trimmed = text.trim();
      if (!trimmed || set.has(trimmed.toLowerCase())) continue;
      set.add(trimmed.toLowerCase());
      result.push({ text: trimmed, source: 'remote' });
    }

    const isQueryEmpty = !query.trim();
    const hasAnySuggestions = result.length > 0;

    // fallback показываем только когда вообще ничего нет и инпут пуст
    if (isQueryEmpty && !hasAnySuggestions) {
      for (const text of DEFAULT_TOP_SEARCH_SUGGESTIONS) {
        const trimmed = text.trim();
        if (!trimmed || set.has(trimmed.toLowerCase())) continue;
        set.add(trimmed.toLowerCase());
        result.push({ text: trimmed, source: 'remote' });
      }
    }

    return result.slice(0, 7);
  }, [localSuggestions, remoteSuggestions, query]);

  const handleSuggestionClick = (value: string) => {
    void performSearch(value);
  };

  const basePlaceholder = `Найти ${
    categoryName ? categoryName.toLocaleLowerCase() : 'объявления'
  }${cityNamePreposition ? ` в ${cityNamePreposition}...` : '...'}`;
  const lastQuery = history[0]?.text;
  const placeholder =
    !query.trim() && lastQuery && !forceBasePlaceholder
      ? lastQuery
      : basePlaceholder;

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const content = (
    <div className="fixed inset-0 pb-12 z-50 bg-white flex flex-col">
      <div className="px-4 pt-4 pb-2 flex items-center gap-2 border-b border-gray-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void performSearch(query);
          }}
          className="flex-1 relative"
        >
          <button
            type="submit"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            aria-label="Найти"
          >
            <MagnifyingGlassIcon className="w-5 h-5 shrink-0" />
          </button>
          <input
            autoFocus
            type="text"
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className={[
              'w-full pl-9 py-2 border border-gray-300 rounded-full outline-none focus:border-violet-300 truncate',
              query.trim() ? 'pr-9' : 'pr-3',
            ].join(' ')}
          />
          {query.trim() && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setForceBasePlaceholder(true);
                // Сохраняем фокус и мигающий курсор
                inputRef.current?.focus();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              aria-label="Очистить"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          )}
        </form>
        <button
          type="button"
          onClick={onClose}
          className="ml-2 text-sm text-violet-500 font-medium"
        >
          Отменить
        </button>
      </div>

      {/* Подсказки */}
      <div className="flex-1 overflow-y-auto custom-scrollbar-2 scrollbar-suggestions px-2 py-2">
        <ul className="bg-white divide-y divide-gray-100 rounded-xl overflow-hidden">
          {mergedSuggestions.map((item) => (
            <li key={`${item.source}-${item.text}`}>
              <button
                type="button"
                onClick={() => handleSuggestionClick(item.text)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-gray-50 text-left"
              >
                <span className="flex items-center gap-2 min-w-0">
                  {item.source === 'local' ? (
                    <ClockIcon className="w-5 h-5 text-gray-400 shrink-0" />
                  ) : (
                    <SparklesIcon className="w-5 h-5 text-violet-400 shrink-0" />
                  )}
                  <span className="truncate text-sm text-neutral-800">
                    {item.text}
                  </span>
                </span>
                <ChevronRightIcon className="w-5 h-5 text-gray-300 shrink-0" />
              </button>
            </li>
          ))}

          {/* Всегда последний пункт — текущий текст */}
          {query.trim() && (
            <li>
              <button
                type="button"
                onClick={() => handleSuggestionClick(query)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-gray-50 text-left"
              >
                <span className="flex items-center gap-2 min-w-0">
                  <MagnifyingGlassIcon className="w-5 h-5 text-gray-500 shrink-0" />
                  <span className="truncate text-sm font-medium text-neutral-900">
                    {query.trim()}
                  </span>
                </span>
                <ChevronRightIcon className="w-5 h-5 text-gray-300 shrink-0" />
              </button>
            </li>
          )}

          {!mergedSuggestions.length && !query.trim() && (
            <li className="px-3 py-2 text-xs text-gray-400">
              Введите запрос для поиска
            </li>
          )}
        </ul>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
