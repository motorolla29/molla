'use client';

import { useState, useEffect, useRef } from 'react';
import { FidgetSpinner } from 'react-loader-spinner';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import ReviewCard from '../reviews/review-card';
import ReviewSkeleton from '../review-skeleton/review-skeleton';

interface Review {
  id: string;
  rating: number;
  content: string;
  photos?: string[];
  purchased?: boolean;
  createdAt: string;
  user: {
    id: number;
    name: string | null;
    avatar: string | null;
  };
  ad: {
    id: string;
    title: string;
    photos: string[];
  };
}

interface ReviewsListProps {
  sellerId: number;
  initialSort?: 'newest' | 'oldest' | 'positive' | 'negative';
  limit?: number;
}

export default function ReviewsList({
  sellerId,
  initialSort = 'newest',
  limit = 5,
}: ReviewsListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [sort, setSort] = useState<'newest' | 'oldest' | 'positive' | 'negative'>(initialSort);
  const [mobileSelectOpen, setMobileSelectOpen] = useState(false);
  const mobileSelectRef = useRef<HTMLDivElement>(null);

  const sortOptions = [
    { value: 'newest' as const, label: 'Сначала новые' },
    { value: 'oldest' as const, label: 'Сначала старые' },
    { value: 'positive' as const, label: 'Сначала положительные' },
    { value: 'negative' as const, label: 'Сначала отрицательные' },
  ];

  const currentSortLabel = sortOptions.find((o) => o.value === sort)?.label || '';

  // Загрузка отзывов
  const loadReviews = async (pageNum: number = 1, append: boolean = false) => {
    try {
      const params = new URLSearchParams();
      params.set('sellerId', sellerId.toString());
      params.set('sort', sort);
      params.set('page', pageNum.toString());
      params.set('limit', limit.toString());

      const response = await fetch(`/api/reviews?${params.toString()}`);
      const data = await response.json();

      if (data.reviews && Array.isArray(data.reviews)) {
        if (append) {
          setReviews((prev) => [...prev, ...data.reviews]);
        } else {
          setReviews(data.reviews);
        }

        setHasMore(data.pagination?.hasMore);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
      setHasMore(false);
    }
  };

  // Первоначальная загрузка
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setPage(1);
      setReviews([]);

      try {
        await loadReviews(1, false);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [sellerId, sort]);

  // Загрузка следующей страницы
  const loadMore = async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    const nextPage = page + 1;
    await loadReviews(nextPage, true);
    setPage(nextPage);
    setLoadingMore(false);
  };

  // Закрытие мобильного селекта при клике вне
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        mobileSelectRef.current &&
        !mobileSelectRef.current.contains(e.target as Node)
      ) {
        setMobileSelectOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSortChange = (newSort: 'newest' | 'oldest' | 'positive' | 'negative') => {
    setSort(newSort);
  };

  if (reviews.length === 0 && !isLoading && !loadingMore) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-sm sm:text-base mb-2 mx-6">
          У этого продавца пока нет отзывов
        </div>
      </div>
    );
  }

  // Скелетон для загрузки
  if (isLoading) {
    return <ReviewSkeleton count={3} showSorting={true} />;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Сортировка: мобильный селект + десктопные кнопки */}
      {/* Мобильный анимированный селект */}
      <div className="sm:hidden" ref={mobileSelectRef}>
        <div className="relative">
          <button
            type="button"
            onClick={() => setMobileSelectOpen(!mobileSelectOpen)}
            className="w-full flex items-center justify-between px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-xs font-medium text-gray-700 hover:border-violet-400 transition-colors"
          >
            <span>{currentSortLabel}</span>
            <ChevronDownIcon
              className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${mobileSelectOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {/* Выпадающий список с анимацией */}
          <div
            className={`absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden transition-all duration-200 origin-top ${
              mobileSelectOpen
                ? 'opacity-100 scale-y-100 pointer-events-auto'
                : 'opacity-0 scale-y-0 pointer-events-none'
            }`}
          >
            {sortOptions.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  handleSortChange(value);
                  setMobileSelectOpen(false);
                }}
                className={`w-full text-left px-3.5 py-2.5 text-xs transition-colors ${
                  sort === value
                    ? 'bg-violet-50 text-violet-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Десктопные кнопки-пилюли */}
      <div className="hidden sm:flex flex-wrap gap-2">
        {sortOptions.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => handleSortChange(value)}
            className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
              sort === value
                ? 'bg-violet-50 text-violet-700 border-violet-200'
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Список отзывов */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <ReviewCard
            key={review.id}
            review={review}
            sellerId={sellerId}
          />
        ))}
      </div>

      {/* Кнопка "Показать еще" */}
      {hasMore && !isLoading && (
        <div className="flex justify-center">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="mt-4 mb-2 px-5 py-2.5 bg-violet-500 text-white rounded-lg hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold text-xs sm:text-sm shadow-sm"
          >
            {loadingMore ? (
              <div className="flex items-center gap-2">
                <FidgetSpinner
                  visible={true}
                  height="20"
                  width="20"
                  ariaLabel="fidget-spinner-loading"
                  wrapperStyle={{}}
                  wrapperClass="fidget-spinner-wrapper"
                />
                Загрузка...
              </div>
            ) : (
              'Показать еще'
            )}
          </button>
        </div>
      )}

      {/* Сообщение о конце списка */}
      {!hasMore && reviews.length > 0 && !isLoading && (
        <div className="text-center py-4 sm:py-6">
          <div className="text-gray-500 text-xs sm:text-sm">Это все отзывы</div>
        </div>
      )}
    </div>
  );
}