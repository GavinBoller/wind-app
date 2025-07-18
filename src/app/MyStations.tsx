"use client";
import React, { useState, useEffect } from "react";
import "./MyStations.css"; // Add a separate CSS file for scoped styles

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

const API_KEY = "MjExOWZlYWFmNGEyZTQzYTIyZDNlN2"; // Your API key
const BASE_URL = "https://api.willyweather.com.au/v2";

export default function MyStations() {
  const [savedLocations, setSavedLocations] = useState<Location[]>([]); // User's saved locations
  const [stations, setStations] = useState<Station[]>([]); // Wind data for saved locations
  const [searchTerm, setSearchTerm] = useState("");
  const [locations, setLocations] = useState<Location[]>([]); // Search results
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Search locations (no info API call yet)
  useEffect(() => {
    if (searchTerm) {
      setError(null);
      fetch(`/api/willyweather?search=${encodeURIComponent(searchTerm)}`)
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch locations");
          return res.json();
        })
        .then((data) => {
          // Just store id and name for now
          setLocations(data.map((loc: any) => ({ id: loc.id, name: loc.name })));
        })
        .catch((err) => setError(err.message));
    } else {
      setLocations([]);
    }
  }, [searchTerm]);


  // Step 2: Fetch wind data for all saved locations using the new observations endpoint
  useEffect(() => {
    if (savedLocations.length > 0) {
      setError(null);
      Promise.all(
        savedLocations.map((loc) =>
          fetch(`/api/willyweather/observations?id=${loc.id}`)
            .then((res) => {
              if (!res.ok) throw new Error(`Failed to fetch observations for ${loc.name}`);
              return res.json();
            })
            .then((data) => ({
              id: loc.id.toString(),
              location: loc.name,
              directionText: data.observational?.observations?.wind?.directionText || "N/A",
              directionDegrees: data.observational?.observations?.wind?.direction || 0,
              range: `${data.observational?.observations?.wind?.speed || 0} - ${data.observational?.observations?.wind?.gustSpeed || 0} km/h`,
              windSpeed: data.observational?.observations?.wind?.speed || 0,
              windGust: data.observational?.observations?.wind?.gustSpeed || 0,
            }))
        )
      )
        .then(setStations)
        .catch((err) => setError(err.message));
    } else {
      setStations([]);
    }
  }, [savedLocations]);

  // Add selected location to saved list (check for wind data now)
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedLocation) {
      const loc = locations.find((l) => l.id === selectedLocation);
      if (!loc) {
        setError("Please select a location.");
        return;
      }
      if (savedLocations.some((l) => l.id === loc.id)) {
        setError("Location already added.");
        return;
      }
      try {
        const res = await fetch(`/api/willyweather?id=${loc.id}&type=info`);
        if (!res.ok) throw new Error(`Failed to fetch info for ${loc.name}`);
        const info = await res.json();
        const hasWind = info.observationalGraphTypes &&
          "wind" in info.observationalGraphTypes &&
          "wind-gust" in info.observationalGraphTypes;
        if (hasWind) {
          setSavedLocations((prev) => [...prev, { id: loc.id, name: loc.name, hasWindObservations: true }]);
          setSelectedLocation(null);
          setSearchTerm("");
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

  return (
    <div className="my-stations-container">
      <div className="header">
        <h1 className="title">Wind App</h1>
        <div className="search-section">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search location..."
            className="search-input"
          />
          <select
            onChange={(e) => setSelectedLocation(Number(e.target.value))}
            value={selectedLocation || ""}
            className="location-select"
          >
            <option value="">Select a location</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>{loc.name}</option>
            ))}
          </select>
          <button className="add-button" onClick={handleAdd}>
            Add Location
          </button>
        </div>
      </div>
      {error && <div style={{ color: "#f0f4f8" }}>{error}</div>}
      <div className="stations-list">
        <h2>My Stations</h2>
        {stations.length === 0 && <div>No stations added yet.</div>}
        {stations.map((station) => (
          <div key={station.id} className="alert-card">
            <div className="location">{station.location}</div>
            <div className="wind-info">
              <div className="wind-direction">
                <span className="wind-text">{station.directionText}</span>
                <div className="wind-arrow">
                  <svg
                    viewBox="0 0 12 20"
                    style={{ transform: `rotate(${((station.directionDegrees + 180) % 360)}deg)` }}
                    aria-label={`Wind direction arrow rotated ${((station.directionDegrees + 180) % 360)} degrees`}
                  >
                    <path d="M6 0 L0 15 L6 10 L12 15 Z" fill="#d9e5f2" />
                  </svg>
                </div>
              </div>
              <div className="wind-range right-align">
                <span className="wind-speed-numeral">{station.range.split(" - ")[0]}</span> <span className="wind-unit">knots</span>
                <span className="wind-gust-numeral">{station.range.split(" - ")[1]}</span> <span className="wind-unit">knots</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}