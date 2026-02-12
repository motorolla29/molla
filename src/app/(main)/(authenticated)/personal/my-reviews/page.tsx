'use client';

import { useState, useEffect } from 'react';
import { FidgetSpinner } from 'react-loader-spinner';
import MyReviewCard from '@/components/my-reviews/my-review-card';
import ReviewSkeleton from '@/components/review-skeleton/review-skeleton';

interface Review {
  id: string;
  rating: number;
  content: string;
  photos?: string[];
  purchased?: boolean;
  createdAt: string;
  replyContent?: string | null;
  replyCreatedAt?: string | null;
  user: {
    id: number;
    name: string | null;
    avatar: string | null;
  };
  seller: {
    id: number;
    name: string | null;
  };
  ad: {
    id: string;
    title: string;
    photos: string[];
  };
}

export default function MyReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const limit = 5;

  useEffect(() => {
    loadReviews(1, false);
  }, []);

  const loadReviews = async (pageNum: number = 1, append: boolean = false) => {
    try {
      if (!append) {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }
      
      const params = new URLSearchParams();
      params.set('my-reviews', 'true');
      params.set('page', pageNum.toString());
      params.set('limit', limit.toString());
      
      const response = await fetch(`/api/reviews?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Не удалось загрузить отзывы');
      }
      
      const data = await response.json();
      
      if (data.reviews && Array.isArray(data.reviews)) {
        if (append) {
          setReviews((prev) => [...prev, ...data.reviews]);
        } else {
          setReviews(data.reviews);
        }
        
        setHasMore(data.pagination?.hasMore || false);
        setPage(pageNum);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Error loading reviews:', err);
      setError(err instanceof Error ? err.message : 'Произошла ошибка при загрузке отзывов');
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    const nextPage = page + 1;
    await loadReviews(nextPage, true);
  };

  const deleteReview = async (reviewId: string) => {
    try {
      const response = await fetch(`/api/reviews?id=${reviewId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setReviews(reviews.filter(r => r.id !== reviewId));
        // Also update the hasMore state if we removed the last review on the page
        if (reviews.length === 1 && page > 1) {
          // If we deleted the last review on a page > 1, reload the current page
          await loadReviews(page, false);
        }
      } else {
        throw new Error('Failed to delete review');
      }
    } catch (error) {
      console.error('Error deleting review:', error);
      throw error;
    }
  };

  return (
    <div className="m-6 h-full">
      <div className="mb-4 pb-4 border-b border-gray-200">
        <h1 className="text-lg font-semibold text-gray-900">Мои отзывы</h1>
      </div>
      
      {loading ? (
        <ReviewSkeleton count={3} showMenuButton={true} />
      ) : error ? (
        <div className="max-w-xs sm:max-w-sm mx-auto mt-8">
          <div className="bg-red-50/50 backdrop-blur-sm border border-red-200 rounded-2xl p-6 shadow-xl text-center">
            <div className="mb-2">
              <svg className="w-9 h-9 sm:w-10 sm:h-10 mx-auto text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-sm sm:text-base font-semibold text-red-500 mb-2">Ошибка загрузки</h3>
            <p className="text-red-800 text-xs sm:text-sm mb-4">{error || 'Произошла ошибка при загрузке отзывов'}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 text-xs sm:text-sm bg-violet-500 text-white rounded-lg hover:bg-violet-600 active:bg-violet-700 font-semibold"
            >
              Повторить попытку
            </button>
          </div>
        </div>
      ) : (
        <>
          {reviews.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Отзывов пока нет</h3>
              <p className="text-gray-500">Здесь будут отображаться ваши отзывы о других пользователях</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <MyReviewCard 
                  key={review.id} 
                  review={review} 
                  onDelete={deleteReview}
                />
              ))}
              
              {/* Кнопка "Показать еще" */}
              {hasMore && (
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
              {!hasMore && reviews.length > 0 && (
                <div className="text-center py-4 sm:py-6">
                  <div className="text-gray-500 text-xs sm:text-sm">Это все ваши отзывы</div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}