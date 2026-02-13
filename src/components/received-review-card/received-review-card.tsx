'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Star,
  MoreVertical,
  ShoppingBag,
  MessageCircleMore,
  Camera,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { getAvatarColor } from '@/utils';
import { useToast } from '@/components/toast/toast-context';
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

interface ReceivedReviewCardProps {
  review: Review;
}

export default function ReceivedReviewCard({
  review,
}: ReceivedReviewCardProps) {
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [isClamped, setIsClamped] = useState(false);
  const [replyExpanded, setReplyExpanded] = useState(false);
  const [isReplyClamped, setIsReplyClamped] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState(review.replyContent ?? '');
  const [replyError, setReplyError] = useState<string | null>(null);
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [localReplyContent, setLocalReplyContent] = useState<string | null>(
    review.replyContent ?? null,
  );
  const [localReplyCreatedAt, setLocalReplyCreatedAt] = useState<string | null>(
    review.replyCreatedAt ?? null,
  );
  const [localReplyPhotos, setLocalReplyPhotos] = useState<string[] | null>(
    review.replyPhotos ?? null,
  );
  const contentRef = useRef<HTMLParagraphElement>(null);
  const replyContentRef = useRef<HTMLParagraphElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  interface ReplyUploadingPhoto {
    id: string;
    file: File;
    previewUrl?: string;
    url?: string;
    status: 'pending' | 'uploading' | 'done' | 'error';
  }

  const [replyPhotos, setReplyPhotos] = useState<ReplyUploadingPhoto[]>([]);
  const MAX_REPLY_PHOTOS = 3;
  const toast = useToast();

  // Проверяем, обрезан ли текст
  useEffect(() => {
    if (contentRef.current) {
      const el = contentRef.current;
      setIsClamped(el.scrollHeight > el.clientHeight);
    }
  }, [review.content]);

  // Проверяем, обрезан ли текст ответа
  useEffect(() => {
    if (replyContentRef.current) {
      const el = replyContentRef.current;
      setIsReplyClamped(el.scrollHeight > el.clientHeight);
    }
  }, [localReplyContent, review.replyContent]);

  // Закрытие меню при клике вне его
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hasReply = Boolean(
    (localReplyContent ?? review.replyContent)?.trim().length,
  );

  const handleStartReply = () => {
    if (hasReply) {
      toast.info('Вы уже оставили ответ на этот отзыв');
      setMenuOpen(false);
      return;
    }
    setReplyError(null);
    setIsReplying(true);
    setMenuOpen(false);
  };

  const handleCancelReply = () => {
    setIsReplying(false);
    setReplyError(null);
    // Не сбрасываем текст, чтобы пользователь мог вернуться
  };

  const handleReplyFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const remainingSlots = MAX_REPLY_PHOTOS - replyPhotos.length;
    if (remainingSlots <= 0) return;

    const toAdd = files.slice(0, remainingSlots);

    const newItems: ReplyUploadingPhoto[] = toAdd.map((file) => ({
      id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
      file,
      status: 'pending',
    }));

    setReplyPhotos((prev) => [...prev, ...newItems]);

    // Превью
    newItems.forEach((item) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setReplyPhotos((prev) =>
          prev.map((p) =>
            p.id === item.id
              ? { ...p, previewUrl: ev.target?.result as string }
              : p,
          ),
        );
      };
      reader.readAsDataURL(item.file);
    });

    // Загрузка на сервер
    newItems.forEach((item) => uploadReplyPhoto(item));

    e.target.value = '';
  };

  const uploadReplyPhoto = async (item: ReplyUploadingPhoto) => {
    setReplyPhotos((prev) =>
      prev.map((p) => (p.id === item.id ? { ...p, status: 'uploading' } : p)),
    );

    try {
      const formData = new FormData();
      formData.append('file', item.file);
      formData.append('fileName', item.file.name);
      formData.append('folder', '/molla/review-replies');

      const res = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');

      const data = await res.json();

      setReplyPhotos((prev) =>
        prev.map((p) =>
          p.id === item.id
            ? { ...p, status: 'done', url: data.url as string }
            : p,
        ),
      );
    } catch (err) {
      console.error('Reply photo upload error:', err);
      setReplyPhotos((prev) =>
        prev.map((p) => (p.id === item.id ? { ...p, status: 'error' } : p)),
      );
    }
  };

  const removeReplyPhoto = (id: string) => {
    setReplyPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSubmitReply = async () => {
    const text = replyText.trim();
    if (text.length < 3) {
      setReplyError('Ответ должен содержать минимум 3 символа');
      return;
    }

    const hasUploading = replyPhotos.some((p) => p.status === 'uploading');
    if (hasUploading) {
      setReplyError('Дождитесь загрузки всех фотографий ответа');
      return;
    }

    const uploadedUrls = replyPhotos
      .filter((p) => p.status === 'done' && p.url)
      .map((p) => p.url!) // eslint-disable-line @typescript-eslint/no-non-null-assertion
      .slice(0, MAX_REPLY_PHOTOS);

    try {
      setIsSubmittingReply(true);
      setReplyError(null);

      const payload: any = {
        reviewId: review.id,
        replyContent: text,
      };

      if (uploadedUrls.length > 0) {
        payload.replyPhotos = uploadedUrls;
      }

      const res = await fetch('/api/reviews', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        const message =
          (data && (data.error as string)) ||
          'Не удалось отправить ответ на отзыв';
        setReplyError(message);
        return;
      }

      const updated = data.review;
      setLocalReplyContent(updated?.replyContent ?? text);
      setLocalReplyCreatedAt(
        updated?.replyCreatedAt
          ? updated.replyCreatedAt
          : new Date().toISOString(),
      );
      const backendReplyPhotos: string[] | undefined = updated?.replyPhotos;
      setLocalReplyPhotos(
        Array.isArray(backendReplyPhotos) && backendReplyPhotos.length > 0
          ? backendReplyPhotos
          : uploadedUrls.length > 0
            ? uploadedUrls
            : null,
      );
      setReplyPhotos([]);
      setIsReplying(false);
    } catch (err) {
      setReplyError('Произошла ошибка при отправке ответа. Повторите попытку.');
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const renderStars = (rating: number) => (
    <div className="flex items-center gap-0.5 sm:gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={12}
          className={`sm:w-3.5 sm:h-3.5 ${
            star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
          }`}
        />
      ))}
    </div>
  );

  const getAvatarContent = () => {
    if (review.user.avatar) {
      return (
        <Image
          src={`${review.user.avatar}?tr=w-80`}
          alt={review.user.name || 'Пользователь'}
          width={40}
          height={40}
          className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover"
        />
      );
    }

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

  return (
    <div className="border border-gray-200 rounded-lg p-3 sm:p-4 bg-white">
      <div className="flex items-start gap-2.5 sm:gap-3">
        <div className="flex-1 min-w-0">
          {/* Шапка */}
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
                  <span>Покупатель</span>
                </div>
              </div>
            </div>
            <div className="py-1">{renderStars(review.rating)}</div>
          </div>

          {/* Информация об объявлении и покупке */}
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

          {/* Фото */}
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

          {/* Ответ на отзыв */}
          {hasReply && (
            <div className="mt-3 sm:mt-4">
              <div className="relative pl-3 sm:pl-4 border-l-2 border-violet-100">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-violet-50 text-violet-500">
                    <MessageCircleMore size={13} />
                  </div>
                  <span className="text-[11px] sm:text-xs font-semibold text-neutral-800">
                    Ваш ответ
                  </span>
                  {localReplyCreatedAt && (
                    <span className="text-[10px] sm:text-[11px] text-gray-400">
                      {new Date(localReplyCreatedAt).toLocaleDateString(
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
                  {(localReplyContent ?? review.replyContent)?.trim()}
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
                {/* Фото в ответе */}
                {(() => {
                  const photosToShow =
                    localReplyPhotos ??
                    (Array.isArray(review.replyPhotos)
                      ? review.replyPhotos
                      : []);
                  if (!photosToShow || photosToShow.length === 0) {
                    return null;
                  }
                  return (
                    <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2">
                      {photosToShow
                        .slice(0, MAX_REPLY_PHOTOS)
                        .map((photo, idx) => (
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
                  );
                })()}
              </div>
            </div>
          )}

          {/* Форма ответа на отзыв */}
          {!hasReply && isReplying && (
            <div className="mt-3 sm:mt-4">
              <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-2.5 sm:p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-violet-50 text-violet-500">
                    <MessageCircleMore size={13} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] sm:text-xs font-semibold text-gray-800">
                      Напишите ответ на отзыв
                    </span>
                    <span className="text-[10px] sm:text-[11px] text-gray-500">
                      Ответ увидит автор отзыва и другие пользователи.
                    </span>
                  </div>
                </div>

                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={3}
                  maxLength={1000}
                  className="w-full resize-none rounded-lg bg-white px-2.5 py-2 text-xs sm:text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none ring ring-gray-200 focus:ring-violet-500/50 focus:ring-2 transition custom-scrollbar-2 scrollbar-small"
                  placeholder="Например: спасибо за отзыв! Нам очень приятно 🙂"
                />

                {/* Фото для ответа */}
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] sm:text-[11px] text-gray-500">
                      Фотографии к ответу (до {MAX_REPLY_PHOTOS})
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {replyPhotos.map((p) => (
                      <div
                        key={p.id}
                        className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden border border-gray-200 bg-gray-50"
                      >
                        {p.previewUrl || p.url ? (
                          <img
                            src={p.previewUrl || `${p.url}?tr=w-140`}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[9px] text-gray-400">
                            {p.status === 'uploading' ? '...' : ''}
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => removeReplyPhoto(p.id)}
                          className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px]"
                        >
                          ✕
                        </button>
                        {p.status === 'uploading' && (
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          </div>
                        )}
                        {p.status === 'error' && (
                          <div className="absolute inset-0 bg-red-500/60 flex items-center justify-center text-[9px] text-white">
                            Ошибка
                          </div>
                        )}
                      </div>
                    ))}

                    {replyPhotos.length < MAX_REPLY_PHOTOS && (
                      <label className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-violet-400 transition-colors">
                        <Camera size={14} className="text-gray-400" />
                        <span className="text-[9px] text-gray-400 mt-0.5">
                          Фото
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={handleReplyFileSelect}
                        />
                      </label>
                    )}
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="text-[10px] sm:text-[11px] text-gray-400">
                    Осталось {1000 - replyText.length} символов
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleCancelReply}
                      disabled={isSubmittingReply}
                      className="px-2.5 py-1.5 text-[11px] sm:text-xs text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                    >
                      Отменить
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmitReply}
                      disabled={isSubmittingReply}
                      className="px-3.5 py-1.5 text-[11px] sm:text-xs font-semibold rounded-lg bg-violet-500 text-white hover:bg-violet-600 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm transition-colors"
                    >
                      {isSubmittingReply ? 'Отправка...' : 'Отправить ответ'}
                    </button>
                  </div>
                </div>

                {replyError && (
                  <div className="mt-1 text-[10px] sm:text-[11px] text-red-500">
                    {replyError}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Меню с 3 точками */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 bg-gray-100 rounded-lg transition-colors"
          >
            <MoreVertical size={16} />
          </button>
          {/* Выпадающее меню с анимацией */}
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                className="absolute right-0 top-full mt-1 w-52 sm:w-60 bg-white border border-gray-200 rounded-lg shadow-lg z-50 pointer-events-auto"
                initial={{ opacity: 0, scale: 0.8, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -5 }}
                transition={{
                  duration: 0.15,
                  ease: 'easeOut',
                }}
              >
                <div className="py-1">
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-left text-xs sm:text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    onClick={handleStartReply}
                  >
                    <MessageCircleMore
                      size={12}
                      className="sm:w-[14px] sm:h-[14px]"
                    />
                    Написать ответ под отзывом
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
