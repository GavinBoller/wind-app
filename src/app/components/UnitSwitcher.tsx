"use client";

import React from 'react';
import { useSettings, SpeedUnit } from '../../context/SettingsContext';

export default function UnitSwitcher() {
  const { speedUnit, setSpeedUnit } = useSettings();
  const units: SpeedUnit[] = ['knots', 'km/h', 'mph'];

  return (
    <div className="unit-switcher-container">
      <span className="unit-switcher-label">Units</span>
      <div className="unit-switcher-group">
        {units.map((unit) => (
          <button
            key={unit}
            className={`unit-switcher-btn ${speedUnit === unit ? 'active' : ''}`}
            onClick={() => setSpeedUnit(unit)}
          >
            {unit}
          </button>
        ))}
      </div>
    </div>
  );
}