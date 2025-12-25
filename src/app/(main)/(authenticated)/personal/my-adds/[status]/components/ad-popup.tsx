import { Edit, Archive } from 'lucide-react';

interface Ad {
  id: string;
  status: 'active' | 'archived';
}

interface AdPopupProps {
  ad: Ad;
  activeTab: 'active' | 'archived';
  isUpdating: string | null;
  onEdit: (adId: string) => void;
  onToggleStatus: (adId: string, status: 'active' | 'archived') => void;
  onDelete: (adId: string) => void;
  onClose: () => void;
}

export default function AdPopup({
  ad,
  activeTab,
  isUpdating,
  onEdit,
  onToggleStatus,
  onDelete,
  onClose,
}: AdPopupProps) {
  return (
    <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
      <div className="py-1">
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onEdit(ad.id);
          }}
          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
        >
          <Edit size={12} className="sm:w-[14px] sm:h-[14px]" />
          Редактировать
        </button>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const action =
              ad.status === 'active' ? 'снять с публикации' : 'опубликовать';
            if (confirm(`Вы уверены, что хотите ${action} это объявление?`)) {
              onToggleStatus(ad.id, ad.status);
              onClose();
            }
          }}
          disabled={isUpdating === ad.id}
          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50"
        >
          {isUpdating === ad.id ? (
            <div className="w-3.5 h-3.5 border border-gray-300 border-t-violet-500 rounded-full animate-spin" />
          ) : (
            <Archive size={12} className="sm:w-[14px] sm:h-[14px]" />
          )}
          {ad.status === 'active' ? 'Снять с продажи' : 'Опубликовать'}
        </button>
        {activeTab === 'archived' && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (
                confirm(
                  'Вы уверены, что хотите удалить это объявление? Это действие нельзя отменить.'
                )
              ) {
                onDelete(ad.id);
              }
              onClose();
            }}
            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-[12px] h-[12px] sm:w-[14px] sm:h-[14px] lucide lucide-trash-2"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 6h18"></path>
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
              <line x1="10" x2="10" y1="11" y2="17"></line>
              <line x1="14" x2="14" y1="11" y2="17"></line>
            </svg>
            Удалить
          </button>
        )}
      </div>
    </div>
  );
}
