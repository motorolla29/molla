import { CategoryKey } from '@/types/ad';

export const categoryOptions: { key: CategoryKey; label: string }[] = [
  { key: 'goods', label: 'Товары' },
  { key: 'services', label: 'Услуги' },
  { key: 'realestate', label: 'Недвижимость' },
  { key: 'auto', label: 'Авто' },
];

export function getCategoryLabelByKey(key: string): string | undefined {
  const category = categoryOptions.find((cat) => cat.key === key);
  return category?.label;
}

export const DEFAULT_CITY = 'Москва';
export const DEFAULT_CITY_PREPOSITION = 'Москвe';
export const DEFAULT_CITY_LABEL = 'moscow';
export const DEFAULT_LAT = 55.7540471;
export const DEFAULT_LON = 37.620405;

// Цвета для аватаров по умолчанию - яркие насыщенные цвета для хорошей видимости белого текста
export const AVATAR_DEFAULT_COLORS = [
  '#FF6B6B', '#FF8E53', '#FF9F43', '#FFE066', '#A8E6CF', '#DCEDC1', '#FFD3A5', '#FFAAA5',
  '#FF8B94', '#FF6B9D', '#C06C84', '#6C5B7B', '#355C7D', '#2E8B57', '#32CD32', '#00FA9A',
  '#5F9EA0', '#1E90FF', '#4169E1', '#8A2BE2', '#9932CC', '#FF1493', '#FF69B4', '#DC143C',
  '#B22222', '#FF4500', '#FF6347', '#FFA500', '#FFD700', '#ADFF2F', '#7FFF00', '#00FF7F',
  '#20B2AA', '#48D1CC', '#40E0D0', '#00BFFF', '#87CEEB', '#4682B4', '#6495ED', '#7B68EE',
  '#9370DB', '#BA55D3', '#DA70D6', '#FF00FF', '#C71585', '#DB7093', '#F08080', '#FA8072',
  '#FFA07A', '#FF7F50', '#FF8C00', '#F0E68C', '#EEE8AA', '#98FB98', '#90EE90', '#87CEFA',
  '#0000FF', '#4B0082', '#9400D3', '#8B008B', '#FF0000', '#FFFF00', '#00FF00', '#228B22',
  '#006400', '#00FFFF', '#B0C4DE', '#778899', '#708090', '#2F4F4F', '#556B2F', '#8FBC8F',
  '#0000CD', '#00008B', '#CD5C5C', '#F4A460', '#D2691E', '#BC8F8F', '#DDA0DD', '#98FB98',
  '#F5DEB3', '#DEB887', '#F4A460', '#D2B48C', '#BC8F8F', '#F0E68C', '#DDA0DD', '#98FB98',
  '#AFEEEE', '#F0FFFF', '#E0FFFF', '#B0E0E6', '#87CEFA', '#4682B4', '#708090', '#778899',
  '#B0C4DE', '#87CEEB', '#00BFFF', '#1E90FF', '#4169E1', '#0000CD', '#00008B', '#8A2BE2',
  '#4B0082', '#9400D3', '#9932CC', '#8B008B', '#C71585', '#DC143C', '#B22222', '#FF0000',
  '#FF4500', '#FF6347', '#FF7F50', '#FF8C00', '#FFA500', '#FFD700', '#FFFF00', '#ADFF2F',
  '#7FFF00', '#00FF00', '#32CD32', '#228B22', '#006400', '#00FFFF', '#00CED1', '#5F9EA0'
];
