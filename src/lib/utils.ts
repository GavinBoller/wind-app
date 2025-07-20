import { SpeedUnit } from "@/context/SettingsContext";

export const getWindSpeedClass = (speedInKnots: number) => {
  if (speedInKnots < 10) return 'wind-light';
  if (speedInKnots < 20) return 'wind-moderate';
  return 'wind-strong';
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