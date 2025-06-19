export type CategoryKey = 'goods' | 'services' | 'realestate' | 'auto';

export type Currency = 'RUB' | 'USD' | 'EUR';

export type ContactType = 'phone' | 'email' | 'chat';

export interface Seller {
  id: string;
  name: string;
  rating: number; // 0–5
  contact: {
    type: ContactType;
    value: string;
  };
}

export interface Location {
  lat: number;
  lng: number;
}

export interface AdBase {
  id: string;
  category: CategoryKey;
  title: string;
  description: string;
  city: string; // человекочитаемое название, например "Санкт-Петербург"
  cityLabel: string; // метка для URL, например "saint_petersburg"
  address: string;
  location: Location;
  price?: number;
  currency?: Currency;
  datePosted: string; // ISO-строка, например "2025-05-28T11:00:00Z"
  photos: string[]; // массив URL или имён файлов
  seller: Seller;
  details: string;
}
