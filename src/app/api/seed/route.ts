import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { mockAds } from '@/data/mockAds'

export async function POST() {
  try {
    console.log('🌱 Starting database seeding...')

    // Создаем продавцов
    const sellers = [
      {
        id: 'seller1',
        name: 'Иван Иванов',
        avatar: '765-default-avatar.png',
        rating: 4.8,
        contactType: 'phone',
        contactValue: '+7 (912) 345-67-89',
      },
      {
        id: 'seller2',
        name: 'Екатерина Петрова',
        avatar: null,
        rating: 4.5,
        contactType: 'email',
        contactValue: 'kate.petrov@example.com',
      },
      {
        id: 'seller3',
        name: 'Алексей Сидоров',
        avatar: null,
        rating: 4.2,
        contactType: 'phone',
        contactValue: '+7 (999) 123-45-67',
      },
    ]

    for (const seller of sellers) {
      await prisma.seller.upsert({
        where: { id: seller.id },
        update: seller,
        create: seller,
      })
    }

    // Создаем объявления
    for (const ad of mockAds) {
      await prisma.ad.upsert({
        where: { id: ad.id },
        update: {
          category: ad.category.toUpperCase() as any,
          title: ad.title,
          description: ad.description,
          city: ad.city,
          cityLabel: ad.cityLabel,
          address: ad.address,
          lat: ad.location.lat,
          lng: ad.location.lng,
          price: ad.price,
          currency: ad.currency as any,
          datePosted: new Date(ad.datePosted),
          photos: ad.photos,
          details: ad.details,
          sellerId: ad.seller.id,
        },
        create: {
          id: ad.id,
          category: ad.category.toUpperCase() as any,
          title: ad.title,
          description: ad.description,
          city: ad.city,
          cityLabel: ad.cityLabel,
          address: ad.address,
          lat: ad.location.lat,
          lng: ad.location.lng,
          price: ad.price,
          currency: ad.currency as any,
          datePosted: new Date(ad.datePosted),
          photos: ad.photos,
          details: ad.details,
          sellerId: ad.seller.id,
        },
      })
    }

    console.log('✅ Database seeded successfully!')

    return NextResponse.json({
      message: 'Database seeded successfully',
      adsCount: mockAds.length,
      sellersCount: sellers.length
    })
  } catch (error) {
    console.error('❌ Error seeding database:', error)
    return NextResponse.json(
      { error: 'Failed to seed database' },
      { status: 500 }
    )
  }
}
