"use client";

import React from 'react';
import { useSettings } from '../../context/SettingsContext';
import type { SortOrder } from '../../types';

const sortOptions: { key: SortOrder; label: string }[] = [
  { key: 'alphabetical', label: 'A-Z' },
  { key: 'wind_speed', label: 'Windiest' },
  { key: 'latitude', label: 'N ↓ S' },
  { key: 'last_updated', label: 'Recent' },
];

export default function SortSwitcher() {
  const { sortOrder, setSortOrder } = useSettings();

  return (
    <div className="settings-group-container">
      <span className="settings-group-label">Sort Stations By</span>
      <div className="settings-group">
        {sortOptions.map(({ key, label }) => (
          <button
            key={key}
            className={`settings-group-btn ${sortOrder === key ? 'active' : ''}`}
            onClick={() => setSortOrder(key)}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}