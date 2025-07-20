"use client";

import React, { useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import type { Location } from "@/types";

interface AddStationFormProps {
  onStationAdded: () => void;
  savedLocations: Location[];
  setGlobalError: (error: string | null) => void;
}

export default function AddStationForm({ onStationAdded, savedLocations, setGlobalError }: AddStationFormProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const debouncedSearchTerm = useDebounce(searchTerm, 300); // 300ms delay

  React.useEffect(() => {
    if (debouncedSearchTerm) {
      setIsLoading(true);
      setGlobalError(null);
      fetch(`/api/willyweather?search=${encodeURIComponent(debouncedSearchTerm)}`)
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch locations");
          return res.json();
        })
        .then((data) => {
          setLocations(data.map((loc: any) => ({ id: loc.id, name: loc.name })));
          setShowDropdown(true);
        })
        .catch((err) => setGlobalError(err.message))
        .finally(() => setIsLoading(false));
    } else {
      setLocations([]);
      setShowDropdown(false);
    }
  }, [debouncedSearchTerm, setGlobalError]);

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

      const hasWind = info.observationalGraphTypes && "wind" in info.observationalGraphTypes;
      if (!hasWind) {
        setGlobalError("Selected location does not have wind data.");
        return;
      }

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

      onStationAdded();
      setSelectedLocation(null);
      setSearchTerm("");
      setShowDropdown(false);
      setGlobalError(null);
    } catch (err: any) {
      setGlobalError(err.message);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <form onSubmit={handleAdd} className="search-form" autoComplete="off">
      <div className="autocomplete-container">
        <input
          type="text"
          placeholder="Search location..."
          value={selectedLocation ? selectedLocation.name : searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setSelectedLocation(null);
          }}
          className="search-input"
          onFocus={() => { if (locations.length > 0) setShowDropdown(true); }}
          onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
        />
        {showDropdown && !selectedLocation && (
          <ul className="autocomplete-dropdown">
            {isLoading ? (
              <li className="autocomplete-option-disabled">Loading...</li>
            ) : locations.length > 0 ? (
              locations.map((loc) => ( <li key={loc.id} className="autocomplete-option" onMouseDown={() => { setSelectedLocation(loc); setShowDropdown(false); }}> {loc.name} </li> ))
            ) : (
              <li className="autocomplete-option-disabled">No results found</li>
            )}
          </ul>
        )}
      </div>
      <button type="submit" className="add-button small" disabled={!selectedLocation || isAdding}>
        {isAdding ? 'Adding...' : 'Add Location'}
      </button>
    </form>
  );
}