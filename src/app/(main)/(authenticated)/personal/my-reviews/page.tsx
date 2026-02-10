'use client';

import { useState, useEffect } from 'react';
import { FidgetSpinner } from 'react-loader-spinner';
import MyReviewCard from '@/components/my-review-card';

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
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const limit = 5;

  useEffect(() => {
    loadReviews(1, false);
  }, []);

  const loadReviews = async (pageNum: number = 1, append: boolean = false) => {
    try {
      const params = new URLSearchParams();
      params.set('my-reviews', 'true');
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
        
        setHasMore(data.pagination?.hasMore || false);
        setPage(pageNum);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
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

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Мои отзывы</h1>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-4 animate-pulse">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Мои отзывы</h1>

      {reviews.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500">Вы еще не оставили ни одного отзыва</div>
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
    </div>
  );
}