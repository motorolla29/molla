'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  getCloudImageVariantUrl,
  type CloudImageVariant,
} from '@/utils/cloud-image';

export interface CloudImageProps extends Omit<
  React.ImgHTMLAttributes<HTMLImageElement>,
  'src'
> {
  /** Полный URL оригинала или ключ объекта (path/file.jpg) */
  src: string;
  /** Какой вариант показывать. При ошибке загрузки подставится оригинал */
  variant?: CloudImageVariant;
}

export function CloudImage({
  src,
  variant = 'orig',
  alt = '',
  className,
  onLoad,
  onError,
  ...rest
}: CloudImageProps) {
  const [useOriginal, setUseOriginal] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [forceKey, setForceKey] = useState(0);

  // Сбрасываем состояние при изменении src или variant
  useEffect(() => {
    setUseOriginal(false);
    setHasLoaded(false);
    setForceKey((prev) => prev + 1);
  }, [src, variant]);

  // Таймаут на случай, когда запрос варианта "висит" в pending и onError не срабатывает
  useEffect(() => {
    // Для orig или уже загруженного/переключенного изображения таймаут не нужен
    if (variant === 'orig' || useOriginal || hasLoaded) return;

    const timeoutId = setTimeout(() => {
      // Если до таймаута так и не загрузилось и мы всё ещё на variant,
      // пробуем переключиться на оригинал
      if (!hasLoaded && !useOriginal) {
        setUseOriginal(true);
        setForceKey((prev) => prev + 1);
      }
    }, 7000); // 7 секунд

    return () => {
      clearTimeout(timeoutId);
    };
  }, [variant, useOriginal, hasLoaded]);

  const handleError = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
      if (variant === 'orig' || useOriginal) {
        onError?.(e);
        return;
      }
      // Переключаемся на оригинал
      setUseOriginal(true);
      setForceKey((prev) => prev + 1);
    },
    [src, variant, useOriginal, onError],
  );

  const handleLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setHasLoaded(true);
    onLoad?.(e);
  },
    [onLoad],
  );

  const displaySrc = getCloudImageVariantUrl(
    src,
    useOriginal ? 'orig' : variant,
  );
  // Используем key для принудительного перерендера при изменении src/variant или переключении на оригинал
  const imgKey = `${src}-${variant}-${useOriginal}-${forceKey}`;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      {...rest}
      key={imgKey}
      src={displaySrc}
      alt={alt}
      className={className}
      onLoad={handleLoad}
      onError={handleError}
    />
  );
}
