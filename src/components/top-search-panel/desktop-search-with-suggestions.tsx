'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSearchParams, useRouter } from 'next/navigation';
import { useLocationStore } from '@/store/useLocationStore';
import { DEFAULT_TOP_SEARCH_SUGGESTIONS } from '@/const';
import {
  ClockIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

interface DesktopSearchWithSuggestionsProps {
  categoryName: string | null;
  categoryKey: string | null;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
}

interface HistoryItem {
  text: string;
  count: number;
  lastAt: number;
}

export function DesktopSearchWithSuggestions({
  categoryName,
  categoryKey,
  searchTerm,
  setSearchTerm,
}: DesktopSearchWithSuggestionsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { cityLabel, cityNamePreposition } = useLocationStore();

  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [remoteSuggestions, setRemoteSuggestions] = useState<string[]>([]);
  const [isLoadingRemote, setIsLoadingRemote] = useState(false);

  // Инициализация истории из localStorage
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

    setIsOverlayOpen(false);

    router.push(`${basePath}?${params.toString()}`);

    // Снимаем фокус с инпута после выполнения поиска
    inputRef.current?.blur();
  };

  const fetchRemoteSuggestions = async (q: string) => {
    const trimmed = q.trim();

    try {
      setIsLoadingRemote(true);
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
    } finally {
      setIsLoadingRemote(false);
    }
  };

  // Обновляем удалённые подсказки при изменении строки поиска
  useEffect(() => {
    fetchRemoteSuggestions(searchTerm);
  }, [searchTerm]);

  const localSuggestions = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
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
  }, [history, searchTerm]);

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

    const isQueryEmpty = !searchTerm.trim();
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

    // Оставляем максимум 7, 8-й слот под текущий текст
    return result.slice(0, 7);
  }, [localSuggestions, remoteSuggestions, searchTerm]);

  const handleSuggestionClick = (value: string) => {
    setSearchTerm(value);
    void performSearch(value);
  };

  const handleInputFocus = () => {
    setIsOverlayOpen(true);
  };

  const handleOverlayClick = () => {
    setIsOverlayOpen(false);
  };

  const basePlaceholder = `Найти ${
    categoryName ? categoryName.toLocaleLowerCase() : 'объявления'
  }${cityNamePreposition ? ` в ${cityNamePreposition}...` : '...'}`;
  const lastQuery = history[0]?.text;
  const placeholder =
    isOverlayOpen && !searchTerm.trim() && lastQuery
      ? lastQuery
      : basePlaceholder;

  const hasValue = !!searchTerm.trim();

  return (
    <>
      <AnimatePresence>
        {isOverlayOpen && (
          <motion.div
            className="fixed inset-0 z-30 bg-black/15 backdrop-blur-[2px]"
            onClick={handleOverlayClick}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          />
        )}
      </AnimatePresence>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void performSearch(searchTerm);
        }}
        className="flex-1 relative min-w-72 z-40"
      >
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onFocus={handleInputFocus}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={placeholder}
            className={`w-full pl-4 ${hasValue ? 'pr-28' : 'pr-21'} py-2 outline rounded-full bg-white transition-all duration-150 ease-in truncate ${isOverlayOpen ? 'outline-4 outline-violet-400' : 'outline-1 outline-gray-300'}`}
          />
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              if (!hasValue) return;
              setSearchTerm('');
              inputRef.current?.focus();
            }}
            className={`group absolute right-20 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-neutral-700 transition-colors duration-200 flex items-center justify-center ${hasValue ? 'pointer-events-auto' : 'pointer-events-none'}`}
            aria-label="Очистить поиск"
          >
            <span className="relative flex items-center justify-center w-8 h-8">
              {/* отдельный span-фон под крестом */}
              <span className="absolute inset-0 rounded-full bg-gray-200/50 -z-10 transition-transform duration-200 ease-out scale-0 group-hover:scale-100" />
              {/* сам крестик, без изменения размера */}
              <XMarkIcon
                className={`w-5 h-5 ${hasValue ? 'scale-100' : 'scale-0'} transition-transform duration-150 ease-out`}
              />
            </span>
          </button>
          <button
            type="submit"
            className="absolute outline-none -right-px -top-px h-[calc(100%+2px)] px-4 cursor-pointer bg-violet-400 text-white rounded-full hover:bg-violet-500"
          >
            Найти
          </button>
        </div>

        {/* Подсказки под инпутом */}
        <AnimatePresence>
          {isOverlayOpen && (
            <motion.div
              className="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-lg max-h-80 overflow-y-auto scrollbar-hide"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              <ul className="py-2">
                {mergedSuggestions.map((item) => (
                  <li key={`${item.source}-${item.text}`}>
                    <button
                      type="button"
                      onClick={() => handleSuggestionClick(item.text)}
                      className="w-full flex items-center px-3 py-2 hover:bg-gray-50 text-left"
                    >
                      {item.source === 'local' ? (
                        <ClockIcon className="w-5 h-5 text-gray-400 mr-2 shrink-0" />
                      ) : (
                        <SparklesIcon className="w-5 h-5 text-violet-400 mr-2 shrink-0" />
                      )}
                      <span className="truncate text-sm text-neutral-800">
                        {item.text}
                      </span>
                    </button>
                  </li>
                ))}

                {/* Всегда последний пункт — текущий текст */}
                {searchTerm.trim() && (
                  <li className="border-t border-gray-100 mt-1 pt-1">
                    <button
                      type="button"
                      onClick={() => handleSuggestionClick(searchTerm)}
                      className="w-full flex items-center px-3 py-2 hover:bg-gray-50 text-left"
                    >
                      <MagnifyingGlassIcon className="w-5 h-5 text-gray-500 mr-2 shrink-0" />
                      <span className="truncate text-sm font-medium text-neutral-900">
                        {searchTerm.trim()}
                      </span>
                    </button>
                  </li>
                )}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </>
  );
}
