"use client";

import React from 'react';
import type { Station } from '../../types';
import { useSettings } from '../../context/SettingsContext';
import { getWindSpeedClass, convertSpeed } from '../../lib/utils';
import WindArrow from './WindArrow';
import ObservationTime from './ObservationTime';
import Dropdown from './Dropdown';
import WindStationIcon from './WindStationIcon';
import TideIcon from './TideIcon';
import { generateWillyWeatherUrl } from '../../lib/willyweather';

interface StationListProps {
  stations: Station[];
  onDelete: (station: Station) => void;
  onDirectionHover: (stationId: string | null) => void;
  onDirectionClick: (stationId: string) => void;
  stationWithExactDegrees: string | null;
  onTideInfoClick: (station: Station) => void;
}

export default function StationList({
  stations,
  onDelete,
  onDirectionHover,
  onDirectionClick,
  stationWithExactDegrees,
  onTideInfoClick,
}: StationListProps) {
  const { speedUnit, colorTheme } = useSettings();

  if (stations.length === 0) {
    return <div className="stations-empty">No stations added yet.</div>;
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
                {(station.sourceStationDistance === undefined || station.sourceStationDistance < 1) && (
                  <WindStationIcon className="wind-station-indicator" title="True wind station" />
                )}
                {station.tideInfo && (
                  <TideIcon className="tide-indicator" onClick={() => onTideInfoClick(station)} />
                )}
              </div>
              {station.sourceStationName && station.sourceStationDistance !== undefined && station.sourceStationDistance >= 1 && (                
                <div className="source-station-info"> wind at
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