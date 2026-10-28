import SimilarAdsList from './similar-ads-list';
import { prisma } from '@/lib/prisma';
import type { AdBase, CategoryKey, Currency } from '@/types/ad';

export function SimilarAdsSkeleton() {
  return (
    <section className="mt-4 mb-8 text-neutral-800">
      <h2 className="text-lg sm:text-xl font-semibold mb-4">
        Похожие объявления
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 animate-pulse">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="space-y-2">
            <div className="aspect-square bg-gray-200 rounded-lg" />
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
        ))}
      </div>
    </section>
  );
}

export default async function SimilarAds({ ad }: { ad: AdBase }) {
  const SIMILAR_LIMIT = 6;
  const SAME_CATEGORY_LIMIT = 128;

  let similarAds: AdBase[];

  try {
    const sameCategoryRaw = await prisma.ad.findMany({
      where: {
        category: ad.category,
        id: { not: ad.id },
        status: 'active',
      },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            avatar: true,
            rating: true,
            phone: true,
            email: true,
          },
        },
      },
      take: SAME_CATEGORY_LIMIT,
    });

    const withDistance = sameCategoryRaw.map((item) => ({
      item,
      dist:
        item.lat && item.lng && ad.location.lat && ad.location.lng
          ? (item.lat - ad.location.lat) * (item.lat - ad.location.lat) +
            (item.lng - ad.location.lng) * (item.lng - ad.location.lng)
          : Infinity,
    }));

    withDistance.sort((a, b) => a.dist - b.dist);

    similarAds = withDistance
      .slice(0, SIMILAR_LIMIT)
      .map(({ item }) => ({
        id: item.id,
        category: item.category.toLowerCase() as CategoryKey,
        title: item.title,
        description: item.description,
        city: item.city,
        cityLabel: item.cityLabel,
        address: item.address,
        location: {
          lat: item.lat,
          lng: item.lng,
        },
        price: item.price ? Number(item.price) : undefined,
        currency: (item.currency as Currency) || undefined,
        datePosted: item.datePosted.toISOString(),
        photos: item.photos,
        seller: {
          id: item.seller.id,
          avatar: item.seller.avatar,
          name: item.seller.name,
          rating: item.seller.rating,
          contact: {
            phone: item.seller.phone || undefined,
            email: item.seller.email || undefined,
          },
        },
        details: item.details,
        status: item.status,
      }));
  } catch (error) {
    console.error('Failed to fetch similar ads:', error);
    return null;
  }

  if (similarAds.length === 0) return null;

  return <SimilarAdsList ads={similarAds} />;
}
