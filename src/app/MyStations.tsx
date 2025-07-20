"use client";
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import SignInButton from "./components/SignInButton";
import WindArrow from "./components/WindArrow";
import ObservationTime from "./components/ObservationTime";
import SignOutButton from "./components/SignOutButton";
import { useSession } from "next-auth/react";
import type { SessionUser } from "@/lib/session";
import AddStationForm from "./components/AddStationForm";
import { useStations } from "@/hooks/useStations";

interface Location {
  id: number;
  name: string;
  hasWindObservations: boolean;
}

interface Station {
  id: string;
  location: string;
  directionText: string;
  directionDegrees: number;
  range: string;
  rangeValue: string;
  windSpeed: number;
  windGust: number;
  observationTime?: string;
  timeZone?: string;
}

export default function MyStations() {
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const menuRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const menuButtonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const menuListRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const { data: session, status } = useSession();
  const { data: stations, error: swrError, isLoading: isLoadingStations, mutate } = useStations();
  const [formError, setFormError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullY, setPullY] = useState(0);
  const touchStartRef = useRef(0);

  const userId = (session?.user as SessionUser | undefined)?.id;
  const error = swrError ? swrError.message : formError;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuOpen && menuRefs.current[menuOpen]) {
        if (!menuRefs.current[menuOpen]?.contains(event.target as Node)) {
          setMenuOpen(null);
        }
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (window.scrollY === 0) {
      touchStartRef.current = e.touches[0].clientY;
    } else {
      touchStartRef.current = 0;
    }
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (touchStartRef.current > 0) {
      const dy = e.touches[0].clientY - touchStartRef.current;
      if (dy > 0) e.preventDefault();
      setPullY(dy > 0 ? dy : 0);
    }
  }, []);

  const handleDelete = async (stationId: string) => {
    try {
      const res = await fetch(`/api/user-stations?stationId=${stationId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to delete station.");
      }
      // Revalidate the data after deletion
      mutate();
    } catch (err: any) {
      setFormError(err.message);
    }
  };

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await mutate(); // This is the key to re-fetching with SWR
    // Add a small delay to let the animation finish
    setTimeout(() => setIsRefreshing(false), 500);
  }, [mutate]);

  const handleTouchEnd = useCallback(() => {
    touchStartRef.current = 0;
    setPullY(0);
    if (pullY > 100) { // Refresh threshold
      handleRefresh();
    }
  }, [pullY, handleRefresh]);

  const savedLocationsForForm = useMemo(() => stations?.map(s => ({ id: parseInt(s.id, 10), name: s.location, hasWindObservations: true })) ?? [], [stations]);

  useEffect(() => {
    const options = { passive: false };
    window.addEventListener('touchstart', handleTouchStart, options);
    window.addEventListener('touchmove', handleTouchMove, options);
    window.addEventListener('touchend', handleTouchEnd, options);
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  if (status === "loading" || (status === "authenticated" && isLoadingStations && !stations)) {
    return <div className="my-stations-container"><div>Loading...</div></div>;
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
        <div className="search-section">
          <AddStationForm
            onStationAdded={mutate}
            savedLocations={savedLocationsForForm}
            setGlobalError={setFormError}
          />
        </div>
        <SignOutButton />
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
        <h2 className="stations-title">My Stations</h2>
        {stations && stations.length === 0 ? (
          <div className="stations-empty">No stations added yet.</div>
        ) : (
          (stations || []).map((station) => (
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
                      <span className="wind-range-value">{station.rangeValue}</span>
                      <span className="wind-range-unit"> knots</span>
                    </div>
                    <ObservationTime observationTime={station.observationTime} timeZone={station.timeZone} />
                  </div>
                  <div className="station-actions">
                    <button
                      className="ellipsis-btn"
                      title="More actions"
                      aria-label={`More actions for ${station.location}`}
                      aria-haspopup="menu"
                      aria-expanded={menuOpen === station.id}
                      aria-controls={`menu-${station.id}`}
                      ref={(el) => {
                        menuButtonRefs.current[station.id] = el;
                      }}
                      onClick={() =>
                        setMenuOpen(menuOpen === station.id ? null : station.id)
                      }
                    >
                      ⋮
                    </button>
                    {menuOpen === station.id && (
                      <div
                        ref={(el) => {
                          menuRefs.current[station.id] = el;
                          menuListRefs.current[station.id] = el;
                        }}
                        className="ellipsis-menu"
                        id={`menu-${station.id}`}
                        role="menu"
                        tabIndex={-1}
                      >
                        <button
                          className="ellipsis-menu-item"
                          role="menuitem"
                          tabIndex={0}
                          onClick={() => {
                            setMenuOpen(null);
                            handleDelete(station.id);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              setMenuOpen(null);
                              handleDelete(station.id);
                            }
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
}