import { NextResponse } from 'next/server';
import type { TideInfo, StationInfo, TideEntry } from '@/types';

// --- WillyWeather API Type Definitions ---

type ForecastType = 'weather' | 'wind' | 'tides';

interface WillyWeatherAPIDay {
  entries: any[];
  // These are present on the day object for wind forecasts
  speedMin?: number;
  speedMax?: number;
}

interface WillyWeatherAPIForecast {
  days: WillyWeatherAPIDay[];
  tideLocation?: { name: string };
}

interface WillyWeatherAPIObservationStation {
  id: number;
  name: string;
}

interface WillyWeatherAPIResponse {
  location: {
    lat: number;
    lng: number;
    timeZone: string;
  };
  forecasts: {
    tides?: WillyWeatherAPIForecast;
    weather?: WillyWeatherAPIForecast;
    wind?: WillyWeatherAPIForecast;
  };
  observational?: any; // Keeping this flexible for now
}

/**
 * Parses a local date-time string from a specific IANA timezone into a valid Date object.
 * This is necessary because the WillyWeather API provides local times (e.g., "2023-10-27 15:00:00")
 * without timezone offsets. We must interpret these strings within the context of the station's timezone.
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

  const pseudoDate = new Date(localDateTime.replace(' ', 'T') + 'Z');
  const parts = Object.fromEntries(
    formatter.formatToParts(pseudoDate).map(({ type, value }) => [type, value])
  ) as Record<Intl.DateTimeFormatPartTypes, string>;

  const hour = parts.hour === '24' ? '00' : parts.hour;
  const dateInTz = new Date(`${parts.year}-${parts.month}-${parts.day}T${hour}:${parts.minute}:${parts.second}Z`);
  const offset = pseudoDate.getTime() - dateInTz.getTime();
  return new Date(pseudoDate.getTime() + offset);
}

/**
 * Reusable helper to fetch forecasts from WillyWeather.
 */
async function fetchWillyWeatherForecasts(
  stationId: string | number,
  forecasts: ForecastType[],
  apiKey: string
): Promise<WillyWeatherAPIResponse['forecasts'] | null> {
  const forecastQuery = forecasts.join(',');
  try {
    const res = await fetch(
      `https://api.willyweather.com.au/v2/${apiKey}/locations/${stationId}/weather.json?forecasts=${forecastQuery}`,
      { next: { revalidate: 600 } }
    );
    if (!res.ok) {
      console.error(`Failed to fetch ${forecastQuery} for station ${stationId}: ${res.statusText}`);
      return null;
    }
    const data = await res.json();
    return data.forecasts;
  } catch (e) {
    console.error(`Error in fetchWillyWeatherForecasts for station ${stationId}`, e);
    return null;
  }
}

/**
 * Searches for a nearby station of a specific type and fetches a specific forecast.
 */
async function searchAndFetchForecast(
  lat: number,
  lng: number,
  types: string, // e.g., '5' for weather, '14,1' for wind
  forecast: ForecastType,
  apiKey: string
): Promise<WillyWeatherAPIForecast | undefined> {
  try {
    const searchRes = await fetch(`https://api.willyweather.com.au/v2/${apiKey}/search.json?lat=${lat}&lng=${lng}&types=${types}&limit=1`);
    if (!searchRes.ok) return undefined;

    const searchData = await searchRes.json();
    const nearbyStation = searchData?.locations?.[0];

    if (nearbyStation) {
      console.log(`Found nearby ${forecast} station: ${nearbyStation.name} (${nearbyStation.id}). Fetching its forecast.`);
      const newForecasts = await fetchWillyWeatherForecasts(nearbyStation.id, [forecast], apiKey);
      return newForecasts?.[forecast];
    }
  } catch (e) {
    console.error(`Error in searchAndFetchForecast for ${forecast}`, e);
  }
  return undefined;
}


