'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/components/toast/toast-context';
import { CategoryKey, Currency } from '@/types/ad';
import AdPhotoUploader from '@/components/ad-photo-uploader/ad-photo-uploader';
import AdLocationSelector, {
  AdLocationValue,
} from '@/components/ad-location-selector/ad-location-selector';
import AdContactsSelector from '@/components/ad-contacts-selector/ad-contacts-selector';
import AdCategorySelector from '@/components/ad-category-selector/ad-category-selector';
import AdCurrencySelector from '@/components/ad-currency-selector/ad-currency-selector';
import AdEditSkeleton from './components/ad-edit-skeleton';

export default function AdEditPage() {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const { user, isAuthChecking } = useAuthStore();
  const toast = useToast();

  // params может быть асинхронным в Next.js 13+
  const adId = (params as any)?.adId as string;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [details, setDetails] = useState('');
  const [category, setCategory] = useState<CategoryKey | ''>('');
  const [price, setPrice] = useState<string>('');
  const [currency, setCurrency] = useState<Currency>('RUB');

  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [location, setLocation] = useState<AdLocationValue>({
    cityName: '',
    cityLabel: '',
    cityNamePreposition: null,
    address: '',
    lat: null,
    lng: null,
  });

  const [contacts, setContacts] = useState<{
    showPhone: boolean;
    showEmail: boolean;
  }>({
    showPhone: !!user?.phone, // true только если телефон указан
    showEmail: !!user?.email, // true только если email указан
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);

  const [validationErrors, setValidationErrors] = useState<{
    [key: string]: string;
  }>({});

  // Мемоизируем adId чтобы избежать бесконечных ререндеров
  const finalAdId = useMemo(() => {
    const adIdFromParams = (params as any)?.adId as string;
    const adIdFromPath = pathname?.split('/').pop();
    return adIdFromParams || adIdFromPath;
  }, [params, pathname]);

  const clearValidationError = useCallback((fieldName: string) => {
    setValidationErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  }, []);

  const handleCategoryChange = (newCategory: CategoryKey | '') => {
    setCategory(newCategory);
    clearValidationError('category');
  };

  const handleContactsChange = useCallback(
    (newContacts: { showPhone: boolean; showEmail: boolean }) => {
      setContacts(newContacts);
      clearValidationError('contacts');
    },
    [clearValidationError]
  );

  const handlePhotoUploadStatusChange = useCallback((isUploading: boolean) => {
    setIsUploadingPhotos(isUploading);
  }, []);

  // Загрузка данных объявления
  useEffect(() => {
    if (!finalAdId || !user || dataLoaded) return;

    const loadAd = async () => {
      try {
        const res = await fetch(`/api/ads/${finalAdId}`);
        if (!res.ok) {
          throw new Error('Не удалось загрузить объявление');
        }

        const ad = await res.json();

        // Проверяем, что пользователь является владельцем объявления
        const adSellerId = ad.seller?.id || ad.sellerId;
        const userId = Number(user.id);

        if (!adSellerId || adSellerId !== userId) {
          setError(`Вы не являетесь владельцем этого объявления.`);
          setIsLoading(false);
          return;
        }

        // Заполняем форму данными
        setTitle(ad.title || '');
        setDescription(ad.description || '');
        setDetails(ad.details || '');
        setCategory((ad.category || '').toLowerCase());
        setCurrency(ad.currency || 'RUB');

        // Форматируем цену с пробелами
        const formattedPrice = ad.price
          ? ad.price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
          : '';
        setPrice(formattedPrice);

        setPhotoUrls(ad.photos || []);
        setLocation({
          cityName: ad.city || '',
          cityLabel: ad.cityLabel || '',
          cityNamePreposition: null,
          address: ad.address || '',
          lat: ad.location?.lat || null,
          lng: ad.location?.lng || null,
        });

        setContacts({
          showPhone: ad.showPhone || false,
          showEmail: ad.showEmail || false,
        });

        setDataLoaded(true);
      } catch (err: any) {
        setError(err.message || 'Не удалось загрузить объявление');
      } finally {
        setIsLoading(false);
      }
    };

    loadAd();
  }, [finalAdId, user, dataLoaded, router]);

  // Очистка ошибок происходит при повторной отправке формы

  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    if (title.trim().length < 2) {
      errors.title = 'Заголовок должен содержать минимум 2 символа';
    }

    if (category === '') {
      errors.category = 'Выберите категорию';
    }

    if (price.trim() === '') {
      errors.price = 'Укажите цену';
    }

    // Проверяем контакты
    const hasAvailableContacts = !!(user?.phone || user?.email);
    const hasSelectedContacts = contacts.showPhone || contacts.showEmail;

    if (hasAvailableContacts && !hasSelectedContacts) {
      errors.contacts = 'Выберите хотя бы один способ связи';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    if (!validateForm()) return;

    setIsSubmitting(true);
    setError(null);
    setValidationErrors({});

    try {
      const numericPrice = price
        ? Number(price.replace(/\s+/g, ''))
        : undefined;

      const requestBody = {
        title: title.trim(),
        description: description.trim(),
        category: category.toLowerCase(),
        city: location?.cityName,
        cityLabel: location?.cityLabel,
        address: location?.address.trim(),
        lat: location?.lat,
        lng: location?.lng,
        price: Number.isFinite(numericPrice) ? numericPrice : undefined,
        currency,
        details: details.trim(),
        photos: photoUrls,
        showPhone: contacts.showPhone,
        showEmail: contacts.showEmail,
      };

      const res = await fetch(`/api/ads/${adId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Не удалось обновить объявление');
      }

      toast.show('Объявление обновлено!', {
        type: 'success',
      });

      // Редирект на обновленное объявление
      if (location?.cityLabel) {
        router.push(`/${location.cityLabel}/${category}/${adId}`);
      } else {
        router.push('/');
      }
    } catch (err: any) {
      setError(err.message || 'Не удалось обновить объявление');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Если есть ошибка владения, показываем только ошибку
  if (error && !isLoading && !isAuthChecking) {
    return (
      <div className="min-h-screen bg-gray-50 text-neutral-800 sm:my-6 sm:rounded-4xl">
        <div className="container mx-auto px-4 py-6 max-w-5xl">
          <h1 className="text-xl sm:text-2xl font-semibold mb-6">
            Редактировать объявление
          </h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <div className="text-red-600 text-base sm:text-lg font-medium mb-2">
              Доступ запрещен
            </div>
            <div className="text-red-500 text-sm sm:text-base">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  // Показываем loading пока проверяется авторизация или загружаются данные
  if (isAuthChecking || (!user && !isLoading) || isLoading) {
    return <AdEditSkeleton />;
  }

  // Для отладки - показываем, что страница загружается
  if (!adId) {
    return (
      <div className="min-h-screen bg-gray-50 text-neutral-800 sm:my-6 sm:rounded-4xl">
        <div className="container mx-auto px-4 py-6 max-w-5xl">
          <h1 className="text-xl sm:text-2xl font-semibold mb-6">
            Ошибка: ID объявления не найден
          </h1>
          <p>adId: {adId}</p>
          <p>params: {JSON.stringify(params)}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-neutral-800 sm:my-6 sm:rounded-4xl">
      <div className="container mx-auto px-4 py-6 max-w-5xl">
        <h1 className="text-xl sm:text-2xl font-semibold mb-6 break-all">
          Редактировать объявление{' '}
          {dataLoaded && title ? `(${title})` : `(ID: ${adId})`}
        </h1>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 lg:grid-cols-[2fr,1.4fr] gap-6"
        >
          {/* Левая колонка: основной контент */}
          <div className="space-y-6">
            {/* Фотографии */}
            <AdPhotoUploader
              maxPhotos={10}
              onChange={setPhotoUrls}
              initialUrls={photoUrls}
              onUploadStatusChange={handlePhotoUploadStatusChange}
            />

            {/* Основные данные */}
            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5 space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1">
                  Заголовок объявления *
                </label>
                <input
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    clearValidationError('title');
                  }}
                  placeholder="Например, «Продам Nintendo Switch OLED»"
                  className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm sm:text-base ${
                    validationErrors.title
                      ? 'border-red-500'
                      : 'border-gray-300'
                  }`}
                />
                {validationErrors.title && (
                  <p className="text-xs text-red-500 mt-1">
                    {validationErrors.title}
                  </p>
                )}
              </div>

              <div>
                <AdCategorySelector
                  value={category}
                  onChange={handleCategoryChange}
                  error={!!validationErrors.category}
                />
                {validationErrors.category && (
                  <p className="text-xs text-red-500 mt-1">
                    {validationErrors.category}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1">
                  Описание
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Расскажите подробно о товаре или услуге..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm sm:text-base resize-none"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1">
                  Детали
                </label>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  rows={4}
                  placeholder="Укажите важные характеристики, условия продажи и т.п."
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm sm:text-base resize-none"
                />
              </div>
            </section>
          </div>

          {/* Правая колонка: локация, цена, контакты */}
          <div className="space-y-6">
            {/* Локация и карта */}
            <AdLocationSelector
              profileCity={user?.city ?? null}
              onChange={setLocation}
              initialValue={location}
            />

            {/* Цена */}
            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5 space-y-3">
              <h2 className="text-base sm:text-lg font-semibold">Цена</h2>
              <div className="flex gap-3 items-center mb-0">
                <div className="flex-1">
                  <label className="block text-xs sm:text-sm font-medium mb-1">
                    Стоимость *
                  </label>
                  <input
                    value={price}
                    onChange={(e) => {
                      const rawValue = e.target.value.replace(/[^\d]/g, '');
                      // Форматируем с пробелами для читабельности
                      const formattedValue = rawValue.replace(
                        /\B(?=(\d{3})+(?!\d))/g,
                        ' '
                      );
                      setPrice(formattedValue);
                      clearValidationError('price');
                    }}
                    inputMode="numeric"
                    placeholder="Например, 35 000"
                    className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm sm:text-base ${
                      validationErrors.price
                        ? 'border-red-500'
                        : 'border-gray-300'
                    }`}
                  />
                </div>
                <AdCurrencySelector value={currency} onChange={setCurrency} />
              </div>
              {validationErrors.price && (
                <p className="text-xs text-red-500 mt-1">
                  {validationErrors.price}
                </p>
              )}
            </section>

            {/* Контакты */}
            <div>
              <AdContactsSelector
                onChange={handleContactsChange}
                initialValue={dataLoaded ? contacts : undefined}
              />
              {validationErrors.contacts && (
                <p className="text-xs text-red-500 mt-2">
                  {validationErrors.contacts}
                </p>
              )}
            </div>

            {/* Ошибка и кнопка */}
            {error && (
              <div className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || isUploadingPhotos}
              className="w-full py-3 rounded-xl bg-violet-500 text-white text-sm font-semibold shadow-sm hover:bg-violet-600 disabled:bg-violet-300 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting
                ? 'Сохранение...'
                : isUploadingPhotos
                ? 'Ожидание загрузки фото...'
                : 'Сохранить изменения'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
