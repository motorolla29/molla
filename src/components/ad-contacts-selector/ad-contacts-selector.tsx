'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';

interface AdContactsValue {
  showPhone: boolean;
  showEmail: boolean;
}

interface AdContactsSelectorProps {
  onChange?: (value: AdContactsValue) => void;
}

export default function AdContactsSelector({
  onChange,
}: AdContactsSelectorProps) {
  const { user } = useAuthStore();
  const [showPhone, setShowPhone] = useState(true);
  const [showEmail, setShowEmail] = useState(true);

  // Инициализируем состояние при загрузке или изменении пользователя
  useEffect(() => {
    const initialShowPhone = !!user?.phone;
    const initialShowEmail = !!user?.email;

    // Устанавливаем начальное состояние только если оно отличается от текущего
    if (showPhone !== initialShowPhone || showEmail !== initialShowEmail) {
      setShowPhone(initialShowPhone);
      setShowEmail(initialShowEmail);
    }
  }, [user]); // Зависимость от user

  // Уведомляем родительский компонент об изменениях
  useEffect(() => {
    onChange?.({ showPhone, showEmail });
  }, [showPhone, showEmail, onChange]);

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5 space-y-4">
      <h2 className="text-base sm:text-lg font-semibold">Контакты</h2>

      <div className="space-y-3">
        {/* Настройки видимости контактов */}
        <div>
          <h3 className="text-xs sm:text-sm font-medium text-gray-700 mb-3">
            Какие контакты показывать в объявлении?
          </h3>

          <div className="space-y-3">
            {/* Телефон - показываем только если указан */}
            {user?.phone && (
              <div className="flex items-center space-x-3 w-fit">
                <input
                  type="checkbox"
                  id="phone-checkbox"
                  checked={showPhone}
                  onChange={(e) => setShowPhone(e.target.checked)}
                  className="w-4 h-4 text-violet-600 bg-gray-100 border-gray-300 rounded focus:ring-violet-500 focus:ring-2"
                />
                <label
                  htmlFor="phone-checkbox"
                  className="flex-1 cursor-pointer"
                >
                  <div className="text-sm sm:text-base font-medium text-gray-900">
                    Телефон: {user.phone}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-500">
                    Покупатели смогут позвонить напрямую
                  </div>
                </label>
              </div>
            )}

            {/* Email - показываем только если указан */}
            {user?.email && (
              <div className="flex items-center space-x-3 w-fit">
                <input
                  type="checkbox"
                  id="email-checkbox"
                  checked={showEmail}
                  onChange={(e) => setShowEmail(e.target.checked)}
                  className="w-4 h-4 text-violet-600 bg-gray-100 border-gray-300 rounded focus:ring-violet-500 focus:ring-2"
                />
                <label
                  htmlFor="email-checkbox"
                  className="flex-1 cursor-pointer"
                >
                  <div className="text-sm sm:text-base font-medium text-gray-900">
                    Email: {user.email}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-500">
                    Покупатели смогут написать сообщение
                  </div>
                </label>
              </div>
            )}

            {/* Сообщение если нет контактов */}
            {!user?.phone && !user?.email && (
              <div className="text-xs sm:text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                У вас не указаны контакты в профиле. Добавьте телефон или email
                в разделе «Профиль», чтобы настроить видимость контактов.
              </div>
            )}
          </div>
        </div>

        {/* Информация о контактах */}
        <div className="pt-3 border-t border-gray-200">
          <p className="text-xs sm:text-sm text-gray-500 mb-2">
            Контакты берутся из вашего профиля. Изменить их можно в разделе
            «Профиль».
          </p>
          <div className="text-sm sm:text-base text-gray-800 space-y-1">
            <div>
              <span className="font-medium">Имя:</span> {user?.name || '—'}
            </div>
            {(showPhone || showEmail) && (
              <div className="text-xs sm:text-sm text-amber-600 mt-2">
                ✓ В объявлении будут показаны:{' '}
                {showPhone && showEmail
                  ? 'телефон и email'
                  : showPhone
                  ? 'только телефон'
                  : 'только email'}
              </div>
            )}
            {!showPhone && !showEmail && (
              <div className="text-xs sm:text-sm text-red-600 mt-2">
                ⚠️ Не выбраны контакты для показа в объявлении
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
