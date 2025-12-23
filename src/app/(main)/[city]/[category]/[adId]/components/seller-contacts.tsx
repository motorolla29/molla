import { useState, useRef, useEffect } from 'react';
import { CheckIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline';

interface SellerContactsProps {
  phone?: string;
  email?: string;
}

export default function SellerContacts({ phone, email }: SellerContactsProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showNotification, setShowNotification] = useState(false);
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

  return (
    <div className="space-y-2">
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
    </div>
  );
}
