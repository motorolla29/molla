export default function UserProfileSkeleton() {
  return (
    <div className="min-h-screen text-neutral-800 py-6 sm:py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="animate-pulse">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            {/* Левый блок */}
            <div className="w-full lg:w-80 lg:shrink-0">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex flex-col items-center text-center mb-6">
                  <div className="w-20 h-20 bg-gray-200 rounded-full mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded w-32 mb-2"></div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <div
                          key={idx}
                          className="w-4 h-4 bg-gray-200 rounded"
                        ></div>
                      ))}
                    </div>
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                  </div>
                  <div className="h-3 bg-gray-200 rounded w-28"></div>
                </div>

                {/* Контакты */}
                <div className="border-t border-gray-100 pt-4">
                  <div className="h-4 bg-gray-200 rounded w-16 mb-3"></div>
                  <div className="space-y-2">
                    <div className="h-8 bg-gray-200 rounded w-full"></div>
                    <div className="h-8 bg-gray-200 rounded w-full"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Правый блок */}
            <div className="flex-1">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                {/* Вкладки */}
                <div className="flex items-center px-6 py-4 border-b border-gray-100">
                  <div className="mx-4 my-2 bg-gray-200 rounded w-20 h-6"></div>
                  <div className="mx-4 my-2 bg-gray-200 rounded w-28 h-6 ml-8"></div>
                </div>

                {/* Контент вкладки */}
                <div className="p-6">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div
                        key={i}
                        className="flex flex-col w-full overflow-hidden h-full min-w-0"
                      >
                        <div className="relative w-full aspect-square mb-2 overflow-hidden rounded-lg bg-gray-200"></div>
                        <div className="flex-1 flex-col min-w-0">
                          <div className="h-4 bg-gray-200 rounded-md w-2/3 mb-1"></div>
                          <div className="h-4 bg-gray-200 rounded-md w-1/3 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded-md w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
