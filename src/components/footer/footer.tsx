import { FaVk, FaInstagram, FaTelegram, FaYoutube } from 'react-icons/fa';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mb-12 lg:mb-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Ссылки в ряд */}
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs sm:text-sm text-neutral-600 mb-6">
          <span className="hover:text-neutral-800 transition-colors cursor-pointer">
            Помощь
          </span>
          <span className="hover:text-neutral-800 transition-colors cursor-pointer">
            Безопасность
          </span>
          <span className="hover:text-neutral-800 transition-colors cursor-pointer">
            Реклама на сайте
          </span>
          <span className="hover:text-neutral-800 transition-colors cursor-pointer">
            О компании
          </span>
          <span className="hover:text-neutral-800 transition-colors cursor-pointer">
            Карьера
          </span>
          <span className="hover:text-neutral-800 transition-colors cursor-pointer">
            Блог
          </span>
          <span className="hover:text-neutral-800 transition-colors cursor-pointer">
            Приложение
          </span>
          <span className="hover:text-neutral-800 transition-colors cursor-pointer">
            Свежие объявления
          </span>
        </div>

        {/* Социальные сети */}
        <div className="flex justify-center space-x-3 sm:space-x-4 mb-6">
          {/* VK */}
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-linear-to-r cursor-pointer from-blue-500 to-blue-600 rounded-lg flex items-center justify-center hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105">
            <FaVk className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>

          {/* Instagram */}
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-linear-to-r cursor-pointer from-pink-500 via-red-500 to-yellow-500 rounded-lg flex items-center justify-center hover:from-pink-600 hover:via-red-600 hover:to-yellow-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105">
            <FaInstagram className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>

          {/* Telegram */}
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-linear-to-r cursor-pointer from-blue-400 to-blue-600 rounded-lg flex items-center justify-center hover:from-blue-500 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105">
            <FaTelegram className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>

          {/* YouTube */}
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-linear-to-r cursor-pointer from-red-500 to-red-600 rounded-lg flex items-center justify-center hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105">
            <FaYoutube className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
        </div>

        {/* Копирайт */}
        <div className="text-center text-xs sm:text-sm text-neutral-600 border-t border-gray-200">
          <p className="my-2">
            Molla —{' '}
            <span className="font-semibold">
              всероссийская доска объявлений
            </span>
            . © ООО «Molla» 2024–2026.
          </p>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            <span className="hover:text-neutral-800 transition-colors cursor-pointer">
              Правила Molla
            </span>
            <span className="hover:text-neutral-800 transition-colors cursor-pointer">
              Политика конфиденциальности
            </span>
            <span className="hover:text-neutral-800 transition-colors cursor-pointer">
              Пользовательское соглашение
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
