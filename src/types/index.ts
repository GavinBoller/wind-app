export interface Station {
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

// Used for search results and saved locations
export interface Location {
  id: number;
  name: string;
  hasWindObservations?: boolean; // Optional as it's not always present
}