import useSWR from 'swr';

interface Location {
  id: number;
  name: string;
  hasWindObservations: boolean;
}

interface Station {
  id: string;
  location: string;
  directionText: string;
  directionDegrees: number;
  range: string;
  rangeValue: string;
  windSpeed: number;
  windGust: number;
  observationTime?: string;
  timeZone?: string;
}

const fetcher = async (url: string): Promise<Station[]> => {
  const savedLocationsRes = await fetch(url);
  if (!savedLocationsRes.ok) throw new Error('Failed to fetch saved stations');
  const savedLocations: Location[] = (await savedLocationsRes.json()).map((us: any) => ({ id: us.stationId, name: us.station.name, hasWindObservations: true }));

  if (savedLocations.length === 0) return [];

  const stationDataPromises = savedLocations.map(async (loc) => {
    const res = await fetch(`/api/willyweather?id=${loc.id}&type=observations`);
    if (!res.ok) return null;
    const data = await res.json();
    const speedKmh = data.observational?.observations?.wind?.speed || 0;
    const gustKmh = data.observational?.observations?.wind?.gustSpeed || 0;
    const speedKnots = speedKmh ? speedKmh / 1.852 : 0;
    const gustKnots = gustKmh ? gustKmh / 1.852 : 0;
    return { id: loc.id.toString(), location: loc.name, directionText: data.observational?.observations?.wind?.directionText || "N/A", directionDegrees: data.observational?.observations?.wind?.direction || 0, range: `${Math.round(speedKnots)} - ${Math.round(gustKnots)} knots`, rangeValue: `${Math.round(speedKnots)} - ${Math.round(gustKnots)}`, windSpeed: speedKnots, windGust: gustKnots, observationTime: data.observational?.issueDateTime, timeZone: data.location?.timeZone };
  });

  return (await Promise.all(stationDataPromises)).filter(Boolean) as Station[];
};

export function useStations() {
  return useSWR<Station[], Error>('/api/user-stations', fetcher, {
    revalidateOnFocus: false, // This prevents re-fetching when the window is focused
  });
}