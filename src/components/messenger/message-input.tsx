'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Smile, Paperclip } from 'lucide-react';

interface MessageInputProps {
  onSendMessage: (content: string, attachments?: File[]) => void;
  disabled?: boolean;
}

export default function MessageInput({
  onSendMessage,
  disabled = false,
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // Закрытие emoji picker при клике вне
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node) &&
        !event.target.closest('[data-emoji-button]')
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
    if ((message.trim() || attachments.length > 0) && !disabled) {
      onSendMessage(
        message.trim(),
        attachments.length > 0 ? attachments : undefined
      );
      setMessage('');
      setAttachments([]);
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
    // Фильтруем только изображения
    const imageFiles = files.filter((file) => file.type.startsWith('image/'));
    setAttachments((prev) => [...prev, ...imageFiles]);

    // Очищаем input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const insertEmoji = (emoji: string) => {
    setMessage((prev) => prev + emoji);
    setShowEmojiPicker(false);
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
      {/* Предпросмотр вложений */}
      {attachments.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {attachments.map((file, index) => (
            <div key={index} className="relative">
              <img
                src={URL.createObjectURL(file)}
                alt={file.name}
                className="w-16 h-16 object-cover rounded-lg border border-gray-200"
              />
              <button
                onClick={() => removeAttachment(index)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Поле ввода */}
      <div className="flex items-center space-x-2">
        <div className="flex-1 relative">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
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
              {showEmojiPicker && (
                <div
                  ref={emojiPickerRef}
                  className="absolute bottom-full right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 max-h-35 sm:max-h-50 overflow-y-auto w-35 sm:w-80 z-50"
                >
                  <div className="flex flex-wrap gap-1">
                    {emojis.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => insertEmoji(emoji)}
                        className="text-lg hover:bg-gray-100 rounded p-1"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
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
          disabled={disabled || (!message.trim() && attachments.length === 0)}
          className="bg-violet-500 hover:bg-violet-600 disabled:bg-gray-300 text-white p-3 rounded-lg transition-colors flex-shrink-0 h-12 w-12 flex items-center justify-center"
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
