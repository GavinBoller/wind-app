
// DELETE: Remove a station for a user
export async function DELETE(request: Request) {
  try {
    const user = await getUserFromSession();
    const { searchParams } = new URL(request.url);
    const stationIdParam = searchParams.get('stationId');
    const stationId = stationIdParam ? parseInt(stationIdParam, 10) : null;
    if (!stationId || isNaN(stationId)) {
      return NextResponse.json({ error: 'Invalid stationId' }, { status: 400 });
    }
    // Delete the user-station link
    await prisma.userStation.deleteMany({
      where: {
        userId: user.id,
        stationId: stationId,
      },
    });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}
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
    const stationIdInt = typeof stationId === 'string' ? parseInt(stationId, 10) : stationId;
    if (isNaN(stationIdInt)) {
      return NextResponse.json({ error: 'Invalid stationId' }, { status: 400 });
    }

    // Upsert station info
    await prisma.station.upsert({
      where: { id: stationIdInt },
      update: { name, region, state, lat, lng },
      create: { id: stationIdInt, name, region, state, lat, lng },
    });

    // Add to user stations
    const userStation = await prisma.userStation.create({
      data: {
        userId: user.id,
        stationId: stationIdInt,
      },
    });

    return NextResponse.json(userStation);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}
