import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Получить статистику
    const [adsCount, sellersCount, recentAds] = await Promise.all([
      prisma.ad.count(),
      prisma.seller.count(),
      prisma.ad.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { seller: true }
      })
    ])

    return NextResponse.json({
      stats: {
        totalAds: adsCount,
        totalSellers: sellersCount
      },
      recentAds: recentAds.map(ad => ({
        id: ad.id,
        title: ad.title,
        category: ad.category,
        city: ad.city,
        price: ad.price,
        currency: ad.currency,
        datePosted: ad.datePosted.toISOString(),
        seller: {
          name: ad.seller.name,
          rating: ad.seller.rating
        }
      }))
    })
  } catch (error) {
    console.error('Admin API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch admin data' },
      { status: 500 }
    )
  }
}
