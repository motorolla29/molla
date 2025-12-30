import Link from 'next/link';
import { MapPin, Calendar, MoreVertical, Eye, Heart } from 'lucide-react';
import AdPopup from './ad-popup';
import { MyAdsListItem } from '@/types/ad';

interface AdCardProps {
  ad: MyAdsListItem;
  activeTab: 'active' | 'archived';
  isUpdating: string | null;
  openPopup: string | null;
  onOpenPopup: (adId: string | null) => void;
  onEdit: (adId: string) => void;
  onToggleStatus: (adId: string, status: 'active' | 'archived') => void;
  onDelete: (adId: string) => void;
  formatDate: (dateString: string) => string;
  formatPrice: (price: number | null, currency: string | null) => string;
}

export default function AdCard({
  ad,
  activeTab,
  isUpdating,
  openPopup,
  onOpenPopup,
  onEdit,
  onToggleStatus,
  onDelete,
  formatDate,
  formatPrice,
}: AdCardProps) {
  return (
    <Link href={`/${ad.cityLabel}/${ad.category}/${ad.id}`} className="block">
      <div className=" transition-colors rounded-lg overflow-visible">
        <div className="flex min-w-0">
          {/* Фото */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 bg-grey-100 flex items-center justify-center rounded-xl overflow-hidden">
            <img
              src={`https://ik.imagekit.io/motorolla29/molla/mock-photos/${
                ad.photos[0] || 'default.jpg'
              }`}
              alt={ad.title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Контент */}
          <div className="bg-neutral-100 sm:hover:bg-neutral-100 sm:sm:bg-transparent rounded-xl flex-1 pl-2 ml-2 min-w-0 overflow-visible">
            <div className="grid grid-cols-[1fr_auto] gap-2">
              {/* Левая колонка - заголовок и мета-информация */}
              <div className="min-w-0 pb-2 overflow-hidden">
                {/* Мобильная версия */}
                <div className="sm:hidden">
                  <div className="mb-1">
                    <h3 className="text-base font-medium text-gray-900 truncate">
                      {ad.title}
                    </h3>
                  </div>
                  <div className="mb-2">
                    <div className="text-base font-semibold text-gray-900">
                      {formatPrice(ad.price, ad.currency)}
                    </div>
                  </div>
                </div>

                {/* Десктоп версия - заголовок в одной строке с ценой и кнопкой */}
                <div className="hidden sm:flex items-center justify-between gap-4 my-1">
                  <h3 className="text-lg font-medium text-gray-900 truncate flex-1 min-w-0">
                    {ad.title}
                  </h3>
                  <div className="text-right px-1 shrink-0">
                    <div className="text-lg font-semibold text-gray-900">
                      {formatPrice(ad.price, ad.currency)}
                    </div>
                  </div>
                </div>

                {/* Мета-информация */}
                <div className="text-xs sm:text-sm text-gray-600 space-y-2">
                  {/* Город и дата в одной строке */}
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                    <div className="flex items-center">
                      <MapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1 shrink-0" />
                      <span className="truncate">{ad.city}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1 shrink-0" />
                      <span className="truncate">
                        {formatDate(ad.datePosted)}
                      </span>
                    </div>
                  </div>

                  {/* Счетчики в одной строке */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center">
                      <Eye className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1 shrink-0" />
                      <span>{ad.viewCount || 0}</span>
                      {ad.viewsToday && ad.viewsToday > 0 ? (
                        <span className="text-green-600 font-medium ml-1">
                          (+{ad.viewsToday})
                        </span>
                      ) : null}
                    </div>
                    <div className="flex items-center">
                      <Heart className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1 shrink-0" />
                      <span>{ad.favoritesCount || 0}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Правая колонка - кнопка действий */}
              <div className="relative shrink-0 h-fit">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onOpenPopup(openPopup === ad.id ? null : ad.id);
                  }}
                  data-popup
                  className="m-1 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 bg-gray-100 rounded-lg transition-colors pointer-events-auto"
                >
                  <MoreVertical size={16} />
                </button>

                {openPopup === ad.id && (
                  <AdPopup
                    ad={ad}
                    activeTab={activeTab}
                    isUpdating={isUpdating}
                    onEdit={onEdit}
                    onToggleStatus={onToggleStatus}
                    onDelete={onDelete}
                    onClose={() => onOpenPopup(null)}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
