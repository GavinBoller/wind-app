"use client";

import React from 'react';
import Dropdown from './Dropdown';
import SettingsIcon from './SettingsIcon';
import UnitSwitcher from './UnitSwitcher';
import ColorThemeSwitcher from './ColorThemeSwitcher';
import SortSwitcher from './SortSwitcher';
import SignOutButton from './SignOutButton';

interface PageHeaderProps {
  onAddStationClick: () => void;
  onRefreshClick: () => void;
}

export default function PageHeader({ onAddStationClick, onRefreshClick }: PageHeaderProps) {
  return (
    <div className="header">
      <h1 className="title">Wind App</h1>
      <div className="settings-menu-container">
        <Dropdown
          contentClassName="ellipsis-menu"
          trigger={<SettingsIcon className="settings-icon" />}
        >
          <UnitSwitcher />
          <ColorThemeSwitcher />
          <SortSwitcher />
          <button className="menu-item" onClick={onRefreshClick}>Refresh Data</button>
          <button className="menu-item" onClick={onAddStationClick}>Add New Station</button>
          <SignOutButton className="menu-item destructive" />
        </Dropdown>
      </div>
    </div>
  );
}