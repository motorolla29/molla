'use client';

interface ReviewSkeletonProps {
  count?: number;
  showMenuButton?: boolean;
  showSorting?: boolean;
}

export default function ReviewSkeleton({ 
  count = 3, 
  showMenuButton = false,
  showSorting = false
}: ReviewSkeletonProps) {
  return (
    <div className="space-y-4">
      {/* Skeleton для сортировки (если требуется) */}
      {showSorting && (
        <>
          {/* Мобильный селект skeleton */}
          <div className="sm:hidden">
            <div className="w-full h-10 bg-gray-200/50 rounded-xl animate-pulse"></div>
          </div>
          
          {/* Десктопные кнопки-пилюли skeleton */}
          <div className="hidden sm:flex flex-wrap gap-2">
            <div className="w-30 h-8 bg-gray-200/50 rounded-full animate-pulse"/>
            <div className="w-30 h-8 bg-gray-200/50 rounded-full animate-pulse"/>
            <div className="w-46 h-8 bg-gray-200/50 rounded-full animate-pulse"/>
            <div className="w-46 h-8 bg-gray-200/50 rounded-full animate-pulse"/>
          </div>
        </>
      )}
      
      {/* Skeleton для отзывов */}
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i} 
          className="border border-gray-200 rounded-lg p-3 sm:p-4 bg-white animate-pulse"
        >
          <div className="flex items-start gap-2.5 sm:gap-3">
            {/* Содержимое отзыва */}
            <div className="flex-1 min-w-0">
              {/* Шапка: аватар, имя и дата слева, звезды справа */}
              <div className="flex flex-row max-[400px]:flex-col items-start sm:justify-between gap-2 max-[400px]:gap-1 sm:gap-3 mb-2 max-[400px]:mb-1">
                <div className='flex flex-1 items-center gap-3 truncate max-w-full'>
                  <div className='shrink-0'>
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 rounded-full"></div>
                  </div>
                  <div className="flex-col items-center min-w-0">
                    <div className="h-3.5 sm:h-4 bg-gray-200 rounded-md w-24 sm:w-32 max-w-full mb-1"></div>
                    <div className="h-2.5 sm:h-3 bg-gray-200 rounded-md w-32 sm:w-40 max-w-full"></div>
                  </div>
                </div>
                <div className='py-1'>
                  <div className="flex items-center gap-0.5 sm:gap-1">
                    {Array.from({ length: 5 }).map((_, starIdx) => (
                      <div 
                        key={starIdx} 
                        className="w-3 sm:w-3.5 h-3 sm:h-3.5 bg-gray-200 rounded"
                      ></div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Информация об объявлении */}
              <div className="mb-2 sm:mb-3 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <div className="h-4 bg-gray-200 rounded-full w-48 max-w-full"></div>
                <div className="h-4 bg-gray-200 rounded-full w-18"></div>
              </div>

              {/* Текст отзыва */}
              <div className="space-y-2 mb-3">
                <div className="h-3 sm:h-3.5 bg-gray-200 rounded-md w-full"></div>
                <div className="h-3 sm:h-3.5 bg-gray-200 rounded-md w-5/6"></div>
              </div>

              {/* Фото */}
              {/* <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {Array.from({ length: 2 }).map((_, photoIdx) => (
                  <div 
                    key={photoIdx} 
                    className="w-14 h-14 sm:w-16 sm:h-16 bg-gray-200 rounded-lg"
                  ></div>
                ))}
              </div> */}
            </div>

            {/* Кнопка меню (только если требуется) */}
            {showMenuButton && (
              <div className="w-8 h-8 bg-gray-200 rounded-lg shrink-0"></div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}