import { AdBase } from '@/types/ad';
import DefaultAdCard from '../default-ad-card/default-ad-card';

interface AdCardsDefaultProps {
  ads: AdBase[];
  disableViewedOverlay?: boolean;
}

export default function AdCardsDefault({
  ads,
  disableViewedOverlay = false,
}: AdCardsDefaultProps) {
  return (
    <div className="flex flex-col">
      {ads.map((ad) => (
        <DefaultAdCard
          key={ad.id}
          ad={ad}
          disableViewedOverlay={disableViewedOverlay}
        />
      ))}
    </div>
  );
}
