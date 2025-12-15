'use client';

import { useState } from 'react';
import { MapPinIcon } from '@heroicons/react/24/outline';
import LocationModal from '../location-modal/location-modal';
import { useLocationStore } from '@/store/useLocationStore';
import { useAuthStore } from '@/store/useAuthStore';
import Link from 'next/link';

export default function HeaderMobile() {
  const { cityName, setLocation } = useLocationStore();
  const { isLoggedIn, user } = useAuthStore();
  const [showLocationModal, setShowLocationModal] = useState(false);

  return (
    <div className="w-full lg:hidden sticky top-0 z-10 bg-neutral-100">
      <div className="container px-4 mx-auto h-10 flex items-center justify-between">
        {/* Левая кнопка: выбор города */}
        <button
          onClick={() => setShowLocationModal(true)}
          className="flex items-center flex-shrink-0 text-neutral-500 hover:opacity-80 cursor-pointer"
        >
          <MapPinIcon className="h-5 w-5 flex-shrink-0" />
          <span className="ml-1 leading-none min-w-0 max-w-[200px] truncate font-light text-md">
            {cityName || 'Город'}
          </span>
        </button>

        {/* Правая часть: уведомления и аватар/вход */}
        <div className="flex items-center flex-shrink-0 gap-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-6 w-6 fill-neutral-500 cursor-pointer hover:opacity-80 flex-shrink-0"
          >
            <path
              fillRule="evenodd"
              d="M5.25 9a6.75 6.75 0 0 1 13.5 0v.75c0 2.123.8 4.057 2.118 5.52a.75.75 0 0 1-.297 1.206c-1.544.57-3.16.99-4.831 1.243a3.75 3.75 0 1 1-7.48 0 24.585 24.585 0 0 1-4.831-1.244.75.75 0 0 1-.298-1.205A8.217 8.217 0 0 0 5.25 9.75V9Zm4.502 8.9a2.25 2.25 0 1 0 4.496 0 25.057 25.057 0 0 1-4.496 0Z"
              clipRule="evenodd"
            />
          </svg>

          {isLoggedIn && user ? (
            <Link href="/profile" className="flex items-center">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-6 h-6 rounded-full object-cover border border-white shadow-sm"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-violet-500 flex items-center justify-center text-white font-semibold text-xs border border-white shadow-sm">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
            </Link>
          ) : (
            <Link
              href="/auth"
              className="text-sm font-medium text-neutral-500 hover:opacity-80"
            >
              Войти
            </Link>
          )}
        </div>
      </div>

      {showLocationModal && (
        <LocationModal
          onClose={() => setShowLocationModal(false)}
          onSelect={(label, nameNom, namePrep, lat, lon) => {
            setLocation(label, nameNom, namePrep, lat, lon);
            setShowLocationModal(false);
          }}
        />
      )}
    </div>
  );
}
