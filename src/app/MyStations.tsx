"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import AddStationForm from "./components/AddStationForm";
import { useStations } from "../hooks/useStations";
import ConfirmationModal from "./components/ConfirmationModal";
import Modal from "./components/Modal";
import type { Station } from '../types';
import StationInfoModal from './components/StationInfoModal';
import StationList from "./components/StationList";
import UnauthorizedView from "./components/UnauthorizedView";
import LoadingView from "./components/LoadingView";
import PageHeader from "./components/PageHeader";
import PullToRefreshWrapper from "./components/PullToRefreshWrapper";
import { useSettings } from "../context/SettingsContext";
import { sortStations } from '../lib/utils';

export default function MyStations() {
  const { data: session, status } = useSession();
  const { data: stations, error: swrError, isLoading: isLoadingStations, mutate } = useStations();
  const { sortOrder } = useSettings();
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isAddStationModalOpen, setAddStationModalOpen] = useState(false);
  const [stationToDelete, setStationToDelete] = useState<Station | null>(null);
  const [hoveredStationId, setHoveredStationId] = useState<string | null>(null);
  const [clickedStationId, setClickedStationId] = useState<string | null>(null);
  const [infoStation, setInfoStation] = useState<Station | null>(null);

  const userId = session?.user?.id;
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

  const handleDirectionClick = (stationId: string) => {
    // If the same one is clicked again, do nothing, just let the timer run out
    if (clickedStationId === stationId) return;

    setClickedStationId(stationId);
    setTimeout(() => {
      // Check if the value is still the same before clearing it, to avoid race conditions
      setClickedStationId(currentId => (currentId === stationId ? null : currentId));
    }, 3000); // Hide after 3 seconds
  };

  const handleDirectionHover = (stationId: string | null) => {
    setHoveredStationId(stationId);
  };

  const stationWithExactDegrees = clickedStationId || hoveredStationId;

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

  const sortedStations = useMemo(() => {
    if (!stations) return [];
    return sortStations(stations, sortOrder);
  }, [stations, sortOrder]);

  if (status === "loading" || (status === "authenticated" && isLoadingStations && !stations)) {
    return <LoadingView />;
  }

  if (!session || !session.user || !userId) {
    return <UnauthorizedView />;
  }

  return (
    <PullToRefreshWrapper onRefresh={handleRefresh}>
      <PageHeader onAddStationClick={() => setAddStationModalOpen(true)} onRefreshClick={handleRefresh} />
      {error && (
        <div className="card alert-card" role="alert">
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
          {lastRefreshed && !isLoadingStations && (
            <span className="last-refreshed">
              Last updated: {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
        {stations && (
          <StationList
            stations={sortedStations}
            onDelete={setStationToDelete}
            onDirectionClick={handleDirectionClick}
            onDirectionHover={handleDirectionHover}
            stationWithExactDegrees={stationWithExactDegrees}
            onInfoClick={setInfoStation}
          />
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
      <StationInfoModal
        station={infoStation}
        onClose={() => setInfoStation(null)}
      />
    </PullToRefreshWrapper>
  );
}