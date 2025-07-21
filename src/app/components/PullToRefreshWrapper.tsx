"use client";

import React from 'react';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';

interface PullToRefreshWrapperProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

export default function PullToRefreshWrapper({ onRefresh, children }: PullToRefreshWrapperProps) {
  const { isRefreshing, pullY } = usePullToRefresh(onRefresh);

  return (
    <div className="my-stations-container">
      <div className="refresh-container">
        <div
          className={`refresh-indicator ${isRefreshing ? 'refreshing' : ''}`}
          style={{
            opacity: Math.min(pullY / 80, 1),
            transform: `rotate(${pullY * 2.5}deg)`,
          }}
        >
          <svg className="refresh-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10"></polyline>
            <polyline points="1 20 1 14 7 14"></polyline>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
          </svg>
        </div>
      </div>
      {children}
    </div>
  );
}