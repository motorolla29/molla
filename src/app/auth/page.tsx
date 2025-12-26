'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useLocationStore } from '@/store/useLocationStore';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function AuthPage() {
  const router = useRouter();
  const { isLoggedIn, login } = useAuthStore();
  const { cityName } = useLocationStore();
  const [redirectTo, setRedirectTo] = useState('/');

  useEffect(() => {
    // Получаем redirect параметр после монтирования компонента
    const searchParams = new URLSearchParams(window.location.search);
    const redirect = searchParams.get('redirect');
    if (redirect) {
      setRedirectTo(decodeURIComponent(redirect));
    }
  }, []);

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [name, setName] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showCodeStep, setShowCodeStep] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  // Таймер для повторной отправки кода
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!email.match(/^[^@\s]+@[^@\s]+\.[^@\s]+$/))
      errs.email = 'Некорректный email';
    if (password.length < 6) errs.password = 'Не менее 6 символов';
    if (mode === 'register') {
      const trimmedName = name.trim();
      if (trimmedName === '') {
        errs.name = 'Укажите имя';
      } else {
        // Имя должно быть минимум из 2 букв (латиница или кириллица)
        const lettersMatch = trimmedName.match(/[A-Za-zА-Яа-яЁё]/g);
        if (!lettersMatch || lettersMatch.length < 2) {
          errs.name = 'Имя должно содержать минимум 2 буквы';
        }
      }
      if (confirm !== password) errs.confirm = 'Пароли не совпадают';
    }
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (mode === 'login') {
      // Вход с паролем
      const errs = validate();
      if (Object.keys(errs).length) {
        setErrors(errs);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
          setErrors({ general: data.error });
          return;
        }

        login(data.user, data.token);
        const url = new URL(redirectTo, window.location.origin);
        url.searchParams.set('toast', 'login');
        router.replace(url.toString());
      } catch (error) {
        setErrors({ general: 'Ошибка сети. Попробуйте позже.' });
      } finally {
        setIsLoading(false);
      }
    } else {
      // Регистрация - сначала отправляем код
      const errs = validate();
      if (Object.keys(errs).length) {
        setErrors(errs);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch('/api/auth/send-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            name: name.trim(),
            password,
            city: cityName,
            isRegistration: true,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          setErrors({ general: data.error });
          return;
        }

        setShowCodeStep(true);
        setResendTimer(60);
      } catch (error) {
        setErrors({ general: 'Ошибка сети. Попробуйте позже.' });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleVerifyCode = async () => {
    if (verificationCode.length !== 6) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          code: verificationCode,
          isRegistration: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors({ code: data.error });
        return;
      }

      login(data.user, data.token);
      const url = new URL(redirectTo, window.location.origin);
      url.searchParams.set('toast', 'login');
      router.replace(url.toString());
    } catch (error) {
      setErrors({ code: 'Ошибка сети. Попробуйте позже.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendTimer > 0) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name: name.trim(),
          password,
          isRegistration: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors({ general: data.error });
        return;
      }

      setResendTimer(60);
      setErrors({});
    } catch (error) {
      setErrors({ general: 'Ошибка сети. Попробуйте позже.' });
    } finally {
      setIsLoading(false);
    }
  };

  const resetToForm = () => {
    setShowCodeStep(false);
    setVerificationCode('');
    setErrors({});
    setResendTimer(0);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-neutral-100 z-10 shadow-md">
        <div className="h-15 flex items-center justify-between px-4">
          <button
            onClick={() => router.back()}
            className="flex items-center ml-1 sm:ml-8 p-1 xs:p-2 text-gray-600 hover:text-gray-900 transition-colors"
            aria-label="Вернуться назад"
          >
            <ArrowLeft className="h-8 w-8" />
          </button>
          <Link className="flex h-[60%]" href="/">
            <img src="/logo/molla-logo.svg" alt="logo" />
          </Link>
          <div className="w-6 xs:w-10 sm:w-16"></div>{' '}
          {/* Пустой элемент для центрирования логотипа */}
        </div>
      </header>
      <main className="grow flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-md p-6 bg-white rounded-xl shadow-xl mx-8">
          {/* вход-регистрация переключатель */}
          <div className="flex justify-center text-sm sm:text-base mb-6">
            <button
              onClick={() => {
                setMode('login');
                setErrors({});
                resetToForm();
              }}
              className={`px-4 py-2 font-medium ${
                mode === 'login'
                  ? 'border-b-2 border-violet-500 text-violet-500'
                  : 'text-gray-500'
              }`}
            >
              Вход
            </button>
            <button
              onClick={() => {
                setMode('register');
                setErrors({});
                resetToForm();
              }}
              className={`px-4 py-2 font-medium ${
                mode === 'register'
                  ? 'border-b-2 border-violet-500 text-violet-500'
                  : 'text-gray-500'
              }`}
            >
              Регистрация
            </button>
          </div>

          {!showCodeStep ? (
            /* Форма входа/регистрации */
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <div>
                  <label className="block text-xs sm:text-sm">Имя</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full text-xs sm:text-sm mt-1 p-2 border border-neutral-400 rounded focus:outline-none focus:ring-2 focus:ring-violet-300"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                  )}
                </div>
              )}
              <div>
                <label className="block text-xs sm:text-sm">Email</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs sm:text-sm mt-1 p-2 border border-neutral-400 rounded focus:outline-none focus:ring-2 focus:ring-violet-300"
                  type="email"
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                )}
              </div>
              <div>
                <label className="block text-xs sm:text-sm">Пароль</label>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-xs sm:text-sm mt-1 p-2 border border-neutral-400 rounded focus:outline-none focus:ring-2 focus:ring-violet-300"
                  type="password"
                />
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1">{errors.password}</p>
                )}
              </div>
              {mode === 'register' && (
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
                    <p className="text-red-500 text-xs mt-1">
                      {errors.confirm}
                    </p>
                  )}
                </div>
              )}
              {errors.general && (
                <p className="text-red-500 text-xs text-center">
                  {errors.general}
                </p>
              )}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600 active:bg-violet-700 disabled:bg-violet-300 disabled:cursor-not-allowed transition"
              >
                {isLoading
                  ? 'Загрузка...'
                  : mode === 'login'
                  ? 'Войти'
                  : 'Зарегистрироваться'}
              </button>
            </form>
          ) : (
            /* Шаг подтверждения кода */
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-center mb-2">
                  Подтверждение email
                </h2>
                <p className="text-sm text-gray-600 text-center">
                  Мы отправили 6-значный код на <strong>{email}</strong>
                </p>
              </div>

              <div>
                <label className="block text-xs sm:text-sm">
                  Код подтверждения
                </label>
                <input
                  value={verificationCode}
                  onChange={(e) =>
                    setVerificationCode(
                      e.target.value.replace(/\D/g, '').slice(0, 6)
                    )
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && verificationCode.length === 6) {
                      handleVerifyCode();
                    }
                  }}
                  className="w-full sm:text-sm mt-1 p-2 border border-neutral-400 rounded focus:outline-none focus:ring-2 focus:ring-violet-300 text-center text-lg font-mono"
                  placeholder="000000"
                  maxLength={6}
                />
              </div>

              {errors.code && (
                <p className="text-red-500 text-xs text-center">
                  {errors.code}
                </p>
              )}

              <button
                onClick={handleVerifyCode}
                disabled={isLoading || verificationCode.length !== 6}
                className="w-full py-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600 active:bg-violet-700 disabled:bg-violet-300 disabled:cursor-not-allowed transition"
              >
                {isLoading ? 'Проверка...' : 'Подтвердить'}
              </button>

              <div className="text-center">
                <button
                  onClick={handleResendCode}
                  disabled={resendTimer > 0 || isLoading}
                  className="text-sm text-violet-500 hover:text-violet-600 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  {resendTimer > 0
                    ? `Отправить код повторно через ${resendTimer} сек`
                    : 'Отправить код повторно'}
                </button>
              </div>

              <button
                onClick={resetToForm}
                className="w-full py-2 text-sm text-gray-500 hover:text-gray-700"
              >
                Изменить данные
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
