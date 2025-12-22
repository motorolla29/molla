export default function LoadingAdPage() {
  return (
    <div className="px-4 py-6 space-y-6 animate-pulse">
      {/* Breadcrumbs */}
      <nav className="text-sm mb-4" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-2">
          <li className="h-4 bg-gray-200 rounded w-16"></li>
          <li>›</li>
          <li className="h-4 bg-gray-200 rounded w-16"></li>
          <li>›</li>
          <li className="h-4 bg-gray-200 rounded w-24"></li>
        </ol>
      </nav>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Левая часть */}
        <div className="flex-1 space-y-6 lg:max-w-2xl">
          {/* Заголовок */}
          <div className="h-10 bg-gray-200 rounded w-3/4"></div>

          {/* Слайдер фото */}
          <div className="w-full lg:max-w-2xl">
            {/* Основное изображение: соотношение 4/3 */}
            <div
              className="relative w-full bg-gray-200 rounded-md overflow-hidden"
              style={{ aspectRatio: '4/3' }}
            >
              {/* Можно добавить эффект пульсации внутри */}
            </div>
            {/* Миниатюры: адаптивные размеры */}
            <div className="mt-4 overflow-hidden" ref={null}>
              <div className="pb-2">
                <div className="flex gap-1 xs:gap-2 sm:gap-3">
                  {[...Array(6)].map((_, idx) => (
                    <div
                      key={idx}
                      className="bg-gray-200 rounded-md w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 shrink-0"
                    ></div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Описание */}
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>

          {/* Детали */}
          <div className="space-y-2">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="space-y-1">
              {[...Array(3)].map((_, idx) => (
                <div key={idx} className="h-4 bg-gray-200 rounded w-full"></div>
              ))}
            </div>
          </div>
        </div>

        {/* Правая часть */}
        <aside className="w-full lg:w-1/3 lg:px-8 flex-shrink-0 space-y-4">
          {/* Цена */}
          <div className="p-4 border border-gray-200 rounded-md space-y-2">
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            <div className="h-6 bg-gray-200 rounded w-full"></div>
          </div>
          {/* Продавец */}
          <div className="p-4 border border-amber-300 rounded-md">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="flex items-start space-x-3 mb-2">
              <div className="w-12 h-12 bg-gray-200 rounded-lg shrink-0"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="flex space-x-1">
                  {[...Array(5)].map((_, idx) => (
                    <div
                      key={idx}
                      className="w-4 h-4 bg-gray-200 rounded"
                    ></div>
                  ))}
                  <div className="h-4 bg-gray-200 rounded w-8 ml-2"></div>
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <div className="h-8 bg-gray-200 rounded w-full"></div>
              <div className="h-8 bg-gray-200 rounded w-full"></div>
            </div>
          </div>
          {/* Контактная кнопка */}
          <div className="p-4 border border-gray-200 rounded-md">
            <div className="h-8 bg-gray-200 rounded w-full"></div>
          </div>
          {/* Локация */}
          <div className="p-4 border border-gray-200 rounded-md space-y-2">
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
          </div>
          {/* Дата размещения */}
          <div className="p-4 border border-gray-200 rounded-md space-y-2">
            <div className="h-6 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </aside>
      </div>

      {/* Похожие объявления */}
      <section className="mt-8">
        <h2 className="text-xl font-semibold mb-4">
          <span className="h-6 bg-gray-200 rounded inline-block w-1/3"></span>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {[...Array(3)].map((_, idx) => (
            <div key={idx} className="space-y-2">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
