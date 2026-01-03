import { useCallback, useState, useRef } from 'react';
import { HeartIcon as SolidHeartIcon } from '@heroicons/react/24/solid';
import { HeartIcon as OutlineHeartIcon } from '@heroicons/react/24/outline';
import { Heart, HeartCrack } from 'lucide-react';
import { AdBase } from '@/types/ad';
import { useFavoritesStore } from '@/store/useFavoritesStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/components/toast/toast-context';

interface FavoriteButtonProps {
  ad: AdBase;
  className?: string;
  solidIconClassName?: string; // Для кастомных классов заполненного сердца
  outlineIconClassName?: string; // Для кастомных классов пустого сердца
}

export default function FavoriteButton({
  ad,
  className,
  solidIconClassName,
  outlineIconClassName,
}: FavoriteButtonProps) {
  const toast = useToast();
  const { isAuthChecking } = useAuthStore();

  // Используем селектор для конкретного объявления
  const isFavoriteFromStore = useFavoritesStore((state) =>
    state.favoriteIds.has(ad.id)
  );
  const addFavorite = useFavoritesStore((state) => state.addFavorite);
  const removeFavorite = useFavoritesStore((state) => state.removeFavorite);

  // Локальное состояние для оптимистичных обновлений
  const [optimisticFavorite, setOptimisticFavorite] = useState<boolean | null>(
    null
  );

  // Ref для отмены предыдущих запросов
  const abortControllerRef = useRef<AbortController | null>(null);

  // Приоритет: локальное состояние > состояние из store
  const isFavorite =
    optimisticFavorite !== null ? optimisticFavorite : isFavoriteFromStore;

  const handleClick = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Оптимистичное обновление - сразу меняем состояние
      const newOptimisticState = !isFavorite;
      setOptimisticFavorite(newOptimisticState);

      // Отменяем предыдущий запрос если он есть
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Создаем новый AbortController
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      try {
        if (newOptimisticState) {
          toast.show('Добавлено в избранное', {
            icon: <Heart className="w-5 h-5 text-pink-500" />,
          });
          await addFavorite(ad, abortController.signal);
        } else {
          toast.show('Удалено из избранного', {
            icon: <HeartCrack className="w-5 h-5 text-slate-400" />,
          });
          await removeFavorite(ad.id, false, abortController.signal);
        }
        // Если запрос успешен, оставляем оптимистичное состояние
      } catch (error) {
        // Игнорируем отмененные запросы
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }

        // Если запрос провалился, сбрасываем оптимистичное состояние
        setOptimisticFavorite(null);
        toast.error('Ошибка при работе с избранным');
        console.error('Ошибка при работе с избранным:', error);
      } finally {
        // Очищаем ссылку если это был наш последний запрос
        if (abortControllerRef.current === abortController) {
          abortControllerRef.current = null;
        }
      }
    },
    [isFavorite, addFavorite, removeFavorite, ad, toast]
  );

  return (
    <button
      onClick={handleClick}
      disabled={isAuthChecking}
      className={`p-1 sm:hover:bg-black/8 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
        className || ''
      }`}
      aria-label={isFavorite ? 'Удалить из избранного' : 'Добавить в избранное'}
    >
      {isFavorite ? (
        <SolidHeartIcon
          className={solidIconClassName || 'w-6 h-6 text-violet-400'}
        />
      ) : (
        <OutlineHeartIcon
          className={
            outlineIconClassName ||
            'w-6 h-6 text-gray-600 fill-white/50 stroke-2'
          }
        />
      )}
    </button>
  );
}
