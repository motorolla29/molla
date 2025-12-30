/**
 * Утилиты для блокировки скролла с компенсацией ширины полосы прокрутки
 */

let scrollbarWidth: number = 0;
let originalOverflow: string = '';
let originalPaddingRight: string = '';

/**
 * Вычисляет ширину полосы прокрутки
 */
function getScrollbarWidth(): number {
  if (scrollbarWidth !== 0) return scrollbarWidth;

  const scrollDiv = document.createElement('div');
  scrollDiv.style.width = '100px';
  scrollDiv.style.height = '100px';
  scrollDiv.style.overflow = 'scroll';
  scrollDiv.style.position = 'absolute';
  scrollDiv.style.top = '-9999px';

  document.body.appendChild(scrollDiv);
  scrollbarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth;
  document.body.removeChild(scrollDiv);

  return scrollbarWidth;
}

/**
 * Блокирует скролл с компенсацией ширины полосы прокрутки
 */
export function lockScroll(): void {
  if (typeof document === 'undefined') return;

  originalOverflow = document.body.style.overflow || '';
  originalPaddingRight = document.body.style.paddingRight || '';

  const width = getScrollbarWidth();

  document.body.style.overflow = 'hidden';
  if (width > 0) {
    document.body.style.paddingRight = `${width}px`;
  }
}

/**
 * Разблокирует скролл и восстанавливает исходное состояние
 */
export function unlockScroll(): void {
  if (typeof document === 'undefined') return;

  document.body.style.overflow = originalOverflow;
  document.body.style.paddingRight = originalPaddingRight;
}
