import { SpeedUnit, ColorTheme } from "../context/SettingsContext";
import type { Station, SortOrder } from "../types";

export const getWindSpeedClass = (speedInKnots: number, theme: ColorTheme) => {
  // For the 'inverted' theme (default for wind sports), high wind is good (green).
  // For the 'default' theme, high wind is a warning (red).
  const lightClass = theme === 'inverted' ? 'wind-bad' : 'wind-good';
  const moderateClass = 'wind-ok';
  const strongClass = theme === 'inverted' ? 'wind-good' : 'wind-bad';

  if (speedInKnots < 10) return lightClass;
  if (speedInKnots < 20) return moderateClass;
  return strongClass;
};

export const convertSpeed = (speedKnots: number, gustKnots: number, unit: SpeedUnit) => {
  switch (unit) {
    case 'km/h':
      return {
        rangeValue: `${Math.round(speedKnots * 1.852)} - ${Math.round(gustKnots * 1.852)}`,
        unitLabel: 'km/h',
      };
    case 'mph':
      return {
        rangeValue: `${Math.round(speedKnots * 1.15078)} - ${Math.round(gustKnots * 1.15078)}`,
        unitLabel: 'mph',
      };
    case 'knots':
    default:
      return {
        rangeValue: `${Math.round(speedKnots)} - ${Math.round(gustKnots)}`,
        unitLabel: 'knots',
      };
  }
};

export const sortStations = (stations: Station[], sortOrder: SortOrder): Station[] => {
  const stationsCopy = [...stations];

  switch (sortOrder) {
    case 'wind_speed':
      return stationsCopy.sort((a, b) => b.windSpeed - a.windSpeed);
    case 'latitude':
      // Higher latitude is more North, so sort descending
      return stationsCopy.sort((a, b) => {
        // Defensively handle cases where lat might not be a valid number
        const latA = typeof a.lat === 'number' ? a.lat : -Infinity;
        const latB = typeof b.lat === 'number' ? b.lat : -Infinity;
        return latB - latA;
      });
    case 'last_updated':
      // Newer dates are larger, so sort descending
      return stationsCopy.sort((a, b) => new Date(b.observationTime || 0).getTime() - new Date(a.observationTime || 0).getTime());
    case 'alphabetical':
    default:
      return stationsCopy.sort((a, b) => a.location.localeCompare(b.location));
  }
};