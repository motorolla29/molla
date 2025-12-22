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
  return (
    <div>
      {/* Другие элементы панели */}
      <div className="mb-4 flex items-center">
        <div className="flex mr-3">
          <div
            onClick={() => setViewType('default')}
            className="mr-2 cursor-pointer"
          >
            <LayoutList
              className={`${
                viewType === 'default'
                  ? 'stroke-neutral-800'
                  : 'stroke-neutral-300'
              }  w-5 h-5 sm:w-6 sm:h-6`}
            />
          </div>
          <div
            onClick={() => setViewType('gallery')}
            className="cursor-pointer"
          >
            <LayoutGrid
              className={`${
                viewType === 'gallery'
                  ? 'stroke-neutral-800'
                  : 'stroke-neutral-300'
              } w-5 h-5 sm:w-6 sm:h-6`}
            />
          </div>
        </div>
        <SortDropdown />
      </div>
      {/* Используйте sort для запросов или фильтрации */}
    </div>
  );
}
