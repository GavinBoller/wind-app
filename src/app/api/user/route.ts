import { NextRequest, NextResponse } from "next/server";

// Example: Replace with Neon/Postgres integration
let userStations: Record<string, { stations: any[]; windUnit: string; tideUnit: string }> = {};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }
  const userData = userStations[userId] || { stations: [], windUnit: "kmh", tideUnit: "metres" };
  return NextResponse.json(userData);
}

export async function POST(request: NextRequest) {
  const { userId, stations, windUnit, tideUnit } = await request.json();
  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }
  userStations[userId] = {
    stations: stations || [],
    windUnit: windUnit || "kmh",
    tideUnit: tideUnit || "metres"
  };
  return NextResponse.json({ success: true });
}

// Replace in-memory userStations with Neon/Postgres integration for production.
