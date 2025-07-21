"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

import type { SortOrder } from '../types';

export type SpeedUnit = 'knots' | 'km/h' | 'mph';
export type ColorTheme = 'default' | 'inverted'; // default: strong=red, inverted: strong=green

interface SettingsContextType {
  speedUnit: SpeedUnit;
  setSpeedUnit: (unit: SpeedUnit) => void;
  colorTheme: ColorTheme;
  setColorTheme: (theme: ColorTheme) => void;
  sortOrder: SortOrder;
  setSortOrder: (order: SortOrder) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [speedUnit, setSpeedUnitState] = useState<SpeedUnit>('knots'); // Default to knots
  const [colorTheme, setColorThemeState] = useState<ColorTheme>('inverted'); // Default for wind sport enthusiasts
  const [sortOrder, setSortOrderState] = useState<SortOrder>('alphabetical'); // Default sort

  // On initial client-side load, check localStorage for a saved preference
  useEffect(() => {
    const savedUnit = localStorage.getItem('wind-app-speed-unit') as SpeedUnit;
    if (savedUnit && ['knots', 'km/h', 'mph'].includes(savedUnit)) {
      setSpeedUnitState(savedUnit);
    }
    const savedTheme = localStorage.getItem('wind-app-color-theme') as ColorTheme;
    if (savedTheme && ['default', 'inverted'].includes(savedTheme)) {
      setColorThemeState(savedTheme);
    }
    const savedSortOrder = localStorage.getItem('wind-app-sort-order') as SortOrder;
    if (savedSortOrder && ['alphabetical', 'wind_speed', 'latitude', 'last_updated'].includes(savedSortOrder)) {
      setSortOrderState(savedSortOrder);
    }
  }, []);

  const setSpeedUnit = (unit: SpeedUnit) => {
    localStorage.setItem('wind-app-speed-unit', unit);
    setSpeedUnitState(unit);
  };

  const setColorTheme = (theme: ColorTheme) => {
    localStorage.setItem('wind-app-color-theme', theme);
    setColorThemeState(theme);
  };

  const setSortOrder = (order: SortOrder) => {
    localStorage.setItem('wind-app-sort-order', order);
    setSortOrderState(order);
  };

  return (
    <SettingsContext.Provider value={{ speedUnit, setSpeedUnit, colorTheme, setColorTheme, sortOrder, setSortOrder }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};