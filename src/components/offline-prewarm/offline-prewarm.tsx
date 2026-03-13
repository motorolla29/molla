'use client';

import { useEffect } from 'react';

// Лёгкий прогрев offline-страницы: один раз запрашиваем /offline,
// чтобы браузер/Next подгрузили HTML и JS-чанк, пока есть сеть.
export default function OfflinePrewarm() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Не блокируем ничего, просто тихо дергаем запрос.
    fetch('/offline', { cache: 'no-store' }).catch(() => {});
  }, []);

  return null;
}

