import React from 'react';
import Modal from './Modal';
import type { Station } from '@/types';

interface TideInfoModalProps {
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

export default function TideInfoModal({ station, onClose }: TideInfoModalProps) {
  if (!station || !station.tideInfo) return null;

  const { status, nextTide, previousTide } = station.tideInfo;
  const nextTideDate = new Date(nextTide.dateTime);
  const previousTideDate = previousTide ? new Date(previousTide.dateTime) : null;

  return (
    <Modal isOpen={!!station} onClose={onClose} title={`Tide Info: ${station.location}`}>
      <div className="tide-info-modal">
        {previousTide && previousTideDate && (
          <div className="last-tide-info">
            <div className="last-tide-header">
              Last {previousTide.type === 'high' ? 'High' : 'Low'} Tide
            </div>
            <div className="last-tide-details">
              {formatTime(previousTideDate, station.timeZone)} ({previousTide.height}m)
            </div>
          </div>
        )}
        <div className="tide-status">
          {status !== 'unknown' && (
            <span className={`tide-arrow ${status}`}>
              {status === 'rising' ? '↑' : '↓'}
            </span>
          )}
          <span className="tide-status-text">
            Currently {status}
          </span>
        </div>

        <div className="next-tide-info">
          <div className="next-tide-header">
            Next {nextTide.type === 'high' ? 'High' : 'Low'} Tide
          </div>
          <div className="next-tide-time-until">
            {formatTimeUntil(nextTideDate)}
          </div>
          <div className="next-tide-time">
            at {formatTime(nextTideDate, station.timeZone)}
          </div>
          <div className="next-tide-height">
            Height: {nextTide.height}m
          </div>
        </div>
      </div>
    </Modal>
  );
}