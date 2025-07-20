"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type SpeedUnit = 'knots' | 'km/h' | 'mph';

interface SettingsContextType {
  speedUnit: SpeedUnit;
  setSpeedUnit: (unit: SpeedUnit) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [speedUnit, setSpeedUnitState] = useState<SpeedUnit>('knots'); // Default to knots

  // On initial client-side load, check localStorage for a saved preference
  useEffect(() => {
    const savedUnit = localStorage.getItem('wind-app-speed-unit') as SpeedUnit;
    if (savedUnit && ['knots', 'km/h', 'mph'].includes(savedUnit)) {
      setSpeedUnitState(savedUnit);
    }
  }, []);

  const setSpeedUnit = (unit: SpeedUnit) => {
    localStorage.setItem('wind-app-speed-unit', unit);
    setSpeedUnitState(unit);
  };

  return (
    <SettingsContext.Provider value={{ speedUnit, setSpeedUnit }}>
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