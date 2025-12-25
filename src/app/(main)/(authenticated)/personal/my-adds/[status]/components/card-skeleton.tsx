export default function CardSkeleton() {
  return (
    <div className="rounded-lg animate-pulse">
      <div className="flex min-w-0">
        {/* Фото */}
        <div className="w-14 h-14 sm:w-20 sm:h-20 shrink-0 bg-gray-200 rounded-lg"></div>

        {/* Контент */}
        <div className="flex-1 px-4 py-1 min-w-0 ml-1">
          <div className="flex items-start justify-between mb-1">
            <div className="flex-1 min-w-0">
              <div className="h-5.5 bg-gray-200 rounded-md w-2/5 mb-2"></div>
              {/* Цена под титлом только на самых маленьких экранах */}
              <div className="sm:hidden h-4 bg-gray-200 rounded w-20 mb-2"></div>
            </div>
            {/* Цена справа на sm и выше */}
            <div className="hidden sm:block h-5.5 bg-gray-200 rounded-md w-16 ml-2 shrink-0"></div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="h-3.5 bg-gray-200 rounded w-20"></div>
            <div className="h-3.5 bg-gray-200 rounded w-20"></div>
            <div className="h-3.5 bg-gray-200 rounded w-16"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
