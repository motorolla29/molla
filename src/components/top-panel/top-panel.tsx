import SortDropdown from '../sort-dropdown/sort-dropdown';

interface TopPanelProps {
  sort: string;
  setSort: (value: string) => void;
}

export default function TopPanel({ sort, setSort }: TopPanelProps) {
  return (
    <div>
      {/* Другие элементы панели */}
      <div className="mb-8">
        <SortDropdown value={sort} onChange={setSort} />
      </div>
      {/* Используйте sort для запросов или фильтрации */}
    </div>
  );
}
