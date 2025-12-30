'use client';

import Link from 'next/link';
import { useAuthStore } from '@/store/useAuthStore';

export default function Header() {
  const { isLoggedIn, user, logout } = useAuthStore();

  return (
    <div className="w-full hidden lg:block sticky top-0 z-10 bg-neutral-100 h-15">
      <div className="container px-4 mx-auto h-15 flex items-center justify-between">
        <Link className="flex h-[60%] select-none" href="/">
          <img src="/logo/molla-logo.svg" />
        </Link>
        <div className="flex items-center">
          <Link href="/favorites">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="size-6 mr-3 fill-neutral-500 cursor-pointer hover:opacity-80"
            >
              <path d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z" />
            </svg>
          </Link>

          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="size-6 mr-3 fill-neutral-500 cursor-pointer hover:opacity-80"
          >
            <path
              fillRule="evenodd"
              d="M5.25 9a6.75 6.75 0 0 1 13.5 0v.75c0 2.123.8 4.057 2.118 5.52a.75.75 0 0 1-.297 1.206c-1.544.57-3.16.99-4.831 1.243a3.75 3.75 0 1 1-7.48 0 24.585 24.585 0 0 1-4.831-1.244.75.75 0 0 1-.298-1.205A8.217 8.217 0 0 0 5.25 9.75V9Zm4.502 8.9a2.25 2.25 0 1 0 4.496 0 25.057 25.057 0 0 1-4.496 0Z"
              clipRule="evenodd"
            />
          </svg>
          <Link href="/chats">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="size-6 mr-3 fill-neutral-500 cursor-pointer hover:opacity-80"
            >
              <path
                fillRule="evenodd"
                d="M5.337 21.718a6.707 6.707 0 0 1-.533-.074.75.75 0 0 1-.44-1.223 3.73 3.73 0 0 0 .814-1.686c.023-.115-.022-.317-.254-.543C3.274 16.587 2.25 14.41 2.25 12c0-5.03 4.428-9 9.75-9s9.75 3.97 9.75 9c0 5.03-4.428 9-9.75 9-.833 0-1.643-.097-2.417-.279a6.721 6.721 0 0 1-4.246.997Z"
                clipRule="evenodd"
              />
            </svg>
          </Link>

          {isLoggedIn && user ? (
            <Link
              href="/personal/profile"
              className="flex items-center ml-1 hover:opacity-80 transition-opacity"
            >
              {user.avatar ? (
                <img
                  src={`https://ik.imagekit.io/motorolla29/molla/user-avatars/${user.avatar}?tr=w-80`}
                  alt={user.name}
                  className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-sm"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center text-white font-semibold text-sm border-2 border-white shadow-sm">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
            </Link>
          ) : (
            <Link
              href="/auth"
              className="font-semibold text-neutral-500 hover:opacity-80 cursor-pointer ml-1"
            >
              Войти
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
