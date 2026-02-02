import { useState, useRef, useEffect } from 'react';
import {
  CheckIcon,
  ClipboardDocumentIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/components/toast/toast-context';

interface SellerContactsProps {
  phone?: string;
  email?: string;
  sellerId?: number;
  adId?: string;
  showMessageButton?: boolean;
}

export default function SellerContacts({
  phone,
  email,
  sellerId,
  adId,
  showMessageButton = false,
}: SellerContactsProps) {
  const router = useRouter();
  const { user, isLoggedIn } = useAuthStore();
  const toast = useToast();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showNotification, setShowNotification] = useState(false);
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const notificationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setShowNotification(true);

      // Очищаем предыдущий таймер
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }

      // Устанавливаем новый таймер
      notificationTimeoutRef.current = setTimeout(() => {
        setCopiedField(null);
        setShowNotification(false);
        notificationTimeoutRef.current = null;
      }, 2500);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  // Очищаем таймер при размонтировании
  useEffect(() => {
    return () => {
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
    };
  }, []);

  const handleStartChat = async () => {
    if (!isLoggedIn || !user || !sellerId || !adId) {
      toast.show('Необходимо авторизоваться для начала чата', {
        type: 'error',
      });
      return;
    }

    // Проверяем, что пользователь не пытается написать сам себе
    if (parseInt(user.id) === sellerId) {
      toast.show('Нельзя начать чат с самим собой', {
        type: 'error',
      });
      return;
    }

    try {
      setIsCreatingChat(true);

      const response = await fetch('/api/messenger/chats/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adId: adId,
          sellerId: sellerId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/personal/messenger/channel/${data.chatId}`);
      } else {
        const errorData = await response.json();
        toast.show(errorData.error || 'Не удалось начать чат', {
          type: 'error',
        });
      }
    } catch (error) {
      console.error('Error creating chat:', error);
      toast.show('Произошла ошибка при создании чата', {
        type: 'error',
      });
      setIsCreatingChat(false);
    }
  };

  return (
    <div className="space-y-3">
      {phone && (
        <div
          className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group"
          onClick={() => copyToClipboard(phone, 'phone')}
        >
          <span className="text-violet-500">📞</span>
          <span className="text-sm sm:text-base text-violet-600 break-all flex-1">
            {phone}
          </span>
          <div className="relative flex items-center gap-1 text-gray-400 group-hover:text-violet-500 transition-colors">
            {showNotification && copiedField === 'phone' ? (
              <CheckIcon className="w-4 h-4 text-green-500" />
            ) : (
              <ClipboardDocumentIcon className="w-4 h-4" />
            )}
            {showNotification && copiedField === 'phone' && (
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-green-500 text-white text-xs px-2 py-1 rounded-md shadow-sm animate-fade-in whitespace-nowrap z-10">
                Скопировано!
              </div>
            )}
          </div>
        </div>
      )}
      {email && (
        <div
          className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group"
          onClick={() => copyToClipboard(email, 'email')}
        >
          <span className="text-violet-500">✉️</span>
          <span className="text-sm sm:text-base text-violet-600 break-all flex-1">
            {email}
          </span>
          <div className="relative flex items-center gap-1 text-gray-400 group-hover:text-violet-500 transition-colors">
            {showNotification && copiedField === 'email' ? (
              <CheckIcon className="w-4 h-4 text-green-500" />
            ) : (
              <ClipboardDocumentIcon className="w-4 h-4" />
            )}
            {showNotification && copiedField === 'email' && (
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-green-500 text-white text-xs px-2 py-1 rounded-md shadow-sm animate-fade-in whitespace-nowrap z-10">
                Скопировано!
              </div>
            )}
          </div>
        </div>
      )}

      {/* Кнопка "Написать" */}
      {showMessageButton && sellerId && adId && (
        <button
          onClick={handleStartChat}
          disabled={isCreatingChat}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-violet-500 hover:bg-violet-600 disabled:bg-violet-300 text-white text-sm sm:text-base font-semibold rounded-lg transition-colors disabled:cursor-not-allowed"
        >
          <ChatBubbleLeftRightIcon className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
          {/* {isCreatingChat ? 'Создание чата...' : 'Написать'} */}
          Написать
        </button>
      )}
    </div>
  );
}
