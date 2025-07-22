"use client";

import React from 'react';
import { signOut } from 'next-auth/react';
import { useSettings } from '../../context/SettingsContext';
import Dropdown from './Dropdown';

interface PageHeaderProps {
  onAddStationClick: () => void;
  onRefreshClick: () => void;
}

// A more standard gear icon for settings
const SettingsIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const SignOutButton = () => (
  <button className="menu-item destructive" onClick={() => signOut()}>
    Sign Out
  </button>
);

export default function PageHeader({ onAddStationClick, onRefreshClick }: PageHeaderProps) {
  const {
    speedUnit,
    setSpeedUnit,
    colorTheme,
    setColorTheme,
    sortOrder,
    setSortOrder,
  } = useSettings();

  const sortOptions = [
    { key: "alphabetical", label: "A-Z" },
    { key: "wind_speed", label: "Windiest" },
    { key: "latitude", label: "N ↓ S" },
    { key: "last_updated", label: "Recent" },
  ];

  return (
    <div className="header">
      <h1 className="title">Wind sniff</h1>
      <div className="settings-menu-container">
        <Dropdown
          contentClassName="ellipsis-menu"
          trigger={<SettingsIcon className="settings-icon" />}
        >
          <button className="menu-item" onClick={onAddStationClick}>Add New Station</button>
          <button className="menu-item" onClick={onRefreshClick}>Refresh Data</button>
          <div className="menu-separator"></div>
          <div className="settings-group-container">
            <span className="settings-group-label">Units</span>
            <div className="settings-group">
              {['knots', 'km/h', 'mph'].map(unit => (
                <button
                  key={unit}
                  className={`settings-group-btn ${speedUnit === unit ? 'active' : ''}`}
                  onClick={() => setSpeedUnit(unit as any)}
                >
                  {unit}
                </button>
              ))}
            </div>
          </div>
          <div className="settings-group-container">
            <span className="settings-group-label">Colour Meaning</span>
            <div className="settings-group">
              <button
                className={`settings-group-btn ${colorTheme === 'inverted' ? 'active' : ''}`}
                onClick={() => setColorTheme('inverted')}
              >
                Green = Windy
              </button>
              <button
                className={`settings-group-btn ${colorTheme === 'default' ? 'active' : ''}`}
                onClick={() => setColorTheme('default')}
              >
                Red = Windy
              </button>
            </div>
          </div>
          <div className="settings-group-container">
            <span className="settings-group-label">Sort Stations By</span>
            <div className="settings-group">
              {sortOptions.map(({ key, label }) => (
                <button
                  key={key}
                  className={`settings-group-btn ${sortOrder === key ? 'active' : ''}`}
                  onClick={() => setSortOrder(key as any)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="menu-separator"></div>
          <SignOutButton />
        </Dropdown>
      </div>
    </div>
  );
}