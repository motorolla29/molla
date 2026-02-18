'use client';

import { getAvatarColor } from '@/utils';
import { CloudImage } from '@/components/cloud-image/cloud-image';
import type { CloudImageVariant } from '@/utils/cloud-image';

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
   * Ширина для варианта (раньше ImageKit ?tr=w-XX): маппится в xs/sm/md
   */
  transformWidth?: number;
  /**
   * Tailwind-классы для контейнера (применяются и к изображению, и к fallback <div>)
   */
  className: string;
  /**
   * Размер изображения в пикселях (для layout)
   */
  size: number;
}

function widthToVariant(w: number): CloudImageVariant {
  if (w <= 80) return 'xs';
  if (w <= 200) return 'sm';
  return 'md';
}

/**
 * Универсальный компонент аватара:
 * - если есть src — рисует CloudImage (вариант по transformWidth: ≤80→xs, ≤200→sm, иначе md)
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
  const initial = (name || 'П').charAt(0).toUpperCase();

  const backgroundColor =
    colorId !== undefined && colorId !== null
      ? getAvatarColor(colorId)
      : '#8E51FF';

  // const finalSrc =
  // src && transformWidth ? `${src}?tr=w-${transformWidth}` : src || undefined;

  //  if (hasAvatar && finalSrc) {
  //    return (
  //      <Image
  //        src={finalSrc}
  //        alt={''}
  //        width={size}
  //        height={size}
  //        className={className}
  //      />
  //    );
  //  }

  const variant = transformWidth ? widthToVariant(transformWidth) : 'orig';

  if (hasAvatar && src) {
    return (
      <CloudImage
        src={src}
        variant={variant}
        alt=""
        className={className}
        width={size}
        height={size}
      />
    );
  }

  return (
    <div className={className} style={{ backgroundColor }}>
      {initial}
    </div>
  );
}
