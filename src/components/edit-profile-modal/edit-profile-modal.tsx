import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { loadCitiesData } from '@/utils';
import { CityRaw } from '@/types/city-raw';
import { useAuthStore } from '@/store/useAuthStore';
import { lockScroll, unlockScroll } from '@/utils/scroll-lock';

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  phone: string | null;
  rating: number;
  city: string | null;
}

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  cityName: string | null;
  onSave: (updates: {
    name?: string;
    phone?: string | null;
    city?: string | null;
    email?: string;
    verificationCode?: string;
  }) => void;
}

export function EditProfileModal({
  isOpen,
  onClose,
  user,
  cityName,
  onSave,
}: EditProfileModalProps) {
  const [formData, setFormData] = useState({
    name: user.name,
    phone: user.phone || '',
    city: cityName || '',
    email: user.email,
  });

  const [emailStep, setEmailStep] = useState<'input' | 'verify'>('input');
  const [verificationCode, setVerificationCode] = useState('');
  const [cities, setCities] = useState<CityRaw[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  // Отдельные состояния: отправка кода и сохранение профиля
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const modalRef = useRef<HTMLDivElement>(null);

  // Проверяем, есть ли изменения
  const hasChanges =
    formData.name !== user.name ||
    formData.phone !== (user.phone || '') ||
    formData.city !== (cityName || '') ||
    (formData.email !== user.email && emailStep === 'verify');

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: user.name,
        phone: user.phone || '',
        city: cityName || '',
        email: user.email,
      });
      setEmailStep('input');
      setVerificationCode('');
      setError('');
      setResendTimer(0);
      loadCities();
    }
  }, [isOpen, user, cityName]);

  // Блокируем скролл страницы при открытом модальном окне
  useEffect(() => {
    if (!isOpen) return;

    lockScroll();

    return () => {
      setTimeout(() => {
        unlockScroll();
      }, 200);
    };
  }, [isOpen]);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const loadCities = async () => {
    try {
      const citiesData = await loadCitiesData();
      setCities(citiesData);
    } catch (error) {
      console.error('Error loading cities:', error);
    }
  };

  const filteredCities = cities
    .filter((city) => {
      const cityName = city.namecase?.nominative || city.name;
      return (
        cityName && cityName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    })
    .slice(0, 10);

  const handleSendEmailCode = async () => {
    if (!formData.email.trim()) {
      setError('Введите email');
      return;
    }

    if (!formData.email.match(/^[^@\s]+@[^@\s]+\.[^@\s]+$/)) {
      setError('Введите корректный email адрес');
      return;
    }

    if (formData.email === user.email) {
      setError('Новый email должен отличаться от текущего');
      return;
    }

    setIsSendingCode(true);
    setError('');

    try {
      const response = await fetch('/api/auth/send-email-change-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newEmail: formData.email.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка отправки кода');
      }

      setEmailStep('verify');
      setResendTimer(60);
    } catch (err: any) {
      setError(err.message || 'Ошибка при отправке кода');
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleSave = async () => {
    if (!hasChanges) return;

    // Валидация
    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      setError('Имя не может быть пустым');
      return;
    }

    // Имя должно быть минимум из 2 букв (латиница или кириллица)
    const lettersMatch = trimmedName.match(/[A-Za-zА-Яа-яЁё]/g);
    if (!lettersMatch || lettersMatch.length < 2) {
      setError('Имя должно содержать минимум 2 буквы');
      return;
    }

    if (
      formData.phone &&
      !/^\+7\s?\(\d{3}\)\s?\d{3}-\d{2}-\d{2}$/.test(formData.phone)
    ) {
      setError('Введите корректный номер телефона');
      return;
    }

    // Если email изменился, проверяем формат и код подтверждения
    if (formData.email !== user.email) {
      // Улучшенная валидация email с поддержкой международных доменов
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError('Введите корректный email адрес');
        return;
      }

      if (emailStep !== 'verify' || !verificationCode.trim()) {
        setError('Подтвердите новый email кодом');
        return;
      }

      if (verificationCode.length !== 6) {
        setError('Код должен содержать 6 цифр');
        return;
      }
    }

    setIsSaving(true);
    setError('');

    try {
      const updates: any = {};

      // Добавляем только измененные поля
      if (formData.name !== user.name) {
        updates.name = formData.name.trim();
      }

      if (formData.phone !== (user.phone || '')) {
        updates.phone = formData.phone.trim() || null;
      }

      if (formData.city !== (cityName || '')) {
        updates.city = formData.city.trim() || null;
      }

      if (formData.email !== user.email) {
        updates.email = formData.email.trim();
        updates.verificationCode = verificationCode.trim();
      }

      await onSave(updates);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Ошибка при сохранении');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCitySelect = (city: CityRaw) => {
    const cityName = city.namecase?.nominative || city.name || '';
    setFormData((prev) => ({ ...prev, city: cityName }));
    setSearchTerm(cityName);
    setShowSuggestions(false);
  };

  // Варианты анимации для заднего фона
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  };

  // Варианты анимации для модального окна
  const modalVariants = {
    hidden: {
      opacity: 0,
      scale: 0.8,
      y: 20,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
    },
    exit: {
      opacity: 0,
      scale: 0.9,
      y: 15,
    },
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      if (hasChanges && !isSaving && !isSendingCode) {
        handleSave();
      }
    }
  };

  const handleVerificationCodeKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      if (hasChanges && !isSaving && !isSendingCode) {
        handleSave();
      }
    }
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 p-4"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{ duration: 0.25, ease: 'easeOut' }}
          //onClick={onClose}
        >
          <motion.div
            ref={modalRef}
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[calc(100vh-3rem)] overflow-y-auto shadow-2xl"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{
              duration: 0.35,
              ease: 'easeOut',
              type: 'spring',
              damping: 20,
              stiffness: 200,
            }}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={handleKeyDown}
          >
            <div className="p-6">
              <h3 className="text-xl max-sm:text-lg font-semibold text-gray-900 mb-6">
                Редактировать профиль
              </h3>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (hasChanges && !isSaving && !isSendingCode) {
                    handleSave();
                  }
                }}
                className="space-y-6"
              >
                {/* Имя */}
                <div>
                  <label className="block text-sm max-sm:text-xs font-medium text-gray-700 mb-2">
                    Имя *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    onKeyDown={handleKeyDown}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm max-sm:text-xs"
                    placeholder="Введите имя"
                  />
                </div>

                {/* Город */}
                <div>
                  <label className="block text-sm max-sm:text-xs font-medium text-gray-700 mb-2">
                    Город
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => {
                        setFormData((prev) => ({
                          ...prev,
                          city: e.target.value,
                        }));
                        setSearchTerm(e.target.value);
                        setShowSuggestions(true);
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      onKeyDown={handleKeyDown}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm max-sm:text-xs"
                      placeholder="Начните вводить название города"
                    />

                    {showSuggestions &&
                      searchTerm &&
                      filteredCities.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                          {filteredCities.map((city, index) => {
                            const cityName =
                              city.namecase?.nominative || city.name || '';
                            return (
                              <button
                                key={index}
                                onClick={() => handleCitySelect(city)}
                                className="w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                              >
                                {cityName}
                              </button>
                            );
                          })}
                        </div>
                      )}
                  </div>
                  <p className="text-xs max-sm:text-[10px] text-gray-500 mt-1">
                    Оставьте пустым, чтобы не указывать город
                  </p>
                </div>

                {/* Телефон */}
                <div>
                  <label className="block text-sm max-sm:text-xs font-medium text-gray-700 mb-2">
                    Телефон
                  </label>
                  <div className="flex items-center px-3 py-2 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-violet-500 focus-within:border-transparent">
                    <span className="mr-1 select-none text-sm max-sm:text-xs">
                      +7
                    </span>
                    <input
                      type="tel"
                      value={
                        formData.phone
                          ? formData.phone.replace(/^\+7\s?/, '')
                          : ''
                      }
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, '');
                        const formattedLocal = (() => {
                          if (digits.length === 0) return '';
                          if (digits.length <= 3) return `(${digits}`;
                          if (digits.length <= 6)
                            return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
                          if (digits.length <= 8)
                            return `(${digits.slice(0, 3)}) ${digits.slice(
                              3,
                              6
                            )}-${digits.slice(6)}`;
                          return `(${digits.slice(0, 3)}) ${digits.slice(
                            3,
                            6
                          )}-${digits.slice(6, 8)}-${digits.slice(8, 10)}`;
                        })();

                        setFormData((prev) => ({
                          ...prev,
                          phone: formattedLocal ? `+7 ${formattedLocal}` : '',
                        }));
                      }}
                      onKeyDown={handleKeyDown}
                      className="w-full border-none outline-none focus:ring-0 placeholder:text-gray-400 text-sm max-sm:text-xs"
                      placeholder="(XXX) XXX-XX-XX"
                    />
                  </div>
                  <p className="text-xs max-sm:text-[10px] text-gray-500 mt-1">
                    Введите номер в формате (XXX) XXX-XX-XX. Оставьте пустым,
                    чтобы не указывать телефон
                  </p>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm max-sm:text-xs font-medium text-gray-700 mb-2">
                    Email
                  </label>

                  {emailStep === 'input' ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }))
                        }
                        onKeyDown={handleKeyDown}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm max-sm:text-xs"
                        placeholder="example@email.com"
                      />
                      {formData.email !== user.email && formData.email && (
                        <button
                          onClick={handleSendEmailCode}
                          disabled={isSendingCode}
                          className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm max-sm:text-xs"
                        >
                          {isSendingCode
                            ? 'Отправка...'
                            : 'Отправить код подтверждения'}
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm max-sm:text-xs text-gray-600">
                        Код подтверждения отправлен на{' '}
                        <strong>{formData.email}</strong>
                      </p>
                      <input
                        type="text"
                        value={verificationCode}
                        onChange={(e) =>
                          setVerificationCode(
                            e.target.value.replace(/[^\d]/g, '').slice(0, 6)
                          )
                        }
                        onKeyDown={handleVerificationCodeKeyDown}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-center text-lg max-sm:text-base font-mono"
                        placeholder="000000"
                        maxLength={6}
                      />
                      <div className="flex justify-between items-center">
                        <button
                          onClick={() => setEmailStep('input')}
                          className="text-sm max-sm:text-xs text-gray-600 hover:text-gray-700"
                        >
                          Изменить email
                        </button>
                        <button
                          onClick={handleSendEmailCode}
                          disabled={resendTimer > 0 || isSendingCode}
                          className="text-sm max-sm:text-xs text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed"
                        >
                          {resendTimer > 0
                            ? `Отправить повторно (${resendTimer}с)`
                            : 'Отправить повторно'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {error && (
                  <p className="text-red-500 text-sm max-sm:text-xs">{error}</p>
                )}

                <div className="flex space-x-3 mt-8">
                  <button
                    onClick={onClose}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-sm max-sm:text-xs"
                    disabled={isSaving}
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    disabled={!hasChanges || isSaving}
                    className="flex-1 px-4 py-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600 active:bg-violet-700 disabled:bg-violet-300 disabled:cursor-not-allowed transition-colors text-sm max-sm:text-xs"
                  >
                    {isSaving ? 'Сохранение...' : 'Сохранить изменения'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
