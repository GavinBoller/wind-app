import React from 'react';

export default function StationCardSkeleton() {
  return (
    <div className="alert-card station-row animate-pulse">
      <div className="location bg-gray-300 h-6 w-3/4 rounded"></div>
      <div className="station-data-row">
        <div className="wind-info">
          <div className="bg-gray-300 h-5 w-16 rounded"></div>
        </div>
        <div className="station-windrange-col">
          <div className="bg-gray-300 h-5 w-24 rounded mb-1"></div>
          <div className="bg-gray-300 h-4 w-20 rounded"></div>
        </div>
      </div>
    </div>
  );
}