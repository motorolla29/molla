export const categoryOptions = [
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
