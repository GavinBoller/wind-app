"use client";

import React, { useState, useEffect, useRef } from "react";
import { useLocationSearch } from "@/hooks/useLocationSearch";
import type { Location } from "@/types";

interface AddStationFormProps {
  onStationAdded: () => void;
  savedLocations: Location[];
  setGlobalError: (error: string | null) => void;
  onClose?: () => void;
  isModal?: boolean;
}

export default function AddStationForm({ onStationAdded, savedLocations, setGlobalError, onClose, isModal = false }: AddStationFormProps) {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { searchTerm, setSearchTerm, locations, isLoading, error, setLocations } = useLocationSearch("");

  // 1. Autofocus the input when the modal is opened.
  useEffect(() => {
    if (isModal) {
      // On iOS, focus must be called directly without a timeout to be considered user-initiated.
      inputRef.current?.focus();
    }
  }, [isModal]);

  React.useEffect(() => {
    if (error) {
      setGlobalError(error);
    }
  }, [error, setGlobalError]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLocation) {
      setGlobalError("Please select a location first.");
      return;
    }

    if (savedLocations.some((l) => l.id === selectedLocation.id)) {
      setGlobalError("Location already added.");
      return;
    }

    setIsAdding(true);
    try {
      const res = await fetch(`/api/willyweather?id=${selectedLocation.id}&type=info`);
      if (!res.ok) throw new Error(`Failed to fetch info for ${selectedLocation.name}`);
      const info = await res.json();
      console.log(`WillyWeather Info for ${selectedLocation.name}:`, info);

      // Check for the presence of the actual wind observation data object.
      // This is more reliable than checking for graph types.
      const hasWind = info.observational?.observations?.wind;
      if (!hasWind) {
        setGlobalError("Selected location does not have wind data.");
        return;
      }

      // Validate that we have proper coordinates before saving
      if (typeof info.location?.lat !== 'number' || typeof info.location?.lng !== 'number') {
        setGlobalError(`Could not retrieve coordinates for ${selectedLocation.name}. Cannot add station.`);
        return;
      }

      const stationPayload = {
        stationId: selectedLocation.id.toString(),
        name: selectedLocation.name,
        region: info.location.region || "",
        state: info.location.state || "",
        lat: info.location.lat,
        lng: info.location.lng,
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

      onStationAdded();
      setSelectedLocation(null);
      setSearchTerm("");
      setShowDropdown(false);
      setGlobalError(null);
      onClose?.();
    } catch (err: any) {
      setGlobalError(err.message);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <form onSubmit={handleAdd} className={`search-form ${isModal ? 'in-modal' : ''}`} autoComplete="off">
      {isModal && <p className="modal-form-description">Search for a location to add to your list.</p>}
      <div className="autocomplete-container">
        <input
          ref={inputRef}
          type="text"
          placeholder="Search location..."
          value={selectedLocation ? selectedLocation.name : searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setSelectedLocation(null);
            setShowDropdown(true);
          }}
          className="search-input"
          onFocus={() => { if (locations.length > 0) setShowDropdown(true); }}
          onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
        />
        {showDropdown && !selectedLocation && (
          <ul className="autocomplete-dropdown">
            {isLoading ? (
              <li className="autocomplete-option-disabled">Loading...</li>
            ) : error ? (
              <li className="autocomplete-option-disabled">{error}</li>
            )
            : locations.length > 0 ? (
              locations.map((loc) => (
                <li key={loc.id} className="autocomplete-option" onMouseDown={() => { setSelectedLocation(loc); setShowDropdown(false); }}>
                  {loc.name}{loc.state && ` (${loc.state})`}
                </li>
              ))
            ) : (
              <li className="autocomplete-option-disabled">No results found</li>
            )}
          </ul>
        )}
      </div>
      <button
        type="submit"
        className="add-button small"
        disabled={!selectedLocation || isAdding}
        onMouseDown={(e) => e.preventDefault()} // 2. Prevent input blur on button click to fix touch issues
      >
        {isAdding ? 'Adding...' : 'Add Location'}
      </button>
    </form>
  );
}