import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Example GET: Get all stations for a user (replace with real user id or session)
export async function GET(request: Request) {
  // TODO: Replace with real user/session logic
  const userId = 1;
  const stations = await prisma.userStation.findMany({
    where: { userId },
    include: { station: true },
  });
  return NextResponse.json(stations);
}

// Example POST: Add a station for a user
export async function POST(request: Request) {
  const body = await request.json();
  // TODO: Replace with real user/session logic
  const userId = 1;
  const { stationId, name, region, state, lat, lng } = body;

  // Upsert station info
  await prisma.station.upsert({
    where: { id: stationId },
    update: { name, region, state, lat, lng },
    create: { id: stationId, name, region, state, lat, lng },
  });

  // Add to user stations
  const userStation = await prisma.userStation.create({
    data: {
      userId,
      stationId,
    },
  });

  return NextResponse.json(userStation);
}
