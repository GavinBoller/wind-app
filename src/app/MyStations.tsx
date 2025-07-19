"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import SignInButton from "./components/SignInButton";
import WindArrow from "./components/WindArrow";
import ObservationTime from "./components/ObservationTime";
import SignOutButton from "./components/SignOutButton";
import { useSession } from "next-auth/react";

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
  const [savedLocations, setSavedLocations] = useState<Location[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullY, setPullY] = useState(0);
  const touchStartRef = useRef(0);

  const getUserId = () => {
    return session?.user?.id;
  };
  const userId = getUserId();

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

  const fetchStationData = useCallback(async (loc: Location): Promise<Station | null> => {
    try {
      const res = await fetch(`/api/willyweather?id=${loc.id}&type=observations`);
      if (!res.ok) throw new Error(`Failed to fetch observations for ${loc.name}`);
      const data = await res.json();
      const speedKmh = data.observational?.observations?.wind?.speed || 0;
      const gustKmh = data.observational?.observations?.wind?.gustSpeed || 0;
      const speedKnots = speedKmh ? speedKmh / 1.852 : 0;
      const gustKnots = gustKmh ? gustKmh / 1.852 : 0;
      return {
        id: loc.id.toString(),
        location: loc.name,
        directionText: data.observational?.observations?.wind?.directionText || "N/A",
        directionDegrees: data.observational?.observations?.wind?.direction || 0,
        range: `${Math.round(speedKnots)} - ${Math.round(gustKnots)} knots`,
        rangeValue: `${Math.round(speedKnots)} - ${Math.round(gustKnots)}`,
        windSpeed: speedKnots,
        windGust: gustKnots,
        observationTime: data.observational?.issueDateTime,
        timeZone: data.location?.timeZone,
      };
    } catch (err) {
      console.error(`Failed to fetch data for ${loc.name}`, err);
      return null;
    }
  }, []);

  const fetchAllStationData = useCallback((locationsToFetch: Location[]) => {
    if (locationsToFetch.length === 0) {
      setIsRefreshing(false);
      return;
    }
    setError(null);
    Promise.all(
      locationsToFetch.map((loc) => fetchStationData(loc))
    )
    .then((results) => setStations(results.filter(Boolean) as Station[]))
    .catch((err) => setError(err.message))
    .finally(() => {
      // Add a small delay to let the animation finish
      setTimeout(() => setIsRefreshing(false), 500);
    });
  }, [fetchStationData]);

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
        throw new Error(errData.error || "Failed to delete station");
      }
      setSavedLocations((prev) =>
        prev.filter((loc) => loc.id.toString() !== stationId.toString())
      );
      setStations((prev) => prev.filter((s) => s.id !== stationId));
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => {
    if (session && userId) {
      fetch("/api/user-stations")
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch saved stations");
          return res.json();
        })
        .then((data) => {
          const locations = data.map((us: any) => ({
            id: us.stationId || (us.station && us.station.id),
            name: us.station?.name || "",
            hasWindObservations: true,
          }));
          setSavedLocations(locations);
          if (locations.length > 0) {
            fetchAllStationData(locations);
          }
        })
        .catch((err) => setError(err.message));
    } else {
      setSavedLocations([]);
      setStations([]);
    }
  }, [session, userId, fetchAllStationData]);

  const handleTouchEnd = useCallback(() => {
    touchStartRef.current = 0;
    setPullY(0);
    if (pullY > 100) { // Refresh threshold
      setIsRefreshing(true);
      fetchAllStationData(savedLocations);
    }
  }, [pullY, fetchAllStationData, savedLocations]);

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

  useEffect(() => {
    if (searchTerm) {
      setError(null);
      fetch(`/api/willyweather?search=${encodeURIComponent(searchTerm)}`)
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch locations");
          return res.json();
        })
        .then((data) => {
          setLocations(data.map((loc: any) => ({ id: loc.id, name: loc.name })));
          setShowDropdown(true);
        })
        .catch((err) => setError(err.message));
    } else {
      setLocations([]);
      setShowDropdown(false);
    }
  }, [searchTerm]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedLocation) {
      if (savedLocations.some((l) => l.id === selectedLocation.id)) {
        setError("Location already added.");
        return;
      }
      try {
        const res = await fetch(
          `/api/willyweather?id=${selectedLocation.id}&type=info`
        );
        if (!res.ok)
          throw new Error(`Failed to fetch info for ${selectedLocation.name}`);
        const info = await res.json();
        const hasWind =
          info.observationalGraphTypes &&
          "wind" in info.observationalGraphTypes &&
          "wind-gust" in info.observationalGraphTypes;
        if (hasWind) {
          const stationPayload = {
            stationId: selectedLocation.id.toString(),
            name: selectedLocation.name,
            region: info.region || "",
            state: info.state || "",
            lat: info.lat || 0,
            lng: info.lng || 0,
          };
          const saveRes = await fetch("/api/user-stations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(stationPayload),
          });
          if (!saveRes.ok) {
            const errData = await saveRes.json();
            throw new Error(errData.error || "Failed to save station");
          }
          const newLocation = { id: selectedLocation.id, name: selectedLocation.name, hasWindObservations: true };
          setSavedLocations(prev => [...prev, newLocation]);

          // Fetch data for the new station and add it to the list
          const newStationData = await fetchStationData(newLocation);
          if (newStationData) {
            setStations(prev => [...prev, newStationData]);
          }

          setSelectedLocation(null);
          setSearchTerm("");
          setShowDropdown(false);
          setError(null);
        } else {
          setError("Selected location does not have wind data.");
        }
      } catch (err: any) {
        setError(err.message);
      }
    } else {
      setError("Please select a location first.");
    }
  };

  if (status === "loading") {
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
          <form onSubmit={handleAdd} className="search-form" autoComplete="off">
            <div className="autocomplete-container">
              <input
                type="text"
                placeholder="Search location..."
                value={selectedLocation ? selectedLocation.name : searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setSelectedLocation(null);
                  setShowDropdown(true);
                }}
                className="search-input"
                onFocus={() => {
                  if (locations.length > 0) setShowDropdown(true);
                }}
                onBlur={() => setTimeout(() => setShowDropdown(false), 120)}
                autoComplete="off"
              />
              {showDropdown && locations.length > 0 && !selectedLocation && (
                <ul className="autocomplete-dropdown">
                  {locations.map((loc) => (
                    <li
                      key={loc.id}
                      className="autocomplete-option"
                      onMouseDown={() => {
                        setSelectedLocation(loc);
                        setSearchTerm("");
                        setShowDropdown(false);
                      }}
                    >
                      {loc.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button type="submit" className="add-button small" disabled={!selectedLocation}>
              Add Location
            </button>
          </form>
        </div>
        <SignOutButton />
      </div>
      {error && (
        <div className="alert-card" role="alert">
          <span>{error}</span>
          <button
            className="alert-close-btn"
            aria-label="Close error"
            onClick={() => setError(null)}
          >
            ×
          </button>
        </div>
      )}
      <div className="stations-list">
        <h2 className="stations-title">My Stations</h2>
        {stations.length === 0 ? (
          <div className="stations-empty">No stations added yet.</div>
        ) : (
          stations.map((station) => (
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