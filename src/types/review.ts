export type ReviewTargetRole = 'seller' | 'buyer';

export interface ReviewUser {
  id: number;
  name: string | null;
  avatar: string | null;
}

export interface ReviewSeller {
  id: number;
  name: string | null;
  avatar: string | null;
}

export interface ReviewAd {
  id: string;
  title: string;
  photos: string[];
}

// Базовый тип отзыва, который можно использовать в разных компонентах
export interface ReviewBase {
  id: string;
  rating: number;
  content: string;
  photos?: string[];
  purchased?: boolean;
  createdAt: string;

  replyContent?: string | null;
  replyCreatedAt?: string | null;
  replyPhotos?: string[] | null;

  targetRole?: ReviewTargetRole | null;

  user: ReviewUser;
  ad: ReviewAd;
  /**
   * Продавец, о котором или с которым связан отзыв.
   * Теперь всегда присутствует в данных API.
   */
  seller: ReviewSeller;
}
