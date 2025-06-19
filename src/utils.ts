export function getCurrencySymbol(currencyCode) {
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
