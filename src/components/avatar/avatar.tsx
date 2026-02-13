'use client';

import Image from 'next/image';
import { getAvatarColor } from '@/utils';

interface AvatarProps {
  /**
   * Базовый URL аватара (без ?tr=w-XX)
   */
  src?: string | null;
  /**
   * Имя пользователя для alt и первой буквы
   */
  name?: string | null;
  /**
   * ID для вычисления цвета (через getAvatarColor)
   */
  colorId?: number | string | null;
  /**
   * Ширина для ImageKit-трансформации (?tr=w-XX)
   */
  transformWidth?: number;
  /**
   * Tailwind-классы для контейнера (применяются и к <Image>, и к fallback <div>)
   * Например: "w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover"
   */
  className: string;
  /**
   * Размер изображения в пикселях (width/height пропсы для <Image>)
   */
  size: number;
}

/**
 * Универсальный компонент аватара:
 * - если есть src — рисует <Image> (с учётом ?tr=w-XX, если передан transformWidth)
 * - иначе — кружок с первой буквой имени на цветном фоне
 */
export function Avatar({
  src,
  name,
  colorId,
  transformWidth,
  className,
  size,
}: AvatarProps) {
  const hasAvatar = Boolean(src);
  const alt = name || 'Пользователь';
  const initial = (name || 'П').charAt(0).toUpperCase();

  const backgroundColor =
    colorId !== undefined && colorId !== null
      ? getAvatarColor(colorId)
      : '#8E51FF';

  const finalSrc =
    src && transformWidth ? `${src}?tr=w-${transformWidth}` : src || undefined;

  if (hasAvatar && finalSrc) {
    return (
      <Image
        src={finalSrc}
        alt={alt}
        width={size}
        height={size}
        className={className}
      />
    );
  }

  return (
    <div className={className} style={{ backgroundColor }}>
      {initial}
    </div>
  );
}
