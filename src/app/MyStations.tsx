"use client";
import React, { useState, useEffect, useRef } from "react";
import SignInButton from "./components/SignInButton";
import WindArrow from "./components/WindArrow";
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
  windSpeed: number;
  windGust: number;
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

  const getUserId = () => {
    if (!session || !session.user) return undefined;
    const id = (session.user as any).id;
    if (!id) return undefined;
    const numId = typeof id === "number" ? id : parseInt(id, 10);
    return isNaN(numId) ? undefined : numId;
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
          setSavedLocations(
            data.map((us: any) => ({
              id: us.stationId || (us.station && us.station.id),
              name: us.station?.name || "",
              hasWindObservations: true,
            }))
          );
        })
        .catch((err) => setError(err.message));
    } else {
      setSavedLocations([]);
    }
  }, [session, userId]);

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

  useEffect(() => {
    if (savedLocations.length > 0) {
      setError(null);
      setStations([]);
      Promise.all(
        savedLocations.map((loc) =>
          fetch(`/api/willyweather?id=${loc.id}&type=observations`)
            .then((res) => {
              if (!res.ok)
                throw new Error(`Failed to fetch observations for ${loc.name}`);
              return res.json();
            })
            .then((data) => {
              const speedKmh = data.observational?.observations?.wind?.speed || 0;
              const gustKmh = data.observational?.observations?.wind?.gustSpeed || 0;
              const speedKnots = speedKmh ? speedKmh / 1.852 : 0;
              const gustKnots = gustKmh ? gustKmh / 1.852 : 0;
              return {
                id: loc.id.toString(),
                location: loc.name,
                directionText: data.observational?.observations?.wind?.directionText || "N/A",
                directionDegrees: data.observational?.observations?.wind?.direction || 0,
                range: `${speedKnots.toFixed(1)} - ${gustKnots.toFixed(1)} knots`,
                windSpeed: speedKnots,
                windGust: gustKnots,
              };
            })
            .catch(() => null)
        )
      )
        .then((results) => setStations(results.filter(Boolean) as Station[]))
        .catch((err) => setError(err.message));
    } else {
      setStations([]);
    }
  }, [savedLocations]);

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
          setSavedLocations((prev) => [
            ...prev,
            { id: selectedLocation.id, name: selectedLocation.name, hasWindObservations: true },
          ]);
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
      <div className="header">
        <h1 className="title">Wind App</h1>
        <div className="search-section search-row-right">
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
              <div className="station-row-flex">
                <div className="location">{station.location}</div>
                <div className="wind-info">
                  <div className="wind-direction">
                    <span className="wind-text">{station.directionText || "N/A"}</span>
                    <div className="wind-arrow">
                      <WindArrow directionDegrees={station.directionDegrees || 0} />
                    </div>
                  </div>
                </div>
                <div className="right-group">
                  <div className="station-windrange-col">
                    <span className="wind-range">
                      {station.range || `${station.windSpeed.toFixed(1)} - ${station.windGust.toFixed(1)} knots`}
                    </span>
                  </div>
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
                      style={{ position: "absolute", right: "0", top: "100%" }}
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
                        Delete station
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