import { useCallback } from 'react';
import { HeartIcon as SolidHeartIcon } from '@heroicons/react/24/solid';
import { HeartIcon as OutlineHeartIcon } from '@heroicons/react/24/outline';
import { AdBase } from '@/types/ad';
import { useFavoritesStore } from '@/store/useFavoritesStore';

interface FavoriteButtonProps {
  ad: AdBase;
  className?: string;
}

export default function FavoriteButton({ ad, className }: FavoriteButtonProps) {
  // Используем селектор для конкретного объявления
  const isFavorite = useFavoritesStore((state) => state.favoriteIds.has(ad.id));
  const addFavorite = useFavoritesStore((state) => state.addFavorite);
  const removeFavorite = useFavoritesStore((state) => state.removeFavorite);

  const handleClick = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      try {
        if (isFavorite) {
          await removeFavorite(ad.id);
        } else {
          await addFavorite(ad);
        }
      } catch (error) {
        console.error('Ошибка при работе с избранным:', error);
      }
    },
    [isFavorite, addFavorite, removeFavorite, ad]
  );

  return (
    <button
      onClick={handleClick}
      className={`p-1 hover:bg-black/8 rounded-md transition-colors ${
        className || ''
      }`}
      aria-label={isFavorite ? 'Удалить из избранного' : 'Добавить в избранное'}
    >
      {isFavorite ? (
        <SolidHeartIcon className="w-6 h-6 text-violet-400" />
      ) : (
        <OutlineHeartIcon className="w-6 h-6 text-gray-600 fill-white/50 stroke-2" />
      )}
    </button>
  );
}
