'use client';

import { useState, useRef, useEffect } from 'react';
import { Star, ShoppingBag } from 'lucide-react';
import Image from 'next/image';
import { getAvatarColor } from '@/utils';
import ImageModal from '@/components/messenger/image-modal';

interface Review {
  id: string;
  rating: number;
  content: string;
  photos?: string[];
  purchased?: boolean;
  createdAt: string;
  replyContent?: string | null;
  replyCreatedAt?: string | null;
  replyPhotos?: string[] | null;
  targetRole?: 'seller' | 'buyer' | null;
  user: {
    id: number;
    name: string | null;
    avatar: string | null;
  };
  seller?: {
    id: number;
    name: string | null;
    avatar: string | null;
  } | null;
  ad: {
    id: string;
    title: string;
    photos: string[];
  };
}

interface ReviewCardProps {
  review: Review;
  sellerId: number; // ID продавца, чьи отзывы просматриваем
}

export default function ReviewCard({ review, sellerId }: ReviewCardProps) {
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const contentRef = useRef<HTMLParagraphElement>(null);
  const [isClamped, setIsClamped] = useState(false);
  const [replyExpanded, setReplyExpanded] = useState(false);
  const [isReplyClamped, setIsReplyClamped] = useState(false);
  const replyContentRef = useRef<HTMLParagraphElement>(null);

  // Проверяем, обрезан ли текст
  useEffect(() => {
    if (contentRef.current) {
      const element = contentRef.current;
      setIsClamped(element.scrollHeight > element.clientHeight);
    }
  }, [review.content]);

  // Проверяем, обрезан ли текст ответа продавца
  useEffect(() => {
    if (replyContentRef.current) {
      const element = replyContentRef.current;
      setIsReplyClamped(element.scrollHeight > element.clientHeight);
    }
  }, [review.replyContent]);

  // Определяем роль автора отзыва
  const isSeller = review.user.id === sellerId;
  const roleLabel = isSeller ? 'Продавец' : 'Покупатель';

  // Функция для отображения звезд рейтинга
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5 sm:gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={12}
            className={`sm:w-3.5 sm:h-3.5 ${
              star <= rating
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  // Генерируем аватар с первой буквой и цветом
  const getAvatarContent = () => {
    if (review.user.avatar) {
      return (
        <Image
          src={`${review.user.avatar}?tr=w-80`}
          alt={review.user.name || 'Пользователь'}
          width={40}
          height={40}
          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover"
        />
      );
    }

    // Генерируем цветной аватар с первой буквой
    const firstLetter = (review.user.name || 'П')[0].toUpperCase();
    const bgColor = getAvatarColor(review.user.id);

    return (
      <div
        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white font-semibold text-xs sm:text-sm"
        style={{ backgroundColor: bgColor }}
      >
        {firstLetter}
      </div>
    );
  };

  // Аватар продавца для блока ответа (фото или первая буква на цветном фоне)
  const getSellerAvatarContent = () => {
    const seller = review.seller;

    if (seller?.avatar) {
      return (
        <Image
          src={`${seller.avatar}?tr=w-40`}
          alt={seller.name || 'Продавец'}
          width={32}
          height={32}
          className="w-6 h-6 rounded-full object-cover"
        />
      );
    }

    const firstLetter = (seller?.name || 'П')[0]?.toUpperCase();
    const bgColor = seller?.id ? getAvatarColor(seller.id) : '#6D28D9';

    return (
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center text-white font-semibold text-[10px]"
        style={{ backgroundColor: bgColor }}
      >
        {firstLetter}
      </div>
    );
  };

  const answerRoleLabel =
    review.targetRole === 'buyer' ? 'Ответ покупателя' : 'Ответ продавца';

  return (
    <div className="border border-gray-200 rounded-lg p-3 sm:p-4 bg-white">
      <div className="flex items-start gap-2.5 sm:gap-3">
        {/* Содержимое отзыва */}
        <div className="flex-1 min-w-0">
          {/* Шапка: на мобильном в колонку, на десктопе в ряд */}
          <div className="flex flex-row max-[400px]:flex-col items-start sm:justify-between gap-2 sm:gap-3 mb-2 max-[400px]:mb-0">
            <div className="flex flex-1 items-center gap-3 truncate max-w-full">
              <div className="shrink-0">{getAvatarContent()}</div>
              <div className="flex-col items-center min-w-0">
                <span className="font-semibold text-xs sm:text-sm text-neutral-700 truncate block">
                  {review.user.name || 'Пользователь'}
                </span>
                <div className="flex items-center flex-wrap gap-1 gap-y-0 text-[10px] sm:text-xs text-gray-500 shrink-0">
                  <span>
                    {new Date(review.createdAt).toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                  <span>•</span>
                  <span>{roleLabel}</span>
                </div>
              </div>
            </div>
            <div className="max-[400px]:py-1 py-1.5 sm:py-2">
              {renderStars(review.rating)}
            </div>
          </div>

          {/* Информация об объявлении - отображаем только если отзыв о продавце */}
          {!isSeller && (
            <div className="mb-2 sm:mb-3 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <div className="min-w-0 truncate max-[300px]:flex max-[300px]:flex-col">
                <span className="text-[10px] sm:text-xs text-gray-500">
                  Объявление:{' '}
                </span>
                <span className="text-[10px] sm:text-xs text-gray-700">
                  {review.ad.title}
                </span>
              </div>
              {review.purchased !== undefined && (
                <span
                  className={`inline-flex items-center gap-1 text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full font-semibold shrink-0 w-fit ${
                    review.purchased
                      ? 'bg-green-50 text-green-600 border border-green-200'
                      : 'bg-orange-50 text-orange-600 border border-orange-200'
                  }`}
                >
                  <ShoppingBag size={9} className="sm:w-2.5 sm:h-2.5" />
                  {review.purchased ? 'Товар куплен' : 'Товар не куплен'}
                </span>
              )}
            </div>
          )}
          {/* При отображении отзыва о покупателе (пользователь - продавец) не показываем информацию об объявлении */}
          {isSeller && (
            <div className="mb-2 sm:mb-3 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <div className="min-w-0 truncate max-[300px]:flex max-[300px]:flex-col">
                <span className="text-[10px] sm:text-xs text-gray-500">
                  Отзыв о покупателе
                </span>
              </div>
            </div>
          )}

          {/* Текст отзыва */}
          <div className="relative">
            <p
              ref={contentRef}
              className={`text-xs sm:text-sm text-gray-700 leading-relaxed wrap-break-word ${
                expanded ? '' : 'line-clamp-3'
              }`}
            >
              {review.content}
            </p>
            {isClamped && !expanded && (
              <button
                type="button"
                onClick={() => setExpanded(true)}
                className="mt-1 text-[10px] sm:text-xs text-violet-500 hover:text-violet-600 font-semibold"
              >
                Показать полностью
              </button>
            )}
          </div>

          {/* Фотографии отзыва */}
          {review.photos && review.photos.length > 0 && (
            <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2.5 sm:mt-3">
              {review.photos.map((photo, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setModalImage(photo)}
                  className="w-14 h-14 sm:w-16 sm:h-16 bg-gray-200/25 rounded-lg overflow-hidden border border-gray-200 hover:opacity-80 transition-opacity cursor-pointer"
                >
                  <img
                    src={`${photo}?tr=w-150`}
                    alt={`Фото ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Ответ продавца на отзыв (только для чтения) */}
          {review.replyContent && review.replyContent.trim().length > 0 && (
            <div className="mt-3 sm:mt-4">
              <div className="relative pl-3 sm:pl-4 border-l-2 border-violet-100">
                <div className="flex items-center gap-2 mb-1.5">
                  {getSellerAvatarContent()}
                  <span className="text-[11px] sm:text-xs font-semibold text-neutral-800">
                    {answerRoleLabel}
                  </span>
                  {review.replyCreatedAt && (
                    <span className="text-[10px] sm:text-[11px] text-gray-400">
                      {new Date(review.replyCreatedAt).toLocaleDateString(
                        'ru-RU',
                        {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        },
                      )}
                    </span>
                  )}
                </div>
                <p
                  ref={replyContentRef}
                  className={`text-[11px] sm:text-xs text-gray-700 leading-relaxed whitespace-pre-line wrap-break-word ${
                    replyExpanded ? '' : 'line-clamp-5'
                  }`}
                >
                  {review.replyContent.trim()}
                </p>
                {isReplyClamped && !replyExpanded && (
                  <button
                    type="button"
                    onClick={() => setReplyExpanded(true)}
                    className="mt-1 text-[10px] sm:text-xs text-violet-500 hover:text-violet-600 font-semibold"
                  >
                    Показать полностью
                  </button>
                )}
                {Array.isArray(review.replyPhotos) &&
                  review.replyPhotos.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2">
                      {review.replyPhotos.slice(0, 3).map((photo, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setModalImage(photo)}
                          className="w-12 h-12 sm:w-14 sm:h-14 bg-gray-200/25 rounded-lg overflow-hidden border border-gray-200 hover:opacity-80 transition-opacity cursor-pointer"
                        >
                          <img
                            src={`${photo}?tr=w-140`}
                            alt={`Фото ответа ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Модальное окно просмотра фото */}
      {modalImage && (
        <ImageModal
          isOpen={true}
          onClose={() => setModalImage(null)}
          imageUrl={modalImage}
          altText="Фото отзыва"
        />
      )}
    </div>
  );
}
