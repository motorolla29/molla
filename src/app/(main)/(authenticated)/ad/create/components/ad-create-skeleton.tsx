export default function AdCreateSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 text-neutral-800 sm:my-6 sm:rounded-4xl">
      <div className="container mx-auto px-4 py-6 max-w-5xl">
        <div className="animate-pulse">
          {/* Заголовок страницы */}
          <div className="h-8 bg-gray-200 rounded-xl w-2/3 sm:w-80 mb-8"></div>

          <div className="grid grid-cols-1 lg:grid-cols-[2fr,1.4fr] gap-6">
            {/* Левая колонка: основной контент */}
            <div className="space-y-6">
              {/* Фотографии */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5">
                <div className="h-32 bg-gray-200 rounded-lg"></div>
              </div>

              {/* Основные данные */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5 space-y-4">
                {/* Заголовок объявления */}
                <div>
                  <div className="h-3 bg-gray-200 rounded w-48 mb-2"></div>
                  <div className="h-12 bg-gray-200 rounded-lg"></div>
                </div>

                {/* Категория */}
                <div>
                  <div className="h-3 bg-gray-200 rounded w-24 mb-2"></div>
                  <div className="h-12 bg-gray-200 rounded-lg"></div>
                </div>

                {/* Описание */}
                <div>
                  <div className="h-3 bg-gray-200 rounded w-32 mb-2"></div>
                  <div className="h-24 bg-gray-200 rounded-lg"></div>
                </div>

                {/* Детали */}
                <div>
                  <div className="h-3 bg-gray-200 rounded w-28 mb-2"></div>
                  <div className="h-24 bg-gray-200 rounded-lg"></div>
                </div>
              </div>
            </div>

            {/* Правая колонка: локация, цена, контакты */}
            <div className="space-y-6">
              {/* Локация и карта */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5">
                <div className="h-4 bg-gray-200 rounded w-16 mb-3"></div>
                <div className="h-3 bg-gray-200 rounded w-32 mb-2"></div>
                <div className="h-11 bg-gray-200 rounded-lg mb-3"></div>
                <div className="h-3 bg-gray-200 rounded w-40 mb-2"></div>
                <div className="h-11 bg-gray-200 rounded-lg mb-4"></div>
                <div className="h-48 bg-gray-200 rounded-xl"></div>
              </div>

              {/* Цена */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5">
                <div className="h-4 bg-gray-200 rounded w-12 mb-3"></div>
                <div className="h-12 bg-gray-200 rounded-lg"></div>
              </div>

              {/* Контакты */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5">
                <div className="h-4 bg-gray-200 rounded w-20 mb-3"></div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-5 h-5 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded w-16"></div>
                    </div>
                    <div className="w-10 h-5 bg-gray-200 rounded-full"></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-5 h-5 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded w-20"></div>
                    </div>
                    <div className="w-10 h-5 bg-gray-200 rounded-full"></div>
                  </div>
                </div>
              </div>

              {/* Кнопка публикации */}
              <div className="h-12 bg-gray-200 rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
