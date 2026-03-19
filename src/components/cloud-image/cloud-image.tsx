'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
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
  const [isInView, setIsInView] = useState(false);
  const [target, setTarget] = useState<HTMLImageElement | null>(null);

  // Сбрасываем состояние при изменении src или variant
  useEffect(() => {
    setUseOriginal(false);
    setHasLoaded(false);
    setForceKey((prev) => prev + 1);
    setIsInView(false);
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

  // Ленивая загрузка через IntersectionObserver:
  // начинаем подставлять src только когда изображение попадает во вьюпорт.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isInView) return;

    const node = target;
    if (!node) return;

    if (!('IntersectionObserver' in window)) {
      // Если браузер не поддерживает IO — грузим сразу
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
            break;
          }
        }
      },
      {
        root: null,
        rootMargin: '350px',
        threshold: 0.01,
      },
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [isInView, target]);

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
      const currentSrc = e.currentTarget.currentSrc || '';
      // Плейсхолдер (data:) загружается мгновенно и не должен считаться "готовой" картинкой
      if (!isInView || currentSrc.startsWith('data:image/')) {
        return;
      }
      setHasLoaded(true);
      onLoad?.(e);
    },
    [isInView, onLoad],
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
      ref={setTarget}
      key={imgKey}
      src={
        isInView
          ? displaySrc
          : "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'/%3E"
      }
      alt={alt}
      loading="lazy"
      className={`${className ?? ''} transition-opacity duration-300 ${
        hasLoaded ? 'opacity-100' : 'opacity-0'
      }`}
      onLoad={handleLoad}
      onError={handleError}
    />
  );
}
