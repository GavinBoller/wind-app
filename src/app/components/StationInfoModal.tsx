import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import TideChart from './TideChart';
import type { Station, StationInfo } from '@/types';
import { useSettings } from '../../context/SettingsContext';
import { convertSpeed } from '../../lib/utils';

interface StationInfoModalProps {
  station: Station | null;
  onClose: () => void;
}

const formatTime = (date: Date, timeZone?: string) => {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone });
};

const formatTimeUntil = (date: Date) => {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (diffHours > 0) {
    return `in ${diffHours}h ${diffMinutes}m`;
  }
  return `in ${diffMinutes}m`;
};

export default function StationInfoModal({ station, onClose }: StationInfoModalProps) {
  const [stationInfo, setStationInfo] = useState<StationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { speedUnit } = useSettings();

  useEffect(() => {
    if (station) {
      const fetchStationInfo = async () => {
        setIsLoading(true);
        setError(null);
        setStationInfo(null);
        try {
          const res = await fetch(`/api/tide-info?stationId=${station.id}`);
          if (!res.ok) {
            const errorText = await res.text();
            throw new Error(errorText || 'Failed to fetch station info.');
          }
          const data: StationInfo = await res.json();
          console.log(`Station Info for ${station.location}:`, data);
          setStationInfo(data);
        } catch (err: any) {
          setError(err.message);
        } finally {
          setIsLoading(false);
        }
      };

      fetchStationInfo();
    }
  }, [station]);

  if (!station) return null;

  const renderContent = () => {
    if (isLoading) {
      return <div className="info-modal-loading">Loading station info...</div>;
    }

    if (error) {
      return <div className="info-modal-error">Error: {error}</div>;
    }

    if (!stationInfo) {
      return null; // Or some other placeholder
    }

    const { tideData, tideLocationName, currentTemp, apparentTemp, tempMin, tempMax, windMin, windMax } = stationInfo;
    const nextTideDate = tideData ? new Date(tideData.nextTide.dateTime) : null;
    const previousTideDate = tideData?.previousTide ? new Date(tideData.previousTide.dateTime) : null;

    let windRangeDisplay = null;
    if (windMin !== undefined && windMax !== undefined) {
      // API provides wind forecast in km/h. Convert to knots to use existing utility.
      const windMinKnots = windMin / 1.852;
      const windMaxKnots = windMax / 1.852;
      const { rangeValue, unitLabel } = convertSpeed(windMinKnots, windMaxKnots, speedUnit);
      windRangeDisplay = (
        <div className="temp-range"> {/* Re-using temp-range style */}
          <span>Wind: </span>
          <strong>{rangeValue} {unitLabel}</strong>
        </div>
      );
    }

    return (
      <div className="station-info-modal-content">
        {(currentTemp !== undefined || tempMin !== undefined || windMin !== undefined) && (
          <div className="weather-info">
            <div className="weather-header">Weather</div>
            {currentTemp !== undefined && (
              <div className="current-temp">
                <span>Now: </span>
                <strong>{Math.round(currentTemp)}°C</strong>
                {apparentTemp !== undefined && (
                  <span className="apparent-temp"> (feels like {Math.round(apparentTemp)}°C)</span>
                )}
              </div>
            )}
            {tempMin !== undefined && tempMax !== undefined && (
              <div className="temp-range">
                <span>Today: </span>
                <strong>{Math.round(tempMin)}° / {Math.round(tempMax)}°</strong>
              </div>
            )}
            {windRangeDisplay}
          </div>
        )}

        {tideData && (
          <div className="tide-info">
            <div className="tide-header">
              Tides
              {tideLocationName && tideLocationName !== station.location && (
                <span className="tide-location-name"> for {tideLocationName}</span>
              )}
            </div>
            {tideData.tideChartData && tideData.tideChartData.length > 0 && (
              <TideChart data={tideData.tideChartData} timeZone={station.timeZone} />
            )}
            {tideData.previousTide && previousTideDate && (
              <div className="last-tide-info">
                <div className="last-tide-header">
                  Last {tideData.previousTide.type === 'high' ? 'High' : 'Low'} Tide
                </div>
                <div className="last-tide-details">
                  {formatTime(previousTideDate, station.timeZone)} ({tideData.previousTide.height}m)
                </div>
              </div>
            )}
            <div className="tide-status">
              {tideData.status !== 'unknown' && (
                <span className={`tide-arrow ${tideData.status}`}>
                  {tideData.status === 'rising' ? '↑' : '↓'}
                </span>
              )}
              <span className="tide-status-text">
                Currently {tideData.status}
              </span>
            </div>

            {nextTideDate && (
              <div className="next-tide-info">
                <div className="next-tide-header">
                  Next {tideData.nextTide.type === 'high' ? 'High' : 'Low'} Tide
                </div>
                <div className="next-tide-time-until">
                  {formatTimeUntil(nextTideDate)}
                </div>
                <div className="next-tide-time">
                  at {formatTime(nextTideDate, station.timeZone)}
                </div>
                <div className="next-tide-height">
                  Height: {tideData.nextTide.height}m
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <Modal isOpen={!!station} onClose={onClose} title={`Info: ${station.location}`}>
      <div className="tide-info-modal">
        {renderContent()}
      </div>
    </Modal>
  );
}