import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import type { Station } from '@/types';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const userStations = await prisma.userStation.findMany({
      where: { userId: user.id },
      include: { station: true },
    });

    if (userStations.length === 0) {
      return NextResponse.json([]);
    }

    const willyWeatherApiKey = process.env.WILLYWEATHER_API_KEY;
    if (!willyWeatherApiKey) throw new Error("WillyWeather API key is not configured.");

    const stationDataPromises = userStations.map(async ({ station }) => {
      // Cache the result from WillyWeather for 10 minutes (600 seconds)
      // This reduces API calls and costs for popular stations.
      const res = await fetch(`https://api.willyweather.com.au/v2/${willyWeatherApiKey}/locations/${station.id}/weather.json?observational=true`, {
        next: { revalidate: 600 } 
      });
      if (!res.ok) return null;
      const data = await res.json();

      const windObs = data.observational?.observations?.wind;
      const speedKmh = windObs?.speed || 0;
      const gustKmh = windObs?.gustSpeed || 0;

      // Convert speeds to knots
      const speedKnots = speedKmh / 1.852;
      const gustKnots = gustKmh / 1.852;

      return {
        id: station.id.toString(),
        location: station.name,
        lat: station.lat,
        lng: station.lng,
        directionText: windObs?.directionText || "N/A",
        directionDegrees: windObs?.direction || 0,
        windSpeed: speedKnots,
        windGust: gustKnots,
        observationTime: data.observational?.issueDateTime,
        timeZone: data.location?.timeZone,
      };
    });

    const stations = (await Promise.all(stationDataPromises)).filter(Boolean) as Station[];
    return NextResponse.json(stations);

  } catch (error) {
    console.error("Failed to fetch station data:", error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}