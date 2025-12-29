import CardSkeleton from './card-skeleton';
import AdCard from './ad-card';
import { MyAdsListItem } from '@/types/ad';

interface AdsListProps {
  isSwitching: boolean;
  ads: MyAdsListItem[];
  activeTab: 'active' | 'archived';
  totalAdsCount: number;
  isUpdating: string | null;
  openPopup: string | null;
  onOpenPopup: (adId: string | null) => void;
  onEdit: (adId: string) => void;
  onToggleStatus: (adId: string, status: 'active' | 'archived') => void;
  onDelete: (adId: string) => void;
  formatDate: (dateString: string) => string;
  formatPrice: (price: number | null, currency: string | null) => string;
}

export default function AdsList({
  isSwitching,
  ads,
  activeTab,
  totalAdsCount,
  isUpdating,
  openPopup,
  onOpenPopup,
  onEdit,
  onToggleStatus,
  onDelete,
  formatDate,
  formatPrice,
}: AdsListProps) {
  if (isSwitching) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (ads.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-10 h-10 sm:w-12 sm:h-12"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
        </div>
        <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
          {activeTab === 'active'
            ? 'Нет активных объявлений'
            : 'Нет объявлений в архиве'}
        </h3>
        <p className="text-gray-600 text-sm sm:text-base">
          {totalAdsCount === 0
            ? 'Создайте первое объявление и начните продавать или обмениваться вещами'
            : `В разделе ${
                activeTab === 'active' ? 'активные' : 'архив'
              } пока нет объявлений`}
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 pb-8 ${openPopup ? 'pointer-events-none' : ''}`}>
      {ads.map((ad) => (
        <AdCard
          key={ad.id}
          ad={ad}
          activeTab={activeTab}
          isUpdating={isUpdating}
          openPopup={openPopup}
          onOpenPopup={onOpenPopup}
          onEdit={onEdit}
          onToggleStatus={onToggleStatus}
          onDelete={onDelete}
          formatDate={formatDate}
          formatPrice={formatPrice}
        />
      ))}
    </div>
  );
}
