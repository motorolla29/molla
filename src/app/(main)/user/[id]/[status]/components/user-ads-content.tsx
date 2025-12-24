import Link from 'next/link';
import PaginatedAds from '@/components/paginated-ads/paginated-ads';

interface UserAdsContentProps {
  userId: string;
  currentStatus: 'active' | 'archived';
}

export default function UserAdsContent({
  userId,
  currentStatus,
}: UserAdsContentProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
      {/* Вкладки */}
      <div className="flex items-center px-6 py-4 border-b border-gray-100">
        <Link
          href={`/user/${userId}/active`}
          className={`relative px-4 py-2 text-sm sm:text-base font-semibold hover:cursor-pointer border-b-2 border-transparent transition-colors ${
            currentStatus === 'active'
              ? 'border-violet-400 text-violet-700'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Активные
        </Link>
        <Link
          href={`/user/${userId}/archived`}
          className={`relative ml-6 px-4 py-2 text-sm sm:text-base font-semibold hover:cursor-pointer border-b-2 border-transparent transition-colors ${
            currentStatus === 'archived'
              ? 'border-violet-400 text-violet-700'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Завершенные
        </Link>
      </div>

      {/* Контент вкладки */}
      <div className="p-6">
        <PaginatedAds
          userId={userId}
          status={currentStatus}
          showEndMessage={true}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          limit={12}
        />
      </div>
    </div>
  );
}
