'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { StarIcon as SolidStarIcon } from '@heroicons/react/24/solid';
import { StarIcon as OutlineStarIcon } from '@heroicons/react/24/outline';
import { FidgetSpinner } from 'react-loader-spinner';
import ReceivedReviewCard from '@/components/received-review-card/received-review-card';
import ReviewSkeleton from '@/components/review-skeleton/review-skeleton';

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

interface ReviewsResponse {
  reviews: Review[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    hasMore: boolean;
  };
}

export default function RatingPage() {
  const { user } = useAuthStore();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalReviews, setTotalReviews] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const REVIEWS_LIMIT = 12;

  // Загрузка отзывов с пагинацией
  const loadReviews = async (pageNum: number, append: boolean) => {
    if (!user) return;

    try {
      if (!append) {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }

      const params = new URLSearchParams();
      params.set('sellerId', user.id.toString());
      params.set('page', pageNum.toString());
      params.set('limit', REVIEWS_LIMIT.toString());
      params.set('sort', 'newest');

      const res = await fetch(`/api/reviews?${params.toString()}`);
      if (!res.ok) {
        throw new Error('Не удалось загрузить отзывы');
      }

      const data: ReviewsResponse = await res.json();
      const newReviews = data.reviews || [];

      setReviews((prev) => (append ? [...prev, ...newReviews] : newReviews));
      setTotalReviews(data.pagination?.totalCount || newReviews.length);
      setHasMore(Boolean(data.pagination?.hasMore));
      setPage(pageNum);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка при загрузке отзывов');
      setHasMore(false);
    } finally {
      if (!append) {
        setLoading(false);
      } else {
        setLoadingMore(false);
      }
    }
  };

  useEffect(() => {
    if (!user) return;
    loadReviews(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const { distribution, maxBucket } = useMemo(() => {
    const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const r of reviews) {
      if (r.rating >= 1 && r.rating <= 5) {
        dist[r.rating] = (dist[r.rating] || 0) + 1;
      }
    }
    const max = Math.max(...Object.values(dist), 1);
    return { distribution: dist, maxBucket: max };
  }, [reviews]);

  const handleLoadMore = () => {
    if (loadingMore || !hasMore) return;
    loadReviews(page + 1, true);
  };

  if (!user) return null;

  return (
    <div className="m-4 lg:m-6 h-full text-neutral-800">
      <div className="mb-4 pb-4 border-b border-gray-200">
        <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
          Рейтинг
        </h1>
      </div>

      {/* Шапка рейтинга */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 max-[400px]:pr-0 p-4 sm:p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-6xl font-semibold text-gray-900">
                {user.rating.toFixed(1)}
              </span>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, idx) => {
                  const starPos = idx + 1;
                  const fillPercent = Math.min(
                    Math.max((user.rating - (starPos - 1)) * 100, 0),
                    100,
                  );
                  return (
                    <div
                      key={idx}
                      className="relative w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 xl:w-9 xl:h-9"
                    >
                      <OutlineStarIcon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 xl:w-9 xl:h-9 text-yellow-400" />
                      {fillPercent > 0 && (
                        <SolidStarIcon
                          className="absolute top-0 left-0 w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 xl:w-9 xl:h-9 text-yellow-400 overflow-hidden"
                          style={{
                            clipPath: `inset(0 ${100 - fillPercent}% 0 0)`,
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="mt-1 text-xs sm:text-sm text-gray-500">
              На основании {totalReviews}{' '}
              {totalReviews === 1
                ? 'оценки'
                : totalReviews >= 2 && totalReviews <= 4
                  ? 'оценок'
                  : 'оценок'}
            </div>
          </div>

          {/* Гистограмма по звёздам */}
          <div className="flex-1 max-w-md md:ml-6">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = distribution[star] || 0;
              const widthPercent =
                maxBucket > 0 ? Math.max((count / maxBucket) * 100, 4) : 0;
              return (
                <div
                  key={star}
                  className="flex items-center gap-3 text-xs sm:text-sm mb-1.5"
                >
                  <div className="md:w-28 flex items-center justify-end gap-0.5 text-gray-600">
                    {Array.from({ length: 5 }).map((_, idx) => {
                      const pos = idx + 1;
                      return pos <= star ? (
                        <SolidStarIcon
                          key={pos}
                          className="w-3 h-3 text-yellow-400"
                        />
                      ) : (
                        <OutlineStarIcon
                          key={pos}
                          className="w-3 h-3 text-gray-300"
                        />
                      );
                    })}
                  </div>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400 rounded-full transition-all"
                      style={{ width: `${widthPercent}%` }}
                    />
                  </div>
                  <div className="w-8 text-left text-gray-500 leading-none">
                    {count > 0 ? count : '\u00a0'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Опубликованные отзывы */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <h2 className="flex items-center text-base sm:text-lg font-semibold text-gray-900">
            <span>Опубликованные отзывы</span>
            <span className="text-xs sm:text-sm font-bold text-neutral-500 ml-2">
              {!loading && totalReviews}
            </span>
          </h2>
        </div>
        {reviews.length > 0 && (
          <p className="text-xs sm:text-sm text-gray-500 mb-4">
            Отзывы, которые влияют на ваш рейтинг.
          </p>
        )}

        {loading ? (
          <ReviewSkeleton count={3} showMenuButton={true} />
        ) : error ? (
          <div className="text-xs sm:text-sm text-red-500">
            {error || 'Произошла ошибка при загрузке отзывов'}
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-xs sm:text-sm text-gray-500">
            У вас пока нет отзывов от других пользователей.
          </div>
        ) : (
          <>
            <div className="space-y-3 sm:space-y-4">
              {reviews.map((review) => (
                <ReceivedReviewCard key={review.id} review={review} />
              ))}
            </div>

            {hasMore && (
              <div className="flex justify-center">
                <button
                  onClick={handleLoadMore}
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

            {!hasMore && reviews.length > 0 && (
              <div className="text-center py-4 sm:py-6">
                <div className="text-gray-500 text-xs sm:text-sm">
                  Это все отзывы
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
