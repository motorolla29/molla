'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PasswordResetTokenPage() {
  const router = useRouter();
  const params = useParams();
  const token = typeof params?.token === 'string' ? params.token : '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const validate = () => {
    const errs: Record<string, string> = {};

    if (!password || password.length < 6) {
      errs.password = 'Пароль должен содержать минимум 6 символов';
    }

    if (confirm !== password) {
      errs.confirm = 'Пароли не совпадают';
    }

    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!token) {
      setErrors({ general: 'Некорректная ссылка для сброса пароля' });
      return;
    }

    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/reset-password-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors({ general: data.error || 'Не удалось сменить пароль' });
        setIsLoading(false);
        return;
      }

      setIsSuccess(true);
    } catch (error) {
      setErrors({ general: 'Ошибка сети. Попробуйте позже.' });
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-neutral-100 z-10 shadow-md">
        <div className="h-15 flex items-center justify-between px-4">
          <div className="w-12 flex items-center justify-start">
            <button
              onClick={() => router.back()}
              className="flex items-center p-2 text-gray-600 hover:text-gray-900 transition-colors"
              aria-label="Вернуться назад"
            >
              <ArrowLeft className="h-6 w-6 max-sm:h-5 max-sm:w-5" />
            </button>
          </div>
          <Link className="flex h-[60%] max-sm:h-[50%]" href="/">
            <img src="/logo/molla-logo.svg" alt="logo" />
          </Link>
          <div className="w-12"></div>
        </div>
      </header>
      <main className="grow flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-md p-6 bg-white rounded-xl shadow-xl mx-8">
          {!isSuccess ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h1 className="text-base sm:text-lg font-semibold text-center mb-2">
                Новый пароль
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 text-center mb-4">
                Придумайте новый пароль для вашего аккаунта и повторите его.
              </p>
              <div>
                <label className="block text-xs sm:text-sm">Новый пароль</label>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-xs sm:text-sm mt-1 p-2 border border-neutral-400 rounded focus:outline-none focus:ring-2 focus:ring-violet-300"
                  type="password"
                />
                {errors.password && (
                  <p className="text-red-500 text-[10px] sm:text-xs mt-1">
                    {errors.password}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs sm:text-sm">
                  Повторите пароль
                </label>
                <input
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full text-xs sm:text-sm mt-1 p-2 border border-neutral-400 rounded focus:outline-none focus:ring-2 focus:ring-violet-300"
                  type="password"
                />
                {errors.confirm && (
                  <p className="text-red-500 text-[10px] sm:text-xs mt-1">
                    {errors.confirm}
                  </p>
                )}
              </div>
              {errors.general && (
                <p className="text-red-500 text-[10px] sm:text-xs text-center">
                  {errors.general}
                </p>
              )}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2 bg-violet-500 text-sm sm:text-base text-white rounded-lg hover:bg-violet-600 active:bg-violet-700 disabled:bg-violet-300 disabled:cursor-not-allowed transition"
              >
                {isLoading ? 'Сохранение...' : 'Сменить пароль'}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <h1 className="text-base sm:text-lg font-semibold text-center mb-2">
                Пароль изменен
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 text-center">
                Ваш пароль успешно изменен. Теперь вы можете войти в аккаунт с
                новым паролем.
              </p>
              <Link
                href="/auth"
                className="block w-full text-center py-2 bg-violet-500 text-sm sm:text-base text-white rounded-lg hover:bg-violet-600 active:bg-violet-700 transition"
              >
                Перейти к авторизации
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

