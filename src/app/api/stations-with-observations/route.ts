import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import type { Station, TideInfo } from '@/types';

/**
 * Parses a local date-time string from a specific IANA timezone into a valid Date object.
 * This is necessary because the WillyWeather API provides local times (e.g., "2023-10-27 15:00:00")
 * without timezone offsets. We must interpret these strings within the context of the station's timezone.
 * Simply using `new Date(localDateTimeString)` would incorrectly parse it in the server's timezone (e.g., UTC).
 * @param localDateTime A string like "YYYY-MM-DD HH:MM:SS".
 * @param timeZone A valid IANA timezone string (e.g., "Australia/Sydney").
 * @returns A Date object representing the correct moment in time.
 */
function parseDateTimeInTimeZone(localDateTime: string, timeZone: string): Date {
  // Create a formatter that will output the date parts in the given timezone
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  });

  // Create a date object by treating the local time as UTC. This is a "pseudo-date".
  const pseudoDate = new Date(localDateTime.replace(' ', 'T') + 'Z');

  // Format the pseudo-date into the target timezone's parts.
  const parts = formatter.formatToParts(pseudoDate).reduce((acc, part) => {
    if (part.type !== 'literal') (acc as any)[part.type] = part.value;
    return acc;
  }, {} as Record<Intl.DateTimeFormatPartTypes, string>);

  // Reconstruct an ISO-like string from the parts, but this string represents the *local time* in the target zone.
  const hour = parts.hour === '24' ? '00' : parts.hour;
  const dateInTz = new Date(`${parts.year}-${parts.month}-${parts.day}T${hour}:${parts.minute}:${parts.second}Z`);

  // The difference between the pseudo-date and this new date is the timezone offset.
  const offset = pseudoDate.getTime() - dateInTz.getTime();

  // The correct date is the pseudo-date plus the offset.
  return new Date(pseudoDate.getTime() + offset);
}

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
      const res = await fetch(`https://api.willyweather.com.au/v2/${willyWeatherApiKey}/locations/${station.id}/weather.json?observational=true&forecasts=wind,tides`, {
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

      // Check if the observational data is from a different station
      const sourceStation = data.observational?.stations?.wind;
      let sourceStationName: string | undefined = undefined;
      let sourceStationDistance: number | undefined = undefined;
      if (sourceStation && sourceStation.id.toString() !== station.id.toString()) {
        sourceStationName = sourceStation.name;
        sourceStationDistance = sourceStation.distance;
      }

      // Process tide data if available
      const tideForecast = data.forecasts?.tides;
      let tideInfo: TideInfo | undefined = undefined;
      const timeZone = data.location?.timeZone;

      if (tideForecast && tideForecast.days?.length > 0 && timeZone) {
        const allTideEntries = tideForecast.days.flatMap((d: any) => d.entries);
        const now = new Date();

        const tideEvents = allTideEntries.map((entry: any) => ({
          ...entry,
          date: parseDateTimeInTimeZone(entry.dateTime, timeZone),
        }));

        const nextTideIndex = tideEvents.findIndex((event: any) => event.date > now);

        // Ensure we have both a next tide and a previous tide to determine the cycle
        if (nextTideIndex > 0) {
            const nextTide = tideEvents[nextTideIndex];
            const previousTide = tideEvents[nextTideIndex - 1];
            
            const status: 'rising' | 'falling' = previousTide.type === 'low' ? 'rising' : 'falling';

            tideInfo = {
                status: status,
                previousTide: { 
                  type: previousTide.type, 
                  dateTime: previousTide.date.toISOString(), // Use ISO string for unambiguous transport
                  height: previousTide.height 
                },
                nextTide: { 
                  type: nextTide.type, 
                  dateTime: nextTide.date.toISOString(), // Use ISO string
                  height: nextTide.height 
                }
            };
        }
      }

      return {
        id: station.id.toString(),
        location: station.name,
        lat: station.lat,
        lng: station.lng,
        state: station.state,
        region: station.region,
        directionText: windObs?.directionText || "N/A",
        directionDegrees: windObs?.direction || 0,
        windSpeed: speedKnots,
        windGust: gustKnots,
        observationTime: data.observational?.issueDateTime,
        timeZone: data.location?.timeZone,
        sourceStationName: sourceStationName,
        sourceStationDistance: sourceStationDistance,
        tideInfo: tideInfo,
      };
    });

    const stations = (await Promise.all(stationDataPromises)).filter(Boolean) as Station[];
    return NextResponse.json(stations);

  } catch (error) {
    console.error("Failed to fetch station data:", error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}