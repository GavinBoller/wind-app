import { NextRequest, NextResponse } from "next/server";

// In-memory cache for wind data
const windCache: Record<string, { data: any; timestamp: number }> = {};

// Cache duration in milliseconds (default: 6 minutes)
const CACHE_DURATION = 6 * 60 * 1000;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const stationId = searchParams.get("stationId");
  if (!stationId) {
    return NextResponse.json({ error: "Missing stationId" }, { status: 400 });
  }

  const now = Date.now();
  const cached = windCache[stationId];
  if (cached && now - cached.timestamp < CACHE_DURATION) {
    return NextResponse.json({ ...cached.data, cached: true });
  }

  // Replace with your actual wind data API call
  const apiUrl = `https://api.willyweather.com.au/v2/YOUR_API_KEY/locations/${stationId}/weather.json`;
  const res = await fetch(apiUrl);
  if (!res.ok) {
    return NextResponse.json({ error: "Failed to fetch wind data" }, { status: 500 });
  }
  const data = await res.json();
  windCache[stationId] = { data, timestamp: now };
  return NextResponse.json({ ...data, cached: false });
}

// To change cache duration, update CACHE_DURATION above.
