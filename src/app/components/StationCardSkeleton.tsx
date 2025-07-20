import React from 'react';

export default function StationCardSkeleton() {
  return (
    <div className="alert-card station-row">
      <div className="location skeleton-box h-6 w-3-4"></div>
      <div className="station-data-row">
        <div className="wind-info">
          <div className="skeleton-box h-5 w-16"></div>
        </div>
        <div className="station-windrange-col">
          <div className="skeleton-box h-5 w-24 mb-1"></div>
          <div className="skeleton-box h-4 w-20"></div>
        </div>
      </div>
    </div>
  );
}