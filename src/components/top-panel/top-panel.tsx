import SortDropdown from '../sort-dropdown/sort-dropdown';

export default function TopPanel() {
  return (
    <div>
      {/* Другие элементы панели */}
      <div className="mb-8">
        <SortDropdown />
      </div>
      {/* Используйте sort для запросов или фильтрации */}
    </div>
  );
}
