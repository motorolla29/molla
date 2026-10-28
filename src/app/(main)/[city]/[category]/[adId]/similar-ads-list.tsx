'use client';

import GalleryAdCard from '@/components/gallery-ad-card/gallery-ad-card';
import type { AdBase } from '@/types/ad';

export default function SimilarAdsList({ ads }: { ads: AdBase[] }) {
  return (
    <section className="mt-4 mb-8 text-neutral-800">
      <h2 className="text-lg sm:text-xl font-semibold mb-4">
        Похожие объявления
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {ads.slice(0, 8).map((ad) => (
          <GalleryAdCard key={ad.id} ad={ad} />
        ))}
      </div>
    </section>
  );
}
