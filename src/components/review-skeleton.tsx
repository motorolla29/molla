'use client';

interface ReviewSkeletonProps {
  count?: number;
  showMenuButton?: boolean;
}

export default function ReviewSkeleton({ 
  count = 3, 
  showMenuButton = false 
}: ReviewSkeletonProps) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i} 
          className="border border-gray-200 rounded-lg p-3 sm:p-4 bg-white animate-pulse"
        >
          {/* Верхний ряд: аватар, имя, дата, звезды */}
          <div className="flex flex-wrap items-start gap-3 mb-3">
            <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gray-200 rounded-full shrink-0"></div>

                <div className="min-w-0">
                    <div className="h-4 bg-gray-200 rounded w-32 mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-40"></div>
                </div>
            </div>
            
            
            <div className="shrink-0">
              <div className="flex gap-1 flex-wrap">
                {Array.from({ length: 5 }).map((_, starIdx) => (
                  <div 
                    key={starIdx} 
                    className="w-4 h-4 bg-gray-200 rounded"
                  ></div>
                ))}
              </div>
            </div>
          </div>

          {/* Информация об объявлении */}
          <div className="mb-3">
            <div className="h-3 bg-gray-200 rounded w-16 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-full max-w-md mb-2"></div>
            <div className="h-5 bg-gray-200 rounded-full w-24"></div>
          </div>

          {/* Текст отзыва */}
          <div className="space-y-2 mb-3">
            <div className="h-3 bg-gray-200 rounded w-full"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
            <div className="h-3 bg-gray-200 rounded w-4/6"></div>
          </div>

          {/* Фото */}
          <div className="flex flex-wrap gap-2 mb-3">
            {Array.from({ length: 2 }).map((_, photoIdx) => (
              <div 
                key={photoIdx} 
                className="w-16 h-16 bg-gray-200 rounded-lg"
              ></div>
            ))}
          </div>

          {/* Кнопка меню (только если требуется) */}
          {showMenuButton && (
            <div className="flex justify-end">
              <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}