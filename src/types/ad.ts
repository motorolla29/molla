export type CategoryKey = 'goods' | 'services' | 'realestate' | 'auto';

export type Currency = 'RUB' | 'USD' | 'EUR' | undefined;

export type ContactType = 'phone' | 'email';

export interface Seller {
  id: number;
  avatar: string | null;
  name: string;
  rating: number; // 0–5
  contact: {
    phone?: string;
    email?: string;
  };
}

export interface Location {
  lat: number | null;
  lng: number | null;
}

export interface AdBase {
  id: string;
  category: CategoryKey;
  title: string;
  description: string | null;
  city: string; // человекочитаемое название, например "Санкт-Петербург"
  cityLabel: string; // метка для URL, например "saint_petersburg"
  address: string | null;
  location: {
    lat: number | null;
    lng: number | null;
  };
  price?: number;
  currency?: Currency;
  datePosted: string; // ISO-строка, например "2025-05-28T11:00:00Z"
  photos: string[]; // массив URL или имён файлов
  seller: Seller;
  details: string | null;
  status?: 'active' | 'archived';
  showPhone?: boolean;
  showEmail?: boolean;
  // Просмотры и избранное
  viewCount?: number; // общее количество просмотров (вычисляется из userViews.length)
  viewsToday?: number; // просмотры сегодня (вычисляется из userViews с фильтром по дате)
  favoritesCount?: number; // количество добавлений в избранное (вычисляется из favorites.length)
  isFavorite?: boolean; // добавлено ли текущим пользователем в избранное
}

// Интерфейс для отображения объявлений в списке "Мои объявления"
export interface MyAdsListItem {
  id: string;
  title: string;
  city: string;
  cityLabel: string;
  category: CategoryKey;
  price: number | null;
  currency: string | null;
  datePosted: string;
  photos: string[];
  status: 'active' | 'archived';
  viewCount?: number; // вычисляется из userViews.length
  viewsToday?: number; // вычисляется из userViews с фильтром по дате
  favoritesCount?: number; // вычисляется из favorites.length
}
