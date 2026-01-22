'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Smile, Paperclip } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MessageInputProps {
  onSendMessage: (content: string, attachments?: File[]) => void;
  disabled?: boolean;
  onTyping?: () => void;
  onStopTyping?: () => void;
}

export default function MessageInput({
  onSendMessage,
  disabled = false,
  onTyping,
  onStopTyping,
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // Закрытие emoji picker при клике вне
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(target) &&
        !target.closest('[data-emoji-button]')
      ) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

  const handleSend = () => {
    if ((message.trim() || attachment) && !disabled) {
      onSendMessage(message.trim(), attachment ? [attachment] : undefined);
      setMessage('');
      setAttachment(null);
      // Прекращаем индикацию печати при отправке сообщения
      onStopTyping?.();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    // Берем только первое изображение
    const imageFile = files.find((file) => file.type.startsWith('image/'));

    if (imageFile) {
      setAttachment(imageFile);
    }

    // Очищаем input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = () => {
    setAttachment(null);
  };

  const insertEmoji = (emoji: string) => {
    setMessage((prev) => prev + emoji);
    // Не закрываем picker, чтобы можно было выбрать несколько эмодзи
    onTyping?.(); // Вызываем typing при вставке эмодзи
  };

  const handleChange = (value: string) => {
    setMessage(value);
    if (value.trim()) {
      onTyping?.();
    } else {
      // Если текст удален полностью, прекращаем индикацию печати
      onStopTyping?.();
    }
  };

  // Простой набор эмодзи
  const emojis = [
    '😊',
    '😂',
    '❤️',
    '👍',
    '👎',
    '👋',
    '🙏',
    '🔥',
    '✨',
    '💯',
    '😍',
    '🤔',
    '😉',
    '🙂',
    '😢',
    '😭',
    '😤',
    '😅',
    '😌',
    '🤗',
  ];

  return (
    <div className=" border-gray-200 rounded-2xl bg-white p-4 m-4 mt-0">
      {/* Предпросмотр вложения */}
      {attachment && (
        <div className="mb-3">
          <div className="relative inline-block">
            <img
              src={URL.createObjectURL(attachment)}
              alt={attachment.name}
              className="w-16 h-16 object-cover rounded-lg border border-gray-200"
            />
            <button
              onClick={removeAttachment}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Поле ввода */}
      <div className="flex items-center space-x-2">
        <div className="flex-1 relative">
          <textarea
            value={message}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Напишите сообщение..."
            className="w-full flex px-4 py-3 pr-20 outline-1 outline-gray-300 rounded-lg resize-none focus:outline-violet-500 transition-colors duration-200"
            rows={1}
            style={{ minHeight: '48px', maxHeight: '120px' }}
            disabled={disabled}
          />

          {/* Кнопки в поле ввода */}
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex space-x-1">
            <div className="relative">
              <button
                data-emoji-button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                disabled={disabled}
              >
                <Smile size={18} />
              </button>

              {/* Emoji picker */}
              <AnimatePresence>
                {showEmojiPicker && (
                  <motion.div
                    ref={emojiPickerRef}
                    className="absolute bottom-full right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 max-h-35 sm:max-h-50 overflow-y-auto w-35 sm:w-80 z-50"
                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 5 }}
                    transition={{
                      duration: 0.2,
                      ease: 'easeOut',
                      type: 'spring',
                      //damping: 20,
                      //stiffness: 300,
                    }}
                  >
                    <div className="flex flex-wrap gap-1">
                      {emojis.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => insertEmoji(emoji)}
                          className="text-lg hover:bg-gray-100 rounded p-1 transition-colors"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              disabled={disabled}
            >
              <Paperclip size={18} />
            </button>
          </div>
        </div>

        {/* Кнопка отправки */}
        <button
          onClick={handleSend}
          disabled={disabled || (!message.trim() && !attachment)}
          className="bg-violet-500 hover:bg-violet-600 disabled:bg-gray-300 text-white p-3 rounded-lg transition-colors shrink-0 h-12 w-12 flex items-center justify-center"
        >
          <Send size={18} />
        </button>
      </div>

      {/* Скрытый input для файлов */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
