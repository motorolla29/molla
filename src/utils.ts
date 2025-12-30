import { Currency, AdBase } from './types/ad';
import { CityRaw } from './types/city-raw';

/**
 * Получить или создать userToken для неавторизованного пользователя
 * Сохраняет токен в localStorage под ключом 'localUserToken'
 * @returns string - userToken
 */
export function getOrCreateUserToken(): string {
  // Проверяем, есть ли уже токен в localStorage
  const existingToken = localStorage.getItem('localUserToken');

  if (existingToken) {
    return existingToken;
  }

  // Генерируем новый токен (32 байта = 64 символа в hex)
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  const newToken = Array.from(array, (byte) =>
    byte.toString(16).padStart(2, '0')
  ).join('');

  // Сохраняем в localStorage
  localStorage.setItem('localUserToken', newToken);

  return newToken;
}

export function getCurrencySymbol(currencyCode: Currency) {
  switch (currencyCode) {
    case 'RUB':
      return '₽';
    case 'EUR':
      return '€';
    case 'USD':
      return '$';
    default:
      return ''; // Можно вернуть сам код валюты, если символ не найден
  }
}

let citiesDataCache: CityRaw[] | null = null;

export async function loadCitiesData(): Promise<CityRaw[]> {
  if (!citiesDataCache) {
    const mod = await import('@/lib/russia-cities.json');
    const data = (mod as any).default ?? (mod as any);
    if (Array.isArray(data)) {
      citiesDataCache = data;
    } else {
      console.error('Ошибка: russia-cities.json не является массивом');
      citiesDataCache = [];
    }
  }
  return citiesDataCache;
}

export async function findCityByNameExact(
  name: string
): Promise<CityRaw | null> {
  const data = await loadCitiesData();
  const term = name.trim().toLowerCase();
  for (const item of data) {
    const nom = item.namecase?.nominative ?? item.name;
    if (!nom) continue;
    if (nom.trim().toLowerCase() === term) {
      if (
        item.label &&
        item.coords &&
        typeof item.coords.lat === 'number' &&
        typeof item.coords.lon === 'number'
      ) {
        return item;
      }
    }
  }
  return null;
}

/**
 * Вычисляет «расстояние по воздуху» между двумя точками (лат, лон) по формуле Haversine.
 */
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371e3; // Earth radius in meters
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lon2 - lon1);
  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // в метрах
}

/**
 * Ищет в JSON город, ближайший к заданным координатам.
 * Если список пуст или нет корректных coords, возвращает null.
 */
export async function findNearestCity(
  lat: number,
  lon: number
): Promise<CityRaw | null> {
  const data = await loadCitiesData();
  let best: CityRaw | null = null;
  let bestDist = Infinity;
  for (const item of data) {
    if (
      item.coords &&
      typeof item.coords.lat === 'number' &&
      typeof item.coords.lon === 'number'
    ) {
      const d = haversineDistance(lat, lon, item.coords.lat, item.coords.lon);
      if (d < bestDist) {
        bestDist = d;
        best = item;
      }
    }
  }
  return best;
}

/**
 * Форматирует дату объявления для отображения (default карточки)
 * @param dateString - ISO строка даты
 * @returns отформатированная строка даты
 */
export function formatAdDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const adDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  // Названия месяцев на русском
  const months = [
    'января',
    'февраля',
    'марта',
    'апреля',
    'мая',
    'июня',
    'июля',
    'августа',
    'сентября',
    'октября',
    'ноября',
    'декабря',
  ];

  if (adDate.getTime() === today.getTime()) {
    return 'Опубликовано сегодня';
  } else if (adDate.getTime() === yesterday.getTime()) {
    return 'Опубликовано вчера';
  } else {
    // Форматируем как "Опубликовано 23 января" или "Опубликовано 23 января 2024"
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    const currentYear = now.getFullYear();

    if (year === currentYear) {
      return `Опубликовано ${day} ${month}`;
    } else {
      return `Опубликовано ${day} ${month} ${year}`;
    }
  }
}

/**
 * Форматирует дату объявления для gallery карточек (без "Опубликовано", с днями назад)
 * @param dateString - ISO строка даты
 * @returns отформатированная строка даты или пустая строка
 */
export function formatAdDateGallery(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const adDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  // Вычисляем разницу в днях
  const diffTime = today.getTime() - adDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Сегодня';
  } else if (diffDays === 1) {
    return 'Вчера';
  } else if (diffDays >= 2 && diffDays <= 7) {
    if (diffDays === 2 || diffDays === 3 || diffDays === 4) {
      return `${diffDays} дня назад`;
    } else {
      return `${diffDays} дней назад`;
    }
  } else {
    // Больше 7 дней - ничего не показываем
    return '';
  }
}

/**
 * Конвертирует Prisma Ad объект в AdBase формат для API
 * @param ad - объект объявления из Prisma
 * @param viewCount - количество просмотров (опционально, если не получается из ad._count)
 * @returns объект в формате AdBase
 */
export function convertToAdBase(ad: any): AdBase {
  return {
    id: ad.id,
    category: ad.category.toLowerCase() as any,
    title: ad.title,
    description: ad.description,
    city: ad.city,
    cityLabel: ad.cityLabel,
    address: ad.address,
    location: {
      lat: ad.lat,
      lng: ad.lng,
    },
    price: ad.price ? Number(ad.price) : undefined,
    currency: (ad.currency as Currency) || undefined,
    datePosted: ad.datePosted.toISOString(),
    photos: ad.photos,
    seller: {
      id: ad.sellerId,
      avatar: ad.seller.avatar,
      name: ad.seller.name,
      rating: ad.seller.rating,
      contact: {
        phone: ad.seller.phone || undefined,
        email: ad.seller.email || undefined,
      },
    },
    details: ad.details,
    status: ad.status,
    showPhone: ad.showPhone,
    showEmail: ad.showEmail,
    viewCount: ad._count?.userViews || 0,
    viewsToday: ad.userViews?.length || 0,
    favoritesCount: ad._count?.favorites || 0,
  };
}

/**
 * Склоняет слово "просмотр" в зависимости от количества
 * @param count - количество просмотров
 * @returns правильно склоненное слово
 */
export function getViewsWord(count: number): string {
  if (count % 10 === 1 && count % 100 !== 11) {
    return 'просмотр';
  }
  if (
    count % 10 >= 2 &&
    count % 10 <= 4 &&
    (count % 100 < 10 || count % 100 >= 20)
  ) {
    return 'просмотра';
  }
  return 'просмотров';
}

export function getFavoritesWord(count: number): string {
  if (count % 10 === 1 && count % 100 !== 11) {
    return 'человек добавил в избранное';
  }
  if (
    count % 10 >= 2 &&
    count % 10 <= 4 &&
    (count % 100 < 10 || count % 100 >= 20)
  ) {
    return 'человека добавили в избранное';
  }
  return 'человек добавили в избранное';
}
