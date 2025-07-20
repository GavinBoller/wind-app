export interface Location {
  id: number;
  name: string;
  hasWindObservations?: boolean;
}

export interface Station {
  id: string;
  location: string;
  lat: number;
  lng: number;
  directionText: string;
  directionDegrees: number;
  windSpeed: number;
  windGust: number;
  observationTime?: string; // This can be undefined
  timeZone?: string;
}
