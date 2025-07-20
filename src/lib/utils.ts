import { SpeedUnit, ColorTheme } from "../context/SettingsContext";

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