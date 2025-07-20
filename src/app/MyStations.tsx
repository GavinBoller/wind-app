"use client";
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import SignInButton from "./components/SignInButton";
import WindArrow from "./components/WindArrow";
import ObservationTime from "./components/ObservationTime";
import SignOutButton from "./components/SignOutButton";
import { useSession } from "next-auth/react";
import type { SessionUser } from "../lib/session";
import AddStationForm from "./components/AddStationForm";
import { useStations } from "../hooks/useStations";
import StationCardSkeleton from "./components/StationCardSkeleton";
import Dropdown from "./components/Dropdown";
import { usePullToRefresh } from "../hooks/usePullToRefresh";
import SettingsIcon from "./components/SettingsIcon";
import ConfirmationModal from "./components/ConfirmationModal";
import Modal from "./components/Modal";
import type { Location, Station } from '../types';
import UnitSwitcher from "./components/UnitSwitcher";
import ColorThemeSwitcher from "./components/ColorThemeSwitcher";
import { useSettings, SpeedUnit } from "../context/SettingsContext";
import { getWindSpeedClass, convertSpeed } from '../lib/utils';

export default function MyStations() {
  const { data: session, status } = useSession();
  const { data: stations, error: swrError, isLoading: isLoadingStations, mutate } = useStations();
  const { speedUnit, colorTheme } = useSettings();
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isAddStationModalOpen, setAddStationModalOpen] = useState(false);
  const [stationToDelete, setStationToDelete] = useState<Station | null>(null);

  const userId = (session?.user as SessionUser | undefined)?.id;
  const error = swrError ? swrError.message : formError;

  // Update lastRefreshed whenever new station data arrives
  useEffect(() => {
    if (stations && !isLoadingStations) {
      setLastRefreshed(new Date());
    }
  }, [stations, isLoadingStations]);

  const handleRefresh = useCallback(async () => {
    await mutate();
  }, [mutate]);

  const { isRefreshing, pullY } = usePullToRefresh(handleRefresh);

  const confirmDelete = async () => {
    if (!stationToDelete) return;
    try {
      const res = await fetch(`/api/user-stations?stationId=${stationToDelete.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to delete station.");
      }
      mutate(); // Revalidate the data
      setStationToDelete(null); // Close the modal
    } catch (err: any) {
      setFormError(err.message);
      setStationToDelete(null); // Close the modal even on error
    }
  };

  const savedLocationsForForm = useMemo(() => stations?.map(s => ({ id: parseInt(s.id, 10), name: s.location, hasWindObservations: true })) ?? [], [stations]);

  if (status === "loading" || (status === "authenticated" && isLoadingStations && !stations)) {
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

  if (!session || !session.user || !userId) {
    return (
      <div className="my-stations-container">
        <h1 className="title">Wind App</h1>
        <p>Please sign in to access your stations.</p>
        <SignInButton />
      </div>
    );
  }

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

      <div className="header">
        <h1 className="title">Wind App</h1>
        <div className="settings-menu-container">
          <Dropdown
            contentClassName="ellipsis-menu"
            trigger={<SettingsIcon className="settings-icon" />}
          >
            <UnitSwitcher />
            <ColorThemeSwitcher />
            <button
              className="menu-item" // Neutral action
              onClick={() => setAddStationModalOpen(true)}
            >
              Add New Station
            </button>
            <SignOutButton className="menu-item destructive" />
          </Dropdown>
        </div>
      </div>
      {error && (
        <div className="alert-card" role="alert">
          <span>{error}</span>
          <button
            className="alert-close-btn"
            aria-label="Close error"
            onClick={() => setFormError(null)}
          >
            ×
          </button>
        </div>
      )}
      <div className="stations-list">
        <div className="stations-header">
          <h2 className="stations-title">My Stations</h2>
          {lastRefreshed && !isLoadingStations && !isRefreshing && (
            <span className="last-refreshed">
              Last updated: {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
        {isLoadingStations && !stations ? (
          [...Array(3)].map((_, i) => <StationCardSkeleton key={i} />)
        ) : stations && stations.length === 0 ? (
          <div className="stations-empty">No stations added yet.</div>
        ) : (
          (stations || []).map((station) => {
            const { rangeValue, unitLabel } = convertSpeed(station.windSpeed, station.windGust, speedUnit);
            return (
              <div key={station.id} className="alert-card station-row">
                <div className="location">{station.location}</div>
                <div className="station-data-row">
                  <div className="wind-info">
                    <div className="wind-direction">
                      <span className="wind-text">{station.directionText || "N/A"}</span>
                      <WindArrow className="wind-arrow" directionDegrees={station.directionDegrees || 0} />
                    </div>
                  </div>
                  <div className="station-windrange-col">
                    <div className="wind-range">
                      <span className={`wind-range-value ${getWindSpeedClass(station.windSpeed, colorTheme)}`}>
                        {rangeValue}
                      </span>
                      <span className="wind-range-unit"> {unitLabel}</span>
                    </div>
                    <ObservationTime observationTime={station.observationTime} timeZone={station.timeZone} />
                  </div>
                  <div className="station-actions">
                    <Dropdown
                      contentClassName="ellipsis-menu"
                      trigger={
                        <button
                          className="ellipsis-btn"
                          title="More actions"
                          aria-label={`More actions for ${station.location}`}
                        >
                          ⋮
                        </button>
                      }
                    >
                      <button
                        className="menu-item destructive"
                        onClick={() => setStationToDelete(station)}
                      >
                        Delete
                      </button>
                    </Dropdown>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      <Modal
        isOpen={isAddStationModalOpen}
        onClose={() => setAddStationModalOpen(false)}
        title="Add New Station"
      >
        <AddStationForm
          onStationAdded={mutate}
          savedLocations={savedLocationsForForm}
          setGlobalError={setFormError}
          onClose={() => setAddStationModalOpen(false)}
          isModal={true}
        />
      </Modal>
      <ConfirmationModal
        isOpen={!!stationToDelete}
        onClose={() => setStationToDelete(null)}
        onConfirm={confirmDelete}
        title="Delete Station"
        message={`Are you sure you want to delete "${stationToDelete?.location}"? This action cannot be undone.`}
      />
    </div>
  );
}