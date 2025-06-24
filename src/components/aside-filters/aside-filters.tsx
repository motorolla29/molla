interface AsideFiltersProps {
  minPrice: string;
  setMinPrice: (value: string) => void;
  maxPrice: string;
  setMaxPrice: (value: string) => void;
}

export default function AsideFilters({
  minPrice,
  setMinPrice,
  maxPrice,
  setMaxPrice,
}: AsideFiltersProps) {
  return (
    <aside className="hidden lg:flex w-1/3 h-fit flex-col flex-shrink-0 bg-amber-100 p-4 rounded-xl xl:w-1/4">
      {/* Фильтр по цене */}
      <div className="mb-6">
        <h2 className="text-lg text-stone-800 font-medium mb-2">Цена</h2>
        <div className="flex items-center space-x-2 gap-2">
          <input
            type="number"
            placeholder="От"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="w-1/2 bg-white border border-gray-300 rounded-md p-2"
            min={0}
          />
          <input
            type="number"
            placeholder="До"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="w-1/2 bg-white border border-gray-300 rounded-md p-2"
            min={0}
          />
        </div>
      </div>
      {/* Здесь можно добавить другие фильтры */}
      <button className="text-white bg-violet-400 rounded-md hover:bg-violet-500 w-full h-10">
        Применить
      </button>
      <button className="text-stone-800 bg-stone-200 rounded-md mt-2 w-full h-10">
        Сбросить фильтры
      </button>
    </aside>
  );
}
