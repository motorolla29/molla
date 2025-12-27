import { useCallback, useState } from 'react';
import { HeartIcon as SolidHeartIcon } from '@heroicons/react/24/solid';
import { HeartIcon as OutlineHeartIcon } from '@heroicons/react/24/outline';
import { Heart, HeartCrack } from 'lucide-react';
import { AdBase } from '@/types/ad';
import { useFavoritesStore } from '@/store/useFavoritesStore';
import { useToast } from '@/components/toast/toast-context';
import ToastExample from '../toast/toast-example';

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

      try {
        if (newOptimisticState) {
          toast.show('Добавлено в избранное', {
            icon: <Heart className="w-5 h-5 text-pink-500" />,
          });
          await addFavorite(ad);
        } else {
          toast.show('Удалено из избранного', {
            icon: <HeartCrack className="w-5 h-5 text-slate-400" />,
          });
          await removeFavorite(ad.id);
        }
        // Если запрос успешен, оставляем оптимистичное состояние
      } catch (error) {
        // Если запрос провалился, сбрасываем оптимистичное состояние
        setOptimisticFavorite(null);
        toast.error('Ошибка при работе с избранным');
        console.error('Ошибка при работе с избранным:', error);
      }
    },
    [isFavorite, addFavorite, removeFavorite, ad]
  );

  return (
    <button
      onClick={handleClick}
      className={`p-1 sm:hover:bg-black/8 rounded-md transition-colors ${
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
