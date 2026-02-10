'use client';

import { useState, useEffect, useRef } from 'react';
import { Star, X, Camera, Check, ShoppingBag } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/components/toast/toast-context';
import { lockScroll, unlockScroll } from '@/utils/scroll-lock';

interface SellerAd {
  id: string;
  title: string;
  photos: string[];
}

interface ReviewFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  sellerId: number;
  sellerName: string;
  onReviewCreated?: () => void;
}

interface UploadingPhoto {
  id: string;
  file: File;
  previewUrl?: string;
  url?: string;
  status: 'pending' | 'uploading' | 'done' | 'error';
}

export default function ReviewFormModal({
  isOpen,
  onClose,
  sellerId,
  sellerName,
  onReviewCreated,
}: ReviewFormModalProps) {
  const { isLoggedIn, user } = useAuthStore();
  const toast = useToast();

  const [ads, setAds] = useState<SellerAd[]>([]);
  const [adsLoading, setAdsLoading] = useState(false);
  const [selectedAdId, setSelectedAdId] = useState<string>('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [content, setContent] = useState('');
  const [purchased, setPurchased] = useState<boolean | null>(null);
  const [photos, setPhotos] = useState<UploadingPhoto[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [adDropdownOpen, setAdDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const MAX_PHOTOS = 5;

  // Загружаем объявления продавца
  useEffect(() => {
    if (!isOpen) return;

    const loadAds = async () => {
      setAdsLoading(true);
      try {
        const response = await fetch(
          `/api/users/${sellerId}/ads?status=active&limit=100`
        );
        if (response.ok) {
          const data = await response.json();
          setAds(data.ads || []);
        }
      } catch (err) {
        console.error('Failed to load seller ads:', err);
      } finally {
        setAdsLoading(false);
      }
    };

    loadAds();
  }, [isOpen, sellerId]);

  // Закрытие dropdown при клике вне
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setAdDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Сброс формы при закрытии
  useEffect(() => {
    if (!isOpen) {
      setSelectedAdId('');
      setRating(0);
      setHoverRating(0);
      setContent('');
      setPurchased(null);
      setPhotos([]);
      setAdDropdownOpen(false);
    }
  }, [isOpen]);

  // Блокируем скролл body при открытии модалки
  useEffect(() => {
    if (!isOpen) return;

    lockScroll();

    return () => {
      setTimeout(() => {
        unlockScroll();
      }, 200);
    };
  }, [isOpen]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const remainingSlots = MAX_PHOTOS - photos.length;
    if (remainingSlots <= 0) return;

    const toAdd = files.slice(0, remainingSlots);

    const newItems: UploadingPhoto[] = toAdd.map((file) => ({
      id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
      file,
      status: 'pending',
    }));

    setPhotos((prev) => [...prev, ...newItems]);

    // Создаём preview
    newItems.forEach((item) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPhotos((prev) =>
          prev.map((p) =>
            p.id === item.id
              ? { ...p, previewUrl: ev.target?.result as string }
              : p
          )
        );
      };
      reader.readAsDataURL(item.file);
    });

    // Загружаем на сервер
    newItems.forEach((item) => uploadPhoto(item));

    e.target.value = '';
  };

  const uploadPhoto = async (item: UploadingPhoto) => {
    setPhotos((prev) =>
      prev.map((p) => (p.id === item.id ? { ...p, status: 'uploading' } : p))
    );

    try {
      const formData = new FormData();
      formData.append('file', item.file);
      formData.append('fileName', item.file.name);
      formData.append('folder', '/molla/reviews-photo');

      const res = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');

      const data = await res.json();

      setPhotos((prev) =>
        prev.map((p) =>
          p.id === item.id ? { ...p, status: 'done', url: data.url } : p
        )
      );
    } catch (err) {
      console.error('Photo upload error:', err);
      setPhotos((prev) =>
        prev.map((p) => (p.id === item.id ? { ...p, status: 'error' } : p))
      );
    }
  };

  const removePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSubmit = async () => {
    if (!selectedAdId || !rating || !content.trim() || purchased === null) {
      toast.error('Заполните все обязательные поля');
      return;
    }

    if (content.trim().length < 10) {
      toast.error('Текст отзыва должен содержать минимум 10 символов');
      return;
    }

    // Проверяем, что все фото загружены
    const hasUploading = photos.some((p) => p.status === 'uploading');
    if (hasUploading) {
      toast.error('Дождитесь загрузки всех фотографий');
      return;
    }

    const uploadedUrls = photos
      .filter((p) => p.status === 'done' && p.url)
      .map((p) => p.url!);

    setSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sellerId,
          adId: selectedAdId,
          rating,
          content: content.trim(),
          photos: uploadedUrls,
          purchased,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Не удалось отправить отзыв');
        return;
      }

      toast.success('Отзыв успешно отправлен!');
      onReviewCreated?.();
      onClose();
    } catch (err) {
      toast.error('Ошибка при отправке отзыва');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedAd = ads.find((a) => a.id === selectedAdId);
  const isFormValid =
    selectedAdId && rating > 0 && content.trim().length >= 10 && purchased !== null;

  if (!isOpen) return null;

  // Проверка авторизации
  if (!isLoggedIn || !user) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center">
          <p className="text-gray-700 mb-4">
            Для того чтобы оставить отзыв, необходимо авторизоваться
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600 transition-colors"
          >
            Понятно
          </button>
        </div>
      </div>
    );
  }

  // Проверка: нельзя оставить отзыв самому себе
  if (Number(user.id) === sellerId) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 pb-12 lg:pb-0 px-4">
      <div className="bg-white rounded-2xl w-full max-w-lg h-[80dvh] max-h-fit overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 truncate pr-2">
            Оставить отзыв о {sellerName}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors shrink-0"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-4 sm:space-y-5">
          {/* 1. Выбор объявления */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
              Объявление <span className="text-red-400">*</span>
            </label>
            <div ref={dropdownRef} className="relative">
              <button
                type="button"
                onClick={() => setAdDropdownOpen(!adDropdownOpen)}
                className="w-full flex items-center gap-3 border border-gray-300 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-left text-xs sm:text-sm hover:border-violet-400 transition-colors bg-white"
              >
                {selectedAd ? (
                  <>
                    {selectedAd.photos?.[0] && (
                      <img
                        src={`https://ik.imagekit.io/motorolla29/molla/mock-photos/${selectedAd.photos[0]}?tr=w-80`}
                        alt=""
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg object-cover shrink-0"
                      />
                    )}
                    <span className="truncate flex-1">
                      {selectedAd.title}
                    </span>
                  </>
                ) : (
                  <span className="text-gray-400 flex-1">
                    {adsLoading ? 'Загрузка...' : 'Выберите объявление'}
                  </span>
                )}
                <svg
                  className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${
                    adDropdownOpen ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {adDropdownOpen && (
                <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                  {ads.length === 0 ? (
                    <div className="p-3 sm:p-4 text-xs sm:text-sm text-gray-400 text-center">
                      {adsLoading
                        ? 'Загрузка объявлений...'
                        : 'У продавца нет активных объявлений'}
                    </div>
                  ) : (
                    ads.map((ad) => (
                      <button
                        key={ad.id}
                        type="button"
                        onClick={() => {
                          setSelectedAdId(ad.id);
                          setAdDropdownOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm hover:bg-violet-50 transition-colors text-left ${
                          selectedAdId === ad.id
                            ? 'bg-violet-50 text-violet-700'
                            : 'text-gray-700'
                        }`}
                      >
                        {ad.photos?.[0] ? (
                          <img
                            src={`https://ik.imagekit.io/motorolla29/molla/mock-photos/${ad.photos[0]}?tr=w-80`}
                            alt=""
                            className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gray-100 shrink-0" />
                        )}
                        <span className="truncate flex-1">{ad.title}</span>
                        {selectedAdId === ad.id && (
                          <Check size={16} className="text-violet-500 shrink-0" />
                        )}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 2. Товар куплен? */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
              Вы купили этот товар/воспользовались услугой? <span className="text-red-400">*</span>
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setPurchased(true)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 sm:py-2.5 rounded-xl border text-xs sm:text-sm font-medium transition-colors ${
                  purchased === true
                    ? 'border-green-400 bg-green-50 text-green-700'
                    : 'border-gray-300 text-gray-600 hover:border-gray-400'
                }`}
              >
                <ShoppingBag size={16} />
                Да, купил(а)
              </button>
              <button
                type="button"
                onClick={() => setPurchased(false)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 sm:py-2.5 rounded-xl border text-xs sm:text-sm font-medium transition-colors ${
                  purchased === false
                    ? 'border-orange-400 bg-orange-50 text-orange-700'
                    : 'border-gray-300 text-gray-600 hover:border-gray-400'
                }`}
              >
                <X size={16} />
                Нет
              </button>
            </div>
          </div>

          {/* 3. Оценка звёздами */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
              Оценка <span className="text-red-400">*</span>
            </label>
            <div className="flex items-center gap-0.5 sm:gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  className="p-0.5 transition-transform hover:scale-110"
                >
                  <Star
                    size={28}
                    className={`sm:w-8 sm:h-8 transition-colors ${
                      star <= (hoverRating || rating)
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-1.5 sm:ml-2 text-xs sm:text-sm text-gray-500">
                  {rating === 1
                    ? 'Ужасно'
                    : rating === 2
                    ? 'Плохо'
                    : rating === 3
                    ? 'Нормально'
                    : rating === 4
                    ? 'Хорошо'
                    : 'Отлично'}
                </span>
              )}
            </div>
          </div>

          {/* 4. Текст отзыва */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
              Текст отзыва <span className="text-red-400">*</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Расскажите о вашем опыте (минимум 10 символов)..."
              rows={4}
              className="w-full border border-gray-300 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm resize-none focus:outline-none focus:border-violet-400 transition-colors"
            />
            <div className="text-right text-xs text-gray-400 mt-1">
              {content.trim().length} / мин. 10 символов
            </div>
          </div>

          {/* 5. Фотографии */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
              Фотографии{' '}
              <span className="text-gray-400 font-normal">
                (необязательно, до {MAX_PHOTOS})
              </span>
            </label>

            <div className="flex flex-wrap gap-2 sm:gap-3">
              {photos.map((p) => (
                <div
                  key={p.id}
                  className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-gray-200 bg-gray-50"
                >
                  {p.previewUrl || p.url ? (
                    <img
                      src={p.previewUrl || `${p.url}?tr=w-200`}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400">
                      {p.status === 'uploading' ? '...' : ''}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => removePhoto(p.id)}
                    className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px]"
                  >
                    ✕
                  </button>

                  {p.status === 'uploading' && (
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                  {p.status === 'error' && (
                    <div className="absolute inset-0 bg-red-500/60 flex items-center justify-center text-[10px] text-white">
                      Ошибка
                    </div>
                  )}
                </div>
              ))}

              {photos.length < MAX_PHOTOS && (
                <label className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-violet-400 transition-colors">
                  <Camera size={20} className="text-gray-400" />
                  <span className="text-[10px] text-gray-400 mt-1">Фото</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </label>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-gray-100 sticky bottom-0 bg-white rounded-b-2xl">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2 sm:py-2.5 rounded-xl border border-gray-300 text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Отмена
            </button>
            <button
              onClick={handleSubmit}
              disabled={!isFormValid || submitting}
              className="flex-1 py-2 sm:py-2.5 rounded-xl bg-violet-500 text-white text-xs sm:text-sm font-medium hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Отправка...' : 'Отправить отзыв'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
