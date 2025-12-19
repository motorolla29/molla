'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { CategoryKey, Currency } from '@/types/ad';
import { categoryOptions } from '@/const';
import { getCurrencySymbol } from '@/utils';
import AdPhotoUploader from '@/components/ad-photo-uploader/ad-photo-uploader';
import AdLocationSelector, {
  AdLocationValue,
} from '@/components/ad-location-selector/ad-location-selector';
import AdContactsSelector from '@/components/ad-contacts-selector/ad-contacts-selector';
import AdCategorySelector from '@/components/ad-category-selector/ad-category-selector';

export default function AddCreatePage() {
  const router = useRouter();
  const { user } = useAuthStore();

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

  const isFormValid = useMemo(() => {
    // Проверяем, что выбран хотя бы один доступный контакт
    const hasAvailableContacts = !!(user?.phone || user?.email);
    const hasSelectedContacts = contacts.showPhone || contacts.showEmail;

    return (
      title.trim().length >= 5 &&
      description.trim().length >= 10 &&
      details.trim().length >= 10 &&
      category !== '' && // Категория должна быть выбрана
      location?.cityLabel &&
      location?.cityName &&
      location?.lat != null &&
      location?.lng != null &&
      location.address.trim().length >= 5 &&
      photoUrls.length > 0 &&
      (!hasAvailableContacts || hasSelectedContacts) // Если контактов нет, пропускаем проверку
    );
  }, [
    title,
    description,
    details,
    category,
    location,
    photoUrls,
    contacts,
    user,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

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

      const adId = data.id as string;
      // Редирект на созданное объявление
      if (location?.cityLabel) {
        router.push(`/${location.cityLabel}/${category}/${adId}`);
      } else {
        router.push('/');
      }
    } catch (err: any) {
      setError(err.message || 'Не удалось создать объявление');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-neutral-800">
      <div className="container mx-auto px-4 py-6 max-w-5xl">
        <h1 className="text-2xl sm:text-3xl font-semibold mb-6">
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
                <label className="block text-sm font-medium mb-1">
                  Заголовок объявления
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Например, «Продам Nintendo Switch OLED»"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
                />
              </div>

              <AdCategorySelector value={category} onChange={setCategory} />

              <div>
                <label className="block text-sm font-medium mb-1">
                  Описание
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Расскажите подробно о товаре или услуге..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Детали</label>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  rows={4}
                  placeholder="Укажите важные характеристики, условия продажи и т.п."
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm resize-none"
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
            />

            {/* Цена */}
            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5 space-y-3">
              <h2 className="text-lg font-semibold">Цена</h2>
              <div className="flex gap-3 items-center">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">
                    Стоимость
                  </label>
                  <input
                    value={price}
                    onChange={(e) =>
                      setPrice(e.target.value.replace(/[^\d]/g, ''))
                    }
                    inputMode="numeric"
                    placeholder="Например, 35000"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Валюта
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as Currency)}
                    className="px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm bg-white"
                  >
                    <option value="RUB">₽ RUB</option>
                    <option value="USD">$ USD</option>
                    <option value="EUR">€ EUR</option>
                  </select>
                </div>
              </div>
              {price && (
                <p className="text-xs text-gray-500">
                  Вы продаете за {Number(price).toLocaleString('ru-RU')}{' '}
                  {getCurrencySymbol(currency)}
                </p>
              )}
            </section>

            {/* Контакты */}
            <AdContactsSelector onChange={setContacts} />

            {/* Ошибка и кнопка */}
            {error && (
              <div className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className="w-full py-3 rounded-xl bg-violet-500 text-white text-sm font-semibold shadow-sm hover:bg-violet-600 disabled:bg-violet-300 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Публикация...' : 'Опубликовать объявление'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
