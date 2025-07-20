"use client";

import React from 'react';
import { useSettings, ColorTheme } from '../../context/SettingsContext';

export default function ColorThemeSwitcher() {
  const { colorTheme, setColorTheme } = useSettings();

  const handleThemeChange = (theme: ColorTheme) => {
    setColorTheme(theme);
  };

  return (
    <div className="settings-group-container">
      <span className="settings-group-label">Color Meaning</span>
      <div className="settings-group">
        <button
          className={`settings-group-btn ${colorTheme === 'inverted' ? 'active' : ''}`}
          onClick={() => handleThemeChange('inverted')}
        >
          Green = Windy
        </button>
        <button
          className={`settings-group-btn ${colorTheme === 'default' ? 'active' : ''}`}
          onClick={() => handleThemeChange('default')}
        >
          Red = Windy
        </button>
      </div>
    </div>
  );
}