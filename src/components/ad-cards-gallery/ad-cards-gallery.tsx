import { AdBase } from '@/types/ad';
import GalleryAdCard from '../gallery-ad-card/gallery-ad-card';

interface AdCardsGalleryProps {
  ads: AdBase[];
}

export default function AdCardsGallery({ ads }: AdCardsGalleryProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
      {ads.map((ad) => (
        <GalleryAdCard key={ad.id} ad={ad} />
      ))}
    </div>
  );
}
