"use client";

import React from 'react';
import type { Station } from '../../types';
import { useSettings } from '../../context/SettingsContext';
import { getWindSpeedClass, convertSpeed } from '../../lib/utils';
import WindArrow from './WindArrow';
import ObservationTime from './ObservationTime';
import Dropdown from './Dropdown';

interface StationListProps {
  stations: Station[];
  onDelete: (station: Station) => void;
  onDirectionHover: (stationId: string | null) => void;
  onDirectionClick: (stationId: string) => void;
  stationWithExactDegrees: string | null;
}

export default function StationList({
  stations,
  onDelete,
  onDirectionHover,
  onDirectionClick,
  stationWithExactDegrees,
}: StationListProps) {
  const { speedUnit, colorTheme } = useSettings();

  if (stations.length === 0) {
    return <div className="stations-empty">No stations added yet.</div>;
  }

  return (
    <>
      {stations.map((station) => {
        const { rangeValue, unitLabel } = convertSpeed(station.windSpeed, station.windGust, speedUnit);
        return (
          <div key={station.id} className="alert-card station-row">
            <div className="location">{station.location}</div>
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