export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const stationId = searchParams.get('stationId');

  if (!stationId) {
    return new NextResponse('Missing stationId', { status: 400 });
  }

  const willyWeatherApiKey = process.env.WILLYWEATHER_API_KEY;
  if (!willyWeatherApiKey) {
    console.error("WillyWeather API key is not configured.");
    return new NextResponse('Internal Server Error', { status: 500 });
  }

  try {
    const res = await fetch(`https://api.willyweather.com.au/v2/${willyWeatherApiKey}/locations/${stationId}/weather.json?forecasts=tides,weather,wind&observational=true`, {
      next: { revalidate: 600 } // Cache for 10 minutes
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch tide data for station ${stationId}`);
    }

    const data: WillyWeatherAPIResponse = await res.json();
    const tideForecast = data.forecasts?.tides;
    let windForecast = data.forecasts?.wind;
    let weatherForecast = data.forecasts?.weather;
    const tempObs = data.observational?.observations?.temperature;
    const tempStation: WillyWeatherAPIObservationStation | undefined = data.observational?.stations?.temperature;
    const windStation: WillyWeatherAPIObservationStation | undefined = data.observational?.stations?.wind;
    const timeZone = data.location?.timeZone;
    const lat = data.location?.lat;
    const lng = data.location?.lng;

    const stationInfo: Partial<StationInfo> = {};

    // Process Tides if available
    if (tideForecast && tideForecast.days?.length > 0 && timeZone) {
      const allTideEntries: TideEntry[] = tideForecast.days.flatMap(d => d.entries);
      const now = new Date();

      const tideEvents = allTideEntries.map((entry) => ({
        ...entry,
        date: parseDateTimeInTimeZone(entry.dateTime, timeZone),
      }));

      const nextTideIndex = tideEvents.findIndex(event => event.date > now);

      if (nextTideIndex > 0) {
        const nextTide = tideEvents[nextTideIndex];
        const previousTide = tideEvents[nextTideIndex - 1];
        const status: 'rising' | 'falling' = previousTide.type === 'low' ? 'rising' : 'falling';

        // For the chart, let's get a window of tide events
        // e.g., previous 2 and next 2, for a total of 4 points if available.
        const chartDataEvents = tideEvents.slice(
          Math.max(0, nextTideIndex - 2),
          Math.min(tideEvents.length, nextTideIndex + 2)
        );

        const tideChartData: TideEntry[] = chartDataEvents.map(event => ({
          type: event.type,
          dateTime: event.date.toISOString(),
          height: event.height
        }));

        const tideData: TideInfo = {
          status: status,
          previousTide: { type: previousTide.type, dateTime: previousTide.date.toISOString(), height: previousTide.height },
          nextTide: { type: nextTide.type, dateTime: nextTide.date.toISOString(), height: nextTide.height },
          tideChartData: tideChartData
        };
        stationInfo.tideData = tideData;
        stationInfo.tideLocationName = tideForecast.tideLocation?.name;
      }
    }

    // --- Smarter Forecast Fetching Logic ---

    // Check if the 'day' object exists, as min/max values are on the day, not necessarily in entries.
    let hasWeatherForecast = !!(weatherForecast?.days?.[0]);
    let hasWindForecast = !!(windForecast?.days?.[0]);

    // Step 1: Prioritize using the source station from observational data if forecasts are missing.
    // This is a strong hint from the API.
    const tempStationId = tempStation?.id;
    const windStationId = windStation?.id;

    // Optimization: If both forecasts are missing and the source stations are the same, fetch them in one call.
    if (!hasWeatherForecast && !hasWindForecast && tempStationId && tempStationId === windStationId) {
      console.log(`No direct forecasts. Using observation station: ${tempStation.name} (${tempStationId}) for both.`);
      const newForecasts = await fetchWillyWeatherForecasts(tempStationId, ['weather', 'wind'], willyWeatherApiKey);
      if (newForecasts) {
        weatherForecast = newForecasts.weather;
        windForecast = newForecasts.wind;
        hasWeatherForecast = !!(weatherForecast?.days?.[0]);
        hasWindForecast = !!(windForecast?.days?.[0]);
      }
    } else {
      // Otherwise, fetch them individually if needed.
      if (!hasWeatherForecast && tempStationId) {
        console.log(`No direct weather forecast. Using temp observation station: ${tempStation.name} (${tempStationId})`);
        const newForecasts = await fetchWillyWeatherForecasts(tempStationId, ['weather'], willyWeatherApiKey);
        if (newForecasts?.weather) {
          weatherForecast = newForecasts.weather;
          hasWeatherForecast = !!(weatherForecast?.days?.[0]);
        }
      }
      if (!hasWindForecast && windStationId) {
        console.log(`No direct wind forecast. Using wind observation station: ${windStation.name} (${windStationId})`);
        const newForecasts = await fetchWillyWeatherForecasts(windStationId, ['wind'], willyWeatherApiKey);
        if (newForecasts?.wind) {
          windForecast = newForecasts.wind;
          hasWindForecast = !!(windForecast?.days?.[0]);
        }
      }
    }

    // Step 2: If forecasts are still missing, fall back to a geographical search.
    if ((!hasWeatherForecast || !hasWindForecast) && lat && lng) {
      console.log(`Forecasts still missing. Searching for nearest stations via geo-coordinates...`);
      if (!hasWeatherForecast) {
        // Search specifically for a weather station (type 5)
        const newWeatherForecast = await searchAndFetchForecast(lat, lng, '5', 'weather', willyWeatherApiKey);
        if (newWeatherForecast) {
          weatherForecast = newWeatherForecast;
        }
      }
      if (!hasWindForecast) {
        // Search specifically for Bay/Inlet (14) or Ocean (1) stations for wind
        const newWindForecast = await searchAndFetchForecast(lat, lng, '14,1', 'wind', willyWeatherApiKey);
        if (newWindForecast) {
          windForecast = newWindForecast;
        }
      }
    }

    // Process Weather if available
    // Note: For weather, min/max temp is in the first entry of the day.
    if (weatherForecast && weatherForecast.days?.[0]?.entries?.[0]) {
      const todayForecastEntry = weatherForecast.days[0].entries[0];
      stationInfo.tempMin = todayForecastEntry.min;
      stationInfo.tempMax = todayForecastEntry.max;
    }

    // Process Wind Forecast if available
    // Note: For wind, min/max speed is on the day object, not the entry.
    if (windForecast && windForecast.days?.[0]) {
      const todayWindDay = windForecast.days[0];
      stationInfo.windMin = todayWindDay.speedMin;
      stationInfo.windMax = todayWindDay.speedMax;
    }

    if (tempObs) {
      stationInfo.currentTemp = tempObs.temperature;
      stationInfo.apparentTemp = tempObs.apparentTemperature;
    }

    if (Object.keys(stationInfo).length === 0) {
      return new NextResponse('No detailed information available for this station.', { status: 404 });
    }

    // For client-side debugging, let's package up the key variables.
    const responseData = {
      ...stationInfo,
      debug: {
        weatherForecast,
        windForecast,
      }
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error(`Failed to fetch tide data for station ${stationId}:`, error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}