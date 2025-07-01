import { AdBase } from '@/types/ad';
import DefaultAdCard from '../default-ad-card/default-ad-card';

interface AdCardsDefaultProps {
  ads: AdBase[];
}

export default function AdCardsDefault({ ads }: AdCardsDefaultProps) {
  return (
    <div className="flex flex-col">
      {ads.map((ad) => (
        <DefaultAdCard key={ad.id} ad={ad} />
      ))}
    </div>
  );
}
