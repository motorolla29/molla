import { useEffect } from 'react';
import { LayoutGrid, LayoutList } from 'lucide-react';
import SortDropdown from '../sort-dropdown/sort-dropdown';

interface GalleryTopPanelProps {
  viewType: 'gallery' | 'default';
  setViewType: (type: 'gallery' | 'default') => void;
}

export default function GalleryTopPanel({
  viewType,
  setViewType,
}: GalleryTopPanelProps) {
  // Один раз при монтировании читаем hash и, если нужно, выставляем стартовый вид
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const hashToView: Record<string, 'gallery' | 'default'> = {
      '#gallery': 'gallery',
      '#list': 'default',
    };

    const hash = window.location.hash;
    const mapped = hashToView[hash];
    if (mapped) {
      setViewType(mapped);
    }
  }, [setViewType]);

  const updateHashForView = (next: 'gallery' | 'default') => {
    if (typeof window === 'undefined') return;

    const viewToHash: Record<'gallery' | 'default', string> = {
      gallery: '#gallery',
      default: '#list',
    };

    const url = new URL(window.location.href);
    url.hash = viewToHash[next] ?? '';

    // Меняем только hash, не трогая Next router, чтобы не триггерить повторные запросы
    window.history.replaceState(window.history.state, '', url.toString());
  };

  const handleViewChange = (next: 'gallery' | 'default') => {
    setViewType(next);
    updateHashForView(next);
  };

  return (
    <div>
      {/* Другие элементы панели */}
      <div className="mb-4 flex items-center">
        <div className="flex mr-3">
          <button
            type="button"
            onClick={() => handleViewChange('default')}
            className="mr-2 cursor-pointer"
          >
            <LayoutList
              className={`${
                viewType === 'default'
                  ? 'stroke-neutral-800'
                  : 'stroke-neutral-300'
              }  w-5 h-5 sm:w-6 sm:h-6`}
            />
          </button>
          <button
            type="button"
            onClick={() => handleViewChange('gallery')}
            className="cursor-pointer"
          >
            <LayoutGrid
              className={`${
                viewType === 'gallery'
                  ? 'stroke-neutral-800'
                  : 'stroke-neutral-300'
              } w-5 h-5 sm:w-6 sm:h-6`}
            />
          </button>
        </div>
        <SortDropdown />
      </div>
      {/* Используйте sort для запросов или фильтрации */}
    </div>
  );
}
