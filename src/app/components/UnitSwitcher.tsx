"use client";

import React from 'react';
import { useSettings, SpeedUnit } from '../../context/SettingsContext';

export default function UnitSwitcher() {
  const { speedUnit, setSpeedUnit } = useSettings();
  const units: SpeedUnit[] = ['knots', 'km/h', 'mph'];

  return (
    <div className="settings-group-container">
      <span className="settings-group-label">Units</span>
      <div className="settings-group">
        {units.map((unit) => (
          <button
            key={unit}
            className={`settings-group-btn ${speedUnit === unit ? 'active' : ''}`}
            onClick={() => setSpeedUnit(unit)}
          >
            {unit}
          </button>
        ))}
      </div>
    </div>
  );
}