export type SortOrder = 'alphabetical' | 'wind_speed' | 'latitude' | 'last_updated';

export interface Location {
  id: number;
  name: string;
  hasWindObservations?: boolean;
  state?: string;
}

export interface TideInfo {
  status: 'rising' | 'falling' | 'unknown';
  previousTide?: {
    type: 'high' | 'low';
    dateTime: string;
    height: number;
  };
  nextTide: {
    type: 'high' | 'low';
    dateTime: string;
    height: number;
  };
}

export interface Station {
  id: string;
  location: string;
  lat: number;
  lng: number;
  state: string;
  region: string;
  directionText: string;
  directionDegrees: number;
  windSpeed: number;
  windGust: number;
  observationTime?: string; // This can be undefined
  timeZone?: string;
  sourceStationName?: string; // Name of the station providing the data, if different
  sourceStationDistance?: number;
  tideInfo?: TideInfo;
}
