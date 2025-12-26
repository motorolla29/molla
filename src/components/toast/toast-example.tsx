// Пример использования тостов (можно удалить после тестирования)

'use client';

import { useToast } from './toast-context';
import { Heart, HeartCrack, CheckCircle, Star } from 'lucide-react';

export default function ToastExample() {
  const toast = useToast();

  const showExamples = () => {
    // Простые тосты
    toast.success('Успешно сохранено!');
    toast.error('Произошла ошибка');
    toast.warning('Внимание!');
    toast.info('Информация');

    // Тосты с кастомными иконками
    setTimeout(() => {
      toast.show('Добавлено в избранное', {
        icon: <Heart className="w-5 h-5 text-pink-500" />,
      });
    }, 1000);

    setTimeout(() => {
      toast.show('Удалено из избранного', {
        icon: <HeartCrack className="w-5 h-5 text-slate-400" />,
      });
    }, 2000);

    setTimeout(() => {
      toast.show('Оценено!', {
        icon: <Star className="w-5 h-5 text-yellow-500" />,
      });
    }, 3000);

    // Тосты с кастомными иконками
    setTimeout(() => {
      toast.show('Готово!', {
        type: 'success',
        icon: <CheckCircle className="w-5 h-5 text-emerald-400" />,
        duration: 2000,
      });
    }, 3000);
  };

  return (
    <button
      onClick={showExamples}
      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
    >
      Показать примеры тостов
    </button>
  );
}
