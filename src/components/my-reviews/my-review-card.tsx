'use client';

import { useState, useRef, useEffect } from 'react';
import { Star, MoreVertical, ExternalLink, Trash2, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import ImageModal from '@/components/messenger/image-modal';
import { useAuthStore } from '@/store/useAuthStore';
import { useConfirmationModal } from '@/components/confirmation-modal/confirmation-modal-context';
import { useToast } from '@/components/toast/toast-context';
import { getAvatarColor } from '@/utils';
import Image from 'next/image';

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

interface MyReviewCardProps {
  review: Review;
  onDelete: (reviewId: string) => void;
}

export default function MyReviewCard({ review, onDelete }: MyReviewCardProps) {
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLParagraphElement>(null);
  const [isClamped, setIsClamped] = useState(false);
  const { user } = useAuthStore();
  const { confirm } = useConfirmationModal();
  const { success } = useToast();
  // Определяем, является ли текущий пользователь продавцом, которому оставлен отзыв
  // Если да - это отзыв, оставленный пользователю как продавцу
  // Если нет - это отзыв, который пользователь оставил кому-то другому
  const isReviewAboutCurrentUser = user?.id && parseInt(user.id) === review.seller.id;
  // Определяем, является ли текущий пользователь автором отзыва
  const isCurrentUserAuthor = user?.id && parseInt(user.id) === review.user.id;
  const roleLabel = isCurrentUserAuthor ? 'Покупатель' : 'Продавец';

  // Проверяем, обрезан ли текст
  useEffect(() => {
    if (contentRef.current) {
      const element = contentRef.current;
      setIsClamped(element.scrollHeight > element.clientHeight);
    }
  }, [review.content]);

  // Закрытие меню при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
    if (user?.avatar) {
      return (
        <Image
          src={user.avatar}
          alt={user.name || 'Пользователь'}
          width={40}
          height={40}
          className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover"
        />
      );
    }

    // Генерируем цветной аватар с первой буквой
    const firstLetter = (user?.name || 'П')[0].toUpperCase();
    const bgColor = user?.id ? getAvatarColor(parseInt(user.id)) : '#3B82F6';

    return (
      <div
        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white font-semibold text-xs sm:text-sm"
        style={{ backgroundColor: bgColor }}
      >
        {firstLetter}
      </div>
    );
  };

  const handleDelete = async () => {
    confirm(
      'Вы уверены, что хотите удалить этот отзыв?',
      async () => {
        try {
          await onDelete(review.id);
          success('Отзыв успешно удален');
        } catch (error) {
          // Error handling is done in the parent component
        }
      },
      {
        title: 'Удалить отзыв',
        icon: Trash2,
        iconBgColor: 'bg-red-100',
        iconColor: 'text-red-500',
      }
    );
    setMenuOpen(false);
  };

  return (
    <div className="border border-gray-200 rounded-lg p-3 sm:p-4 bg-white">
      <div className="flex items-start gap-2.5 sm:gap-3">
        {/* Содержимое отзыва */}
        <div className="flex-1 min-w-0">
          {/* Шапка: аватар, имя и дата слева, звезды справа */}
          <div className="flex flex-row max-[400px]:flex-col items-start sm:justify-between gap-2 max-[400px]:gap-1 sm:gap-3 mb-2 max-[400px]:mb-0">
            <div className='flex flex-1 items-center gap-3 truncate max-w-full'>
              <div className='shrink-0'>{getAvatarContent()}</div>
              <div className="flex-col items-center min-w-0">
                <span className="font-medium text-xs sm:text-sm text-neutral-700 truncate block">
                  {user?.name || 'Пользователь'}
                </span>
                <div className="flex items-center flex-wrap gap-1 gap-y-0 text-[10px] sm:text-xs text-gray-500 shrink-0">
                  <span>
                    {new Date(review.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                  <span>•</span>
                  <span>{roleLabel}</span>
                </div>
              </div>
            </div>
            <div className='py-1'>{renderStars(review.rating)}</div>
          </div>

          {/* Информация об объявлении */}
          <div className="mb-2 sm:mb-3 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
            <div className="min-w-0 truncate max-[300px]:flex max-[300px]:flex-col">
              <span className="text-[10px] sm:text-xs text-gray-500">Объявление: </span>
              <span className="text-[10px] sm:text-xs text-gray-700">
                {review.ad.title}
              </span>
            </div>
            {review.purchased !== undefined && (
              <span
                className={`inline-flex items-center gap-1 text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full font-medium shrink-0 w-fit ${
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
                className="mt-1 text-[10px] sm:text-xs text-violet-500 hover:text-violet-600 font-medium"
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
        </div>

        {/* Кнопка с 3 точками */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            data-popup
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 bg-gray-100 rounded-lg transition-colors pointer-events-auto"
          >
            <MoreVertical size={16} />
          </button>

          {/* Выпадающее меню с анимацией */}
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                className="absolute right-0 top-full mt-1 w-58 sm:w-66 bg-white border border-gray-200 rounded-lg shadow-lg z-50 pointer-events-auto"
                initial={{ opacity: 0, scale: 0.8, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -5 }}
                transition={{
                  duration: 0.15,
                  ease: 'easeOut',
                }}
              >
                <div className="py-1">
                  {/* Если это отзыв, оставленный пользователю как продавцу (пользователь - продавец) */}
                  {isReviewAboutCurrentUser && (
                    <Link
                      href={`/user/${review.user.id}/active`}
                      className="w-full px-4 py-2 text-left text-xs sm:text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      onClick={() => setMenuOpen(false)}
                    >
                      <ExternalLink size={12} className="sm:w-[14px] sm:h-[14px]" />
                      Перейти в профиль покупателя
                    </Link>
                  )}
                  {/* Если это отзыв, который пользователь оставил кому-то другому (пользователь - автор) */}
                  {!isReviewAboutCurrentUser && (
                    <Link
                      href={`/user/${review.seller.id}/active`}
                      className="w-full px-4 py-2 text-left text-xs sm:text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      onClick={() => setMenuOpen(false)}
                    >
                      <ExternalLink size={12} className="sm:w-[14px] sm:h-[14px]" />
                      Перейти в профиль продавца
                    </Link>
                  )}
                  <button
                    onClick={handleDelete}
                    className="w-full px-4 py-2 text-left text-xs sm:text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <Trash2 size={12} className="sm:w-[14px] sm:h-[14px]" />
                    Удалить
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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