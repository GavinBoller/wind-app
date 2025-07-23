import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'ADMIN') {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const totalUsers = await prisma.user.count();
    const totalUserStations = await prisma.userStation.count();
    const uniqueStationsInUse = await prisma.station.count({
      where: {
        users: { some: {} }, // Count stations that are linked to at least one user
      },
    });

    return NextResponse.json({
      totalUsers,
      totalUserStations,
      uniqueStationsInUse,
    });
  } catch (error) {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}