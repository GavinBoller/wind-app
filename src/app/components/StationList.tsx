"use client";

import React from 'react';
import type { Station } from '../../types';
import { useSettings } from '../../context/SettingsContext';
import { getWindSpeedClass, convertSpeed } from '../../lib/utils';
import WindArrow from './WindArrow';
import ObservationTime from './ObservationTime';
import Dropdown from './Dropdown';
import InfoIcon from './InfoIcon';
import { generateWillyWeatherUrl } from '../../lib/willyweather';

interface StationListProps {
  stations: Station[];
  onDelete: (station: Station) => void;
  onDirectionHover: (stationId: string | null) => void;
  onDirectionClick: (stationId: string) => void;
  stationWithExactDegrees: string | null;
  onInfoClick: (station: Station) => void;
  onAddStationClick: () => void;
}

// A more standard gear icon for settings
const SettingsIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export default function StationList({
  stations,
  onDelete,
  onDirectionHover,
  onDirectionClick,
  stationWithExactDegrees,
  onInfoClick,
  onAddStationClick,
}: StationListProps) {
  const { speedUnit, colorTheme } = useSettings();

  if (stations.length === 0) {
    return (
      <div className="card stations-empty">
        <h3 className="onboarding-title">Welcome to Wind sniff!</h3>
        <p className="onboarding-text">
          Get started by adding your first station to see live wind, tide, and temperature data.
        </p>
        <button className="add-button" onClick={onAddStationClick}>
          Add a New Station
        </button>
        <div className="onboarding-hints-container">
          <div className="onboarding-hint">
            <SettingsIcon className="onboarding-icon" />
            <span>Use the settings icon to add more stations.</span>
          </div>
          <div className="onboarding-hint">
            <InfoIcon className="onboarding-icon" />
            <span>Tap the info icon on a station for more details.</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {stations.map((station) => {
        const { rangeValue, unitLabel } = convertSpeed(station.windSpeed, station.windGust, speedUnit);
        const willyWeatherUrl = generateWillyWeatherUrl(station.location, station.region, station.state);
        return (
          <div key={station.id} className="card station-row">
            <div className="location-container">
              <div className="location-name-row">
                <span className="location" title={station.location}>{station.location}</span>
                {station.hasInfo && (
                  <InfoIcon
                    className="info-indicator"
                    onClick={() => onInfoClick(station)}
                    title="View more station details (tides, temp, etc.)"
                  />
                )}
              </div>
              {/* Desktop: Show source station info under the location name */}
              {station.sourceStationName && station.sourceStationDistance !== undefined && station.sourceStationDistance >= 1 && (
                <div className="source-station-info source-station-desktop"> wind at
                  {` ${station.sourceStationName} (${station.sourceStationDistance}km)`}
                </div>
              )}
            </div>
            <div className="station-data-row">
              <div className="wind-info">
                <div
                  className="wind-direction clickable"
                  onClick={() => onDirectionClick(station.id)}
                  onMouseEnter={() => onDirectionHover(station.id)}
                  onMouseLeave={() => onDirectionHover(null)}
                >
                  <span className="wind-text">
                    {station.directionText || "N/A"}
                    {stationWithExactDegrees === station.id && ` (${station.directionDegrees}°)`}
                  </span>
                  <WindArrow
                    className="wind-arrow"
                    directionDegrees={station.directionDegrees || 0}
                  />
                </div>
                {/* Mobile: This will be shown via CSS media queries at the bottom of the wind-info block */}
                {station.sourceStationName && station.sourceStationDistance !== undefined && station.sourceStationDistance >= 1 && (
                  <div className="source-station-info source-station-mobile">
                    {`wind at ${station.sourceStationName} (${station.sourceStationDistance}km)`}
                  </div>
                )}
              </div>
              <div className="station-windrange-col">
                <div className="wind-range">
                  <span className={`wind-range-value ${getWindSpeedClass(station.windSpeed, colorTheme)}`}>
                    {rangeValue}
                  </span>
                  <span className="wind-range-unit"> {unitLabel}</span>
                </div>
                <ObservationTime observationTime={station.observationTime} timeZone={station.timeZone} />
              </div>
              <div className="station-actions">
                <Dropdown
                  contentClassName="ellipsis-menu"
                  trigger={
                    <button className="ellipsis-btn" title="More actions" aria-label={`More actions for ${station.location}`}>⋮</button>
                  }
                >
                  <button
                    className="menu-item"
                    onClick={() => window.open(willyWeatherUrl, '_blank', 'noopener,noreferrer')}
                  >
                    View on WillyWeather
                  </button>
                  <button className="menu-item destructive" onClick={() => onDelete(station)}>Delete</button>
                </Dropdown>
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}