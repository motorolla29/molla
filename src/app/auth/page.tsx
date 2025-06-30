'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import Link from 'next/link';

export default function AuthPage() {
  const router = useRouter();
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [name, setName] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isLoggedIn) router.replace('/profile');
  }, [isLoggedIn, router]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!email.match(/^[^@\s]+@[^@\s]+\.[^@\s]+$/))
      errs.email = 'Некорректный email';
    if (password.length < 6) errs.password = 'Не менее 6 символов';
    if (mode === 'register') {
      if (name.trim() === '') errs.name = 'Укажите имя';
      if (confirm !== password) errs.confirm = 'Пароли не совпадают';
    }
    return errs;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    // здесь отправка на сервер...
    // login(
    //   { id: '1', name: name || 'Пользователь', email, avatar: null },
    //   'token'
    // );
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-neutral-100 z-10 shadow-md">
        <div className="h-15 flex items-center justify-center">
          <Link className="flex h-[60%]" href="/">
            <img src="logo/molla-logo.svg" alt="logo" />
          </Link>
        </div>
      </header>
      <main className="flex-grow flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-md p-6 bg-white rounded-xl shadow-xl mx-8">
          {/* вход-регистрация переключатель */}
          <div className="flex justify-center text-sm sm:text-base mb-6">
            <button
              onClick={() => {
                setMode('login');
                setErrors({});
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
                  <p className="text-red-500 text-xs mt-1">{errors.confirm}</p>
                )}
              </div>
            )}
            <button
              type="submit"
              className="w-full py-2 bg-violet-400 text-white rounded-lg hover:bg-violet-500 active:bg-violet-600 transition"
            >
              {mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
