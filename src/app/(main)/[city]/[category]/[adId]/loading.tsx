export default function LoadingAdPage() {
  return (
    <div className="container mx-auto px-4 py-6 animate-pulse">
      <nav className="text-sm mb-4">
        {/* Простейший скелетон хлебных крошек */}
        <ol className="flex items-center space-x-2">
          <li className="h-4 bg-gray-200 rounded w-16"></li>
          <li>/</li>
          <li className="h-4 bg-gray-200 rounded w-16"></li>
          <li>/</li>
          <li className="h-4 bg-gray-200 rounded w-24"></li>
        </ol>
      </nav>
      <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
            <div className="h-48 bg-gray-200 rounded"></div>
            <div className="h-48 bg-gray-200 rounded"></div>
          </div>
          <div className="space-y-2 mb-4">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
        <aside className="w-full md:w-1/3 flex-shrink-0 space-y-4">
          <div className="p-4 border rounded-md animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-full"></div>
          </div>
          <div className="p-4 border rounded-md animate-pulse">
            <div className="h-5 bg-gray-200 rounded w-1/3 mb-1"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
          </div>
          <div className="p-4 border rounded-md animate-pulse">
            <div className="h-5 bg-gray-200 rounded w-1/3 mb-1"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
          </div>
        </aside>
      </div>
      <section className="mt-8">
        <h2 className="text-xl font-semibold mb-4 animate-pulse">
          <span className="h-6 bg-gray-200 rounded inline-block w-1/3"></span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* можно отрисовать несколько скелетонов карточек */}
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-40 bg-gray-200 rounded animate-pulse"
            ></div>
          ))}
        </div>
      </section>
    </div>
  );
}
