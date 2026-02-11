/**
 * Утилиты для блокировки скролла с компенсацией ширины полосы прокрутки
 */

let scrollbarWidth: number = 0;
let originalOverflow: string = '';
let originalPaddingRight: string = '';
let lockCount: number = 0; // Счетчик активных блокировок

/**
 * Вычисляет ширину полосы прокрутки
 */
export function getScrollbarWidth(): number {
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

  lockCount++;

  // Сохраняем оригинальные значения только при первой блокировке
  if (lockCount === 1) {
    originalOverflow = document.body.style.overflow || '';
    originalPaddingRight = document.body.style.paddingRight || '';
  }

  const width = getScrollbarWidth();

  document.body.style.overflow = 'hidden';
  if (width > 0) {
    document.body.style.paddingRight = `${width}px`;
    // Устанавливаем CSS переменную для компенсации в fixed элементах
    document.documentElement.style.setProperty(
      '--scrollbar-compensation',
      `${width}px`
    );
  }
}

/**
 * Разблокирует скролл и восстанавливает исходное состояние
 */
export function unlockScroll(): void {
  if (typeof document === 'undefined') return;

  lockCount = Math.max(0, lockCount - 1);

  // Восстанавливаем оригинальные значения только когда все блокировки сняты
  if (lockCount === 0) {
    document.body.style.overflow = originalOverflow;
    document.body.style.paddingRight = originalPaddingRight;
    // Сбрасываем CSS переменную
    document.documentElement.style.setProperty('--scrollbar-compensation', '0px');
  }
}

/**
 * Блокирует скролл без компенсации ширины полосы прокрутки
 */
export function lockScrollSimple(): void {
  if (typeof document === 'undefined') return;

  originalOverflow = document.body.style.overflow || '';
  document.body.style.overflow = 'hidden';
}

/**
 * Разблокирует скролл без компенсации
 */
export function unlockScrollSimple(): void {
  if (typeof document === 'undefined') return;

  document.body.style.overflow = originalOverflow;
}
