"use client";

import React from 'react';
import StationCardSkeleton from './StationCardSkeleton';

export default function LoadingView() {
  return (
    <div className="my-stations-container">
      {/* The pt-28 is to account for the fixed header */}
      <div className="stations-list pt-28">
        <h2 className="stations-title">My Stations</h2>
        {[...Array(3)].map((_, i) => <StationCardSkeleton key={i} />)}
      </div>
    </div>
  );
}