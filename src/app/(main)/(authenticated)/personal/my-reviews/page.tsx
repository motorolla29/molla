'use client';

import { useState, useEffect } from 'react';
import { Star, User, MoreVertical, ExternalLink, Trash2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface Review {
  id: string;
  rating: number;
  content: string;
  createdAt: string;
  seller: {
    id: number;
    name: string | null;
  };
  ad: {
    id: string;
    title: string;
  };
}

export default function MyReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      const response = await fetch('/api/reviews/my-reviews');
      const data = await response.json();
      setReviews(data.reviews || []);
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteReview = async (reviewId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот отзыв?')) return;

    try {
      const response = await fetch(`/api/reviews?id=${reviewId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setReviews(reviews.filter(r => r.id !== reviewId));
      }
    } catch (error) {
      console.error('Error deleting review:', error);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={14}
            className={`${
              star <= rating
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
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
            <div key={review.id} className="border border-gray-200 rounded-lg p-4 bg-white">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium">Продавец: {review.seller.name}</span>
                    {renderStars(review.rating)}
                  </div>

                  <div className="mb-3">
                    <span className="text-sm text-gray-500">Объявление: </span>
                    <span className="text-sm text-gray-700">{review.ad.title}</span>
                  </div>

                  <p className="text-gray-700 mb-2">{review.content}</p>

                  <span className="text-xs text-gray-500">
                    {new Date(review.createdAt).toLocaleDateString('ru-RU')}
                  </span>
                </div>

                <div className="relative ml-4">
                  <div className="group relative">
                    <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                      <MoreVertical size={16} className="text-gray-400" />
                    </button>

                    {/* Dropdown menu */}
                    <div className="absolute right-0 mt-1 w-56 bg-white border border-gray-200 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                      <Link
                        href={`/user/${review.seller.id}/active`}
                        className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50 transition-colors"
                      >
                        <ExternalLink size={16} />
                        Перейти в профиль продавца
                      </Link>
                      <button
                        onClick={() => deleteReview(review.id)}
                        className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50 transition-colors text-red-600 w-full text-left"
                      >
                        <Trash2 size={16} />
                        Удалить
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}