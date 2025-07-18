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
  const [stations, setStations] = useState<Station[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ location: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Search locations and check for wind observations
  useEffect(() => {
    if (searchTerm) {
      setError(null); // Clear previous errors
      fetch(`/api/willyweather?search=${encodeURIComponent(searchTerm)}`)
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch locations");
          return res.json();
        })
        .then((data) => {
          const locationPromises = data.locations?.map((loc: any) =>
            fetch(`/api/willyweather/info?id=${loc.id}`)
              .then((res) => {
                if (!res.ok) throw new Error(`Failed to fetch info for ${loc.name}`);
                return res.json();
              })
              .then((info) => ({
                id: loc.id,
                name: loc.name,
                hasWindObservations: info.observationalGraphTypes?.includes("wind") && info.observationalGraphTypes?.includes("wind-gust"),
              }))
          );
          return Promise.all(locationPromises || []);
        })
        .then(setLocations)
        .catch((err) => setError(err.message));
    }
  }, [searchTerm]);

  // Fetch weather data for selected location
  useEffect(() => {
    if (selectedLocation) {
      setError(null); // Clear previous errors
      fetch(`/api/willyweather/observations?id=${selectedLocation}`)
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch observations");
          return res.json();
        })
        .then((data) => {
          setStations([{ 
            id: Date.now().toString(),
            location: locations.find(l => l.id === selectedLocation)?.name || "",
            directionText: data.observations?.wind?.direction?.text || "N/A",
            directionDegrees: data.observations?.wind?.direction?.degrees || 0,
            range: `${data.observations?.wind?.speed || 0} - ${data.observations?.wind?.gust || 0}`,
            windSpeed: data.observations?.wind?.speed || 0,
            windGust: data.observations?.wind?.gust || 0,
          }]);
        })
        .catch((err) => setError(err.message));
    }
  }, [selectedLocation]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedLocation) {
      setStations((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          location: locations.find(l => l.id === selectedLocation)?.name || form.location,
          directionText: "N/A",
          directionDegrees: 0,
          range: "N/A",
          windSpeed: 0,
          windGust: 0,
        },
      ]);
      setForm({ location: "" });
      setShowModal(false);
      setSelectedLocation(null); // Reset selection after adding
    } else {
      setError("Please select a location with wind data first.");
    }
  };

  return (
    <div className="my-stations-container">
      <div className="header">
        <h1 className="title">Wind App</h1>
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
          <option value="">Select a location with wind data</option>
          {locations.filter(l => l.hasWindObservations).map((loc) => (
            <option key={loc.id} value={loc.id}>{loc.name}</option>
          ))}
        </select>
        <button className="add-button" onClick={() => setShowModal(true)}>
          Add Location
        </button>
      </div>
      {error && <div style={{ color: "#f0f4f8" }}>{error}</div>}
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

      {showModal && (
        <div className="modal active">
          <div className="modal-content">
            <form onSubmit={handleAdd}>
              <div className="form-group">
                <label>Location:</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setSearchTerm(e.target.value)} // Sync with search term
                  required
                  placeholder="Enter location"
                />
              </div>
              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}