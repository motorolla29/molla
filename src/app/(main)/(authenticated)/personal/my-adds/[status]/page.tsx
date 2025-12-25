'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import LoadingSkeleton from './components/loading-skeleton';
import Tabs from './components/tabs';
import AdsList from './components/ads-list';

interface Ad {
  id: string;
  title: string;
  price: number | null;
  currency: string | null;
  datePosted: string;
  city: string;
  cityLabel: string;
  category: string;
  photos: string[];
  status: 'active' | 'archived';
}

export default function MyAddsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [allAds, setAllAds] = useState<Ad[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSwitching, setIsSwitching] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [openPopup, setOpenPopup] = useState<string | null>(null);

  // Получаем статус из URL
  const status = params.status as 'active' | 'archived' | undefined;

  // Проверяем валидность статуса и перенаправляем если нужно
  useEffect(() => {
    if (status && !['active', 'archived'].includes(status)) {
      router.replace('/personal/my-adds/active');
      return;
    }
    // Синхронизируем состояние таба с URL
    if (status) {
      // Если статус изменился, активируем переключение
      if (status !== activeTab) {
        setIsSwitching(true);
      }
      setActiveTab(status);
    } else {
      // Если статус не указан, перенаправляем на active
      router.replace('/personal/my-adds/active');
    }
  }, [status, router]);

  // Обновляем данные при переключении табов
  useEffect(() => {
    if (isSwitching) {
      loadAllAds();
    }
  }, [isSwitching]);

  // Вычисляем счетчики на основе всех объявлений
  const activeCount = allAds.filter((ad) => ad.status === 'active').length;
  const archivedCount = allAds.filter((ad) => ad.status === 'archived').length;

  // Общий счетчик всех объявлений
  const totalAdsCount = allAds.length;

  // Фильтруем объявления для текущего таба
  const ads = allAds.filter((ad) => ad.status === activeTab);

  // Загрузка всех объявлений пользователя
  const loadAllAds = async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setIsLoading(true);
      }
      const response = await fetch('/api/user/ads?status=all');
      const data = await response.json();

      if (data.success) {
        setAllAds(data.ads);
      } else {
        console.error('Failed to load ads:', data.error);
        setAllAds([]);
      }
    } catch (error) {
      console.error('Error loading ads:', error);
      setAllAds([]);
    } finally {
      if (isInitialLoad) {
        setIsLoading(false);
      } else {
        // При переключении табов сбрасываем состояние после загрузки данных
        setIsSwitching(false);
      }
    }
  };

  useEffect(() => {
    loadAllAds(true); // Начальная загрузка
  }, []);

  // Закрытие попапа при клике вне
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (openPopup && !(event.target as Element).closest('[data-popup]')) {
        setOpenPopup(null);
      }
    }

    if (openPopup) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [openPopup]);

  // Функция для удаления объявления
  const deleteAd = async (adId: string) => {
    try {
      const response = await fetch(`/api/user/ads/${adId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Перезагружаем все объявления
        await loadAllAds();
      } else {
        console.error('Failed to delete ad');
      }
    } catch (error) {
      console.error('Error deleting ad:', error);
    }
  };

  // Функция для изменения статуса объявления
  const toggleAdStatus = async (
    adId: string,
    currentStatus: 'active' | 'archived'
  ) => {
    const newStatus = currentStatus === 'active' ? 'archived' : 'active';

    try {
      setIsUpdating(adId);
      const response = await fetch('/api/user/ads', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adId,
          status: newStatus,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setAllAds((prevAds) =>
          prevAds.map((ad) =>
            ad.id === adId ? { ...ad, status: newStatus } : ad
          )
        );
      } else {
        console.error('Failed to update ad status:', data.error);
      }
    } catch (error) {
      console.error('Error updating ad status:', error);
    } finally {
      setIsUpdating(null);
    }
  };

  if (!user) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatPrice = (price: number | null, currency: string | null) => {
    if (!price) return 'Цена не указана';
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: currency === 'RUB' ? 'RUB' : 'USD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleEdit = (adId: string) => {
    window.location.href = `/ad/edit/${adId}`;
  };

  const handleToggleStatus = (adId: string, status: 'active' | 'archived') => {
    toggleAdStatus(adId, status);
  };

  const handleDelete = (adId: string) => {
    deleteAd(adId);
  };

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="sm:px-6 lg:px-8">
      {/* Заголовок для мобильных */}
      <div className="mb-4 lg:mb-0">
        <h1 className="flex items-center justify-between text-xl sm:text-2xl w-fit font-medium mb-4 lg:hidden">
          <span>Мои объявления</span>
          <span className="text-xs sm:text-sm font-bold text-neutral-500 ml-2">
            {totalAdsCount}
          </span>
        </h1>
      </div>

      {/* Кнопка создания и счетчик */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/ad/create"
          className="w-full text-center inline-flex items-center justify-center px-4 py-2 bg-violet-500 text-white text-sm font-medium rounded-lg hover:bg-violet-600 active:bg-violet-700 transition-colors lg:hidden"
        >
          <Plus size={16} className="mr-2" />
          <span className="whitespace-nowrap">Создать объявление</span>
        </Link>
        <Link
          href="/ad/create"
          className="hidden lg:inline-flex items-center px-4 py-2 bg-violet-500 text-white text-sm font-medium rounded-lg hover:bg-violet-600 active:bg-violet-700 transition-colors"
        >
          <Plus size={16} className="mr-2" />
          Создать объявление
        </Link>

        {/* Счетчик для десктоп в той же строке */}
        <div className="hidden lg:block">
          <p className="text-sm text-gray-600">
            {totalAdsCount > 0
              ? `Всего объявлений: ${totalAdsCount}`
              : 'Нет объявлений'}
          </p>
        </div>
      </div>

      {/* Переключатель статуса */}
      <Tabs
        activeTab={activeTab}
        activeCount={activeCount}
        archivedCount={archivedCount}
        onTabChange={(tab) => {
          setIsSwitching(true);
          setActiveTab(tab);
          if (typeof window !== 'undefined') {
            window.history.replaceState(null, '', `/personal/my-adds/${tab}`);
          }
        }}
      />

      {/* Список объявлений */}
      <AdsList
        isSwitching={isSwitching}
        ads={ads}
        activeTab={activeTab}
        totalAdsCount={totalAdsCount}
        isUpdating={isUpdating}
        openPopup={openPopup}
        onOpenPopup={setOpenPopup}
        onEdit={handleEdit}
        onToggleStatus={handleToggleStatus}
        onDelete={handleDelete}
        formatDate={formatDate}
        formatPrice={formatPrice}
      />
    </div>
  );
}
