'use client';

import { useEffect, useRef, useState } from 'react';

interface UploadedPhoto {
  id: string;
  file: File;
  previewUrl?: string;
  url?: string;
  status: 'pending' | 'uploading' | 'done' | 'error';
}

interface AdPhotoUploaderProps {
  maxPhotos?: number;
  initialUrls?: string[];
  onChange?: (urls: string[]) => void;
  onUploadStatusChange?: (isUploading: boolean) => void;
}

export default function AdPhotoUploader({
  maxPhotos = 10,
  initialUrls = [],
  onChange,
  onUploadStatusChange,
}: AdPhotoUploaderProps) {
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const initializedRef = useRef(false);

  // Инициализация из уже загруженных URL (например, при редактировании)
  useEffect(() => {
    if (initialUrls.length > 0 && !initializedRef.current) {
      const fromUrls: UploadedPhoto[] = initialUrls.map((url, index) => ({
        id: `initial-${index}-${url}`,
        file: new File([], `photo-${index}.jpg`),
        url,
        status: 'done',
      }));
      setPhotos(fromUrls);
      initializedRef.current = true;
    }
  }, [initialUrls]);

  // Репортим наружу только успешно загруженные URL
  useEffect(() => {
    const urls = photos
      .filter((p) => p.status === 'done' && p.url)
      .map((p) => p.url!);
    onChange?.(urls);
  }, [photos, onChange]);

  // Отслеживаем статус загрузки
  useEffect(() => {
    const hasUploadingPhotos = photos.some((p) => p.status === 'uploading');
    onUploadStatusChange?.(hasUploadingPhotos);
  }, [photos, onUploadStatusChange]);

  const handleSelectFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const remainingSlots = maxPhotos - photos.length;
    if (remainingSlots <= 0) return;

    const toAdd = files.slice(0, remainingSlots);

    const newItems: UploadedPhoto[] = toAdd.map((file) => ({
      id: `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`,
      file,
      status: 'pending',
    }));

    setPhotos((prev) => [...prev, ...newItems]);

    // Создаем preview URL для каждого файла
    newItems.forEach((item) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const previewUrl = e.target?.result as string;
        setPhotos((prev) =>
          prev.map((p) => (p.id === item.id ? { ...p, previewUrl } : p))
        );
      };
      reader.readAsDataURL(item.file);
    });

    newItems.forEach((item) => uploadPhoto(item));

    e.target.value = '';
  };

  const uploadPhoto = async (item: UploadedPhoto) => {
    setPhotos((prev) =>
      prev.map((p) => (p.id === item.id ? { ...p, status: 'uploading' } : p))
    );

    try {
      const formData = new FormData();
      formData.append('file', item.file);
      formData.append('fileName', item.file.name);
      formData.append('folder', '/molla/mock-photos');

      const res = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Не удалось загрузить файл');
      }

      const data = await res.json();

      setPhotos((prev) =>
        prev.map((p) =>
          p.id === item.id
            ? { ...p, status: 'done', url: data.name as string }
            : p
        )
      );
    } catch (err) {
      console.error(err);
      setPhotos((prev) =>
        prev.map((p) => (p.id === item.id ? { ...p, status: 'error' } : p))
      );
    }
  };

  const handleRemovePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5">
      <h2 className="text-base sm:text-lg font-semibold mb-2">Фотографии</h2>
      <p className="text-xs sm:text-sm text-gray-500 mb-3">
        Загрузите до {maxPhotos} фотографий. Первая будет использоваться как
        обложка.
      </p>
      <div className="border-2 border-dashed border-violet-200 rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <label className="inline-flex items-center px-4 py-2 rounded-lg bg-violet-500 text-white text-xs sm:text-sm font-medium cursor-pointer hover:bg-violet-600 transition-colors shrink-0">
          <span className="mr-2 text-lg leading-none">＋</span>
          Выбрать файлы
          <input
            type="file"
            className="hidden"
            accept="image/*"
            multiple
            onChange={handleSelectFiles}
          />
        </label>
        <span className="text-xs sm:text-sm text-gray-500 min-w-0 flex-1">
          Поддерживаются JPG, PNG, WebP. Максимум {maxPhotos} файлов.
        </span>
      </div>

      {photos.length > 0 && (
        <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {photos.map((p) => (
            <div
              key={p.id}
              className="relative group rounded-lg overflow-hidden border border-gray-200 bg-gray-50"
            >
              {p.previewUrl || p.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={
                    p.previewUrl ||
                    `https://ik.imagekit.io/motorolla29/molla/mock-photos/${p.url}`
                  }
                  alt={p.file.name}
                  className="w-full h-24 object-cover"
                />
              ) : (
                <div className="w-full h-24 flex items-center justify-center text-xs sm:text-sm text-gray-400">
                  {p.status === 'uploading' ? 'Загрузка...' : p.file.name}
                </div>
              )}

              <button
                type="button"
                onClick={() => handleRemovePhoto(p.id)}
                className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] opacity-70 hover:opacity-100 transition-opacity"
              >
                ✕
              </button>

              {p.status === 'uploading' && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center text-xs sm:text-sm text-white">
                  Загрузка...
                </div>
              )}
              {p.status === 'error' && (
                <div className="absolute inset-0 bg-red-500/60 flex items-center justify-center text-[10px] text-white text-center px-1">
                  Ошибка
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
