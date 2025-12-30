import { Edit, Archive, Trash2, Rocket } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useConfirmationModal } from '@/components/confirmation-modal/confirmation-modal-context';

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
  isOpen?: boolean;
}

export default function AdPopup({
  ad,
  activeTab,
  isUpdating,
  onEdit,
  onToggleStatus,
  onDelete,
  onClose,
  isOpen = true,
}: AdPopupProps) {
  const { confirm } = useConfirmationModal();

  // Варианты анимации для попапа
  const popupVariants = {
    hidden: {
      opacity: 0,
      scale: 0.8,
      y: -10,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
    },
    exit: {
      opacity: 0,
      scale: 0.9,
      y: -5,
    },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="absolute right-0 top-full mt-1 w-38 sm:w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 pointer-events-auto"
          initial={{ opacity: 0, scale: 0.8, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -5 }}
          transition={{
            duration: 0.15,
            ease: 'easeOut',
          }}
        >
          <div className="py-1">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onEdit(ad.id);
              }}
              className="w-full px-4 py-2 text-left text-xs sm:text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <Edit size={12} className="sm:w-[14px] sm:h-[14px]" />
              Редактировать
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const action =
                  ad.status === 'active'
                    ? 'снять с публикации'
                    : 'опубликовать';
                const actionText =
                  ad.status === 'active'
                    ? 'Снять с публикации'
                    : 'Опубликовать объявление';

                confirm(
                  `Вы уверены, что хотите ${action} это объявление?`,
                  () => {
                    onToggleStatus(ad.id, ad.status);
                    onClose();
                  },
                  {
                    title: actionText,
                    icon: ad.status === 'active' ? Archive : Rocket,
                    iconBgColor:
                      ad.status === 'active' ? 'bg-gray-100' : 'bg-green-100',
                    iconColor:
                      ad.status === 'active'
                        ? 'text-gray-500'
                        : 'text-green-500',
                  }
                );
              }}
              disabled={isUpdating === ad.id}
              className="w-full px-4 py-2 text-left text-xs sm:text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50"
            >
              {isUpdating === ad.id ? (
                <div className="w-3.5 h-3.5 border border-gray-300 border-t-violet-500 rounded-full animate-spin" />
              ) : ad.status === 'active' ? (
                <Archive size={12} className="sm:w-[14px] sm:h-[14px]" />
              ) : (
                <Rocket size={12} className="sm:w-[14px] sm:h-[14px]" />
              )}
              {ad.status === 'active' ? 'Снять с продажи' : 'Опубликовать'}
            </button>
            {activeTab === 'archived' && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  confirm(
                    'Вы уверены, что хотите удалить это объявление? Это действие нельзя отменить.',
                    () => {
                      onDelete(ad.id);
                      onClose();
                    },
                    {
                      title: 'Удалить объявление',
                      icon: Trash2,
                      iconBgColor: 'bg-red-100',
                      iconColor: 'text-red-500',
                    }
                  );
                }}
                className="w-full px-4 py-2 text-left text-xs sm:text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
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
        </motion.div>
      )}
    </AnimatePresence>
  );
}
