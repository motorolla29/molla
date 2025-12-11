import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { mockAds } from '@/data/mockAds';
import { mockSellers } from '@/data/mockSellers';

export async function POST(request: NextRequest) {
  try {
    console.log('🌱 Starting database seeding...');
    console.log('Mock sellers count:', mockSellers.length);
    console.log('Mock ads count:', mockAds.length);

    // Создаем продавцов на основе mockSellers
    console.log('📝 Creating sellers...');
    for (const seller of mockSellers) {
      console.log(
        `Creating seller: ${seller.name}, phone: ${seller.contact.phone}, email: ${seller.contact.email}`
      );
      await prisma.seller.upsert({
        where: { id: seller.id },
        update: {
          name: seller.name,
          avatar: seller.avatar,
          rating: seller.rating,
          phone: seller.contact.phone,
          email: seller.contact.email,
        },
        create: {
          id: seller.id,
          name: seller.name,
          avatar: seller.avatar,
          rating: seller.rating,
          phone: seller.contact.phone || null,
          email: seller.contact.email || null,
        },
      });
    }
    console.log('✅ Sellers created successfully');

    // Создаем объявления
    console.log('📝 Creating ads...');
    let adsCreated = 0;
    for (const ad of mockAds) {
      console.log(`Creating ad: ${ad.title} for seller: ${ad.seller.name}`);
      await prisma.ad.upsert({
        where: { id: ad.id },
        update: {
          category: ad.category as any,
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
          category: ad.category as any,
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
      });
      adsCreated++;
    }
    console.log(`✅ Ads created: ${adsCreated}`);

    console.log('✅ Database seeded successfully!');

    return NextResponse.json({
      message: 'Database seeded successfully',
      adsCount: mockAds.length,
      sellersCount: mockSellers.length,
    });
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    console.error(
      'Stack trace:',
      error instanceof Error ? error.stack : 'Unknown error'
    );
    return NextResponse.json(
      {
        error: 'Failed to seed database',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
