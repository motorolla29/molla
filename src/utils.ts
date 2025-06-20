import { Currency } from './types/ad';
import { CityRaw } from './types/city-raw';

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
