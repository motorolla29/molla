import CardSkeleton from './card-skeleton';

export default function LoadingSkeleton() {
  return (
    <div className="sm:px-6 lg:px-8">
      {/* Заголовок для мобильных */}
      <div className="mb-4 lg:mb-0">
        <div className="flex items-center lg:hidden">
          <div className="h-7 bg-gray-200 rounded w-44 animate-pulse"></div>
        </div>
      </div>

      {/* Кнопка создания и счетчик */}
      <div className="flex items-center justify-between mb-6">
        <div className="h-9 bg-gray-200 rounded-lg w-full lg:w-48 animate-pulse"></div>
        <div className="hidden lg:block h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
      </div>

      {/* Переключатель статуса */}
      <div className="flex border-b border-gray-200 mb-6">
        <div className="relative pl-4 py-2">
          <div className="h-5 bg-gray-200 rounded w-20 animate-pulse"></div>
        </div>
        <div className="relative ml-6 pl-4 py-2">
          <div className="h-5 bg-gray-200 rounded w-16 animate-pulse"></div>
        </div>
      </div>

      {/* Список объявлений */}
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
