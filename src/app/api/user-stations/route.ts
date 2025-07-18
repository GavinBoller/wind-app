import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromSession } from './helpers';

// Example GET: Get all stations for a user (replace with real user id or session)
export async function GET(request: Request) {
  try {
    const user = await getUserFromSession();
    const stations = await prisma.userStation.findMany({
      where: { userId: user.id },
      include: { station: true },
    });
    return NextResponse.json(stations);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}

// Example POST: Add a station for a user
export async function POST(request: Request) {
  try {
    const user = await getUserFromSession();
    const body = await request.json();
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
        userId: user.id,
        stationId,
      },
    });

    return NextResponse.json(userStation);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}
