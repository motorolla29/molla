export default function CardSkeleton() {
  return (
    <div className="rounded-lg animate-pulse">
      <div className="flex min-w-0 items-start sm:items-center">
        {/* Фото */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-200/60 shrink-0 flex items-center justify-center rounded-xl overflow-hidden" />

        {/* Контент */}
        <div className="bg-neutral-100 sm:bg-transparent rounded-xl flex-1 pl-2 ml-2 min-w-0 overflow-visible">
          <div className="grid grid-cols-[1fr_auto] gap-5">
            {/* Левая колонка - заголовок и мета-информация */}
            <div className="min-w-0 pb-2 overflow-hidden">
              {/* Мобильная версия: заголовок + цена под ним */}
              <div className="sm:hidden mt-1 mb-1">
                <div className="h-4 bg-gray-200 rounded-md w-3/4 mb-3 sm:mb-2" />
                <div className="h-4 bg-gray-200 rounded-md w-24 max-w-1/2 mb-3 sm:mb-2" />
              </div>

              {/* Десктоп версия - заголовок + цена справа */}
              <div className="hidden sm:flex items-center justify-between gap-4 mt-1 mb-1">
                <div className="h-5 bg-gray-200 rounded-md w-2/3 max-w-85" />
                <div className="h-6 bg-gray-200 rounded-md w-24" />
              </div>

              {/* Мета-информация: город, дата */}
              <div className="mt-1 text-xs sm:text-sm text-gray-600">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 sm:gap-x-4 mb-1">
                  <div className="h-3 sm:h-4 bg-gray-200 rounded-full w-20 max-w-1/2 sm:max-w-1/3 " />
                  <div className="h-3 sm:h-4 bg-gray-200 rounded-full w-24 max-w-1/2 sm:max-w-1/3 " />
                </div>

                {/* Счетчики: просмотры, избранное */}
                <div className="flex items-center gap-3 mt-1">
                  <div className="h-3 sm:h-4 bg-gray-200 rounded-full w-10" />
                  <div className="h-3 sm:h-4 bg-gray-200 rounded-full w-10" />
                </div>
              </div>
            </div>

            {/* Правая колонка - кнопка с тремя точками */}
            <div className="relative shrink-0 h-fit flex items-start justify-end pt-1 pr-1">
              <div className="w-8 h-8 bg-gray-200 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
