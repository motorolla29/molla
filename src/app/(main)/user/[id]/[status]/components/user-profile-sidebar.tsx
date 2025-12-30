import { StarIcon as SolidStarIcon } from '@heroicons/react/24/solid';
import { StarIcon as OutlineStarIcon } from '@heroicons/react/24/outline';
import SellerContacts from '@/app/(main)/[city]/[category]/[adId]/components/seller-contacts';

interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  joinDate: string;
  phone?: string;
  email?: string;
}

interface UserProfileSidebarProps {
  user: UserProfile;
  onAvatarClick: () => void;
}

export default function UserProfileSidebar({
  user,
  onAvatarClick,
}: UserProfileSidebarProps) {
  const formatJoinDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      {/* Аватар и основная информация */}
      <div className="flex flex-col items-center text-center mb-6">
        <div
          className={`w-20 h-20 rounded-full overflow-hidden mb-4 ${
            user.avatar ? 'cursor-pointer' : ''
          }`}
          onClick={() => user.avatar && onAvatarClick()}
        >
          <img
            src={`https://ik.imagekit.io/motorolla29/molla/user-avatars/${
              user.avatar ? user.avatar : '765-default-avatar.png'
            }`}
            alt={`Аватар ${user.name}`}
            className="w-full h-full object-cover"
          />
        </div>

        <h2 className="text-lg sm:text-xl font-semibold text-gray-700 mb-2 line-clamp-2">
          {user.name}
        </h2>

        {/* Рейтинг */}
        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center space-x-1">
            {Array.from({ length: 5 }).map((_, idx) => {
              const starPos = idx + 1;
              const fillPercent = Math.min(
                Math.max((user.rating - (starPos - 1)) * 100, 0),
                100
              );
              return (
                <div key={idx} className="relative w-4 h-4">
                  <OutlineStarIcon className="w-4 h-4 text-yellow-400" />
                  {fillPercent > 0 && (
                    <SolidStarIcon
                      className="absolute top-0 left-0 w-4 h-4 text-yellow-400 overflow-hidden"
                      style={{
                        clipPath: `inset(0 ${100 - fillPercent}% 0 0)`,
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
          <span className="text-xs sm:text-sm text-gray-600">
            {user.rating.toFixed(1)} (0 отзывов)
          </span>
        </div>

        {/* Дата регистрации */}
        <div className="text-xs sm:text-sm text-gray-500">
          На Molla с {formatJoinDate(user.joinDate)}
        </div>
      </div>

      {/* Контакты */}
      {(user.phone || user.email) && (
        <div className="border-t border-gray-100 pt-4">
          <h3 className="text-sm sm:text-base font-medium text-gray-900 mb-3">
            Контакты
          </h3>
          <SellerContacts phone={user.phone} email={user.email} />
        </div>
      )}
    </div>
  );
}
