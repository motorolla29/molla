'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
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

export default function AddCreatePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const toast = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [details, setDetails] = useState('');
  const [category, setCategory] = useState<CategoryKey | ''>('');
  const [price, setPrice] = useState<string>('');
  const [currency, setCurrency] = useState<Currency>('RUB');

  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [location, setLocation] = useState<AdLocationValue | null>(null);
  const [contacts, setContacts] = useState<{
    showPhone: boolean;
    showEmail: boolean;
  }>({
    showPhone: !!user?.phone, // true только если телефон указан
    showEmail: !!user?.email, // true только если email указан
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [validationErrors, setValidationErrors] = useState<{
    [key: string]: string;
  }>({});

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

      const body = {
        title: title.trim(),
        description: description.trim(),
        category,
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

      const res = await fetch('/api/ads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Не удалось создать объявление');
      }

      toast.show('Объявление опубликовано!', {
        type: 'success',
      });

      // Редирект на страницу активных объявлений пользователя
      router.push('/personal/my-adds/active');
      // Прокрутка страницы вверх
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err: any) {
      setError(err.message || 'Не удалось создать объявление');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-neutral-800 sm:my-6 sm:rounded-4xl">
      <div className="container mx-auto px-4 py-6 max-w-5xl">
        <h1 className="text-xl sm:text-2xl font-semibold mb-6">
          Создать объявление
        </h1>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 lg:grid-cols-[2fr,1.4fr] gap-6"
        >
          {/* Левая колонка: основной контент */}
          <div className="space-y-6">
            {/* Фотографии */}
            <AdPhotoUploader maxPhotos={10} onChange={setPhotoUrls} />

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

          {/* Локация и карта */}
          <AdLocationSelector
            profileCity={user?.city ?? null}
            onChange={setLocation}
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
            <AdContactsSelector onChange={handleContactsChange} />
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
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-violet-500 text-white text-sm font-semibold shadow-sm hover:bg-violet-600 disabled:bg-violet-300 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Публикация...' : 'Опубликовать объявление'}
          </button>
        </form>
      </div>
    </div>
  );
}
