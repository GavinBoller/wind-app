import { useState, useEffect } from 'react';
import { useDebounce } from './useDebounce';
import type { Location } from '@/types';

export function useLocationSearch(initialSearchTerm: string) {
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    if (debouncedSearchTerm) {
      setIsLoading(true);
      setError(null);
      fetch(`/api/willyweather?search=${encodeURIComponent(debouncedSearchTerm)}`)
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch locations");
          return res.json();
        })
        .then((data) => {
          setLocations(data.map((loc: any) => ({ id: loc.id, name: loc.name, state: loc.state })));
        })
        .catch((err) => setError(err.message))
        .finally(() => setIsLoading(false));
    } else {
      setLocations([]);
    }
  }, [debouncedSearchTerm]);

  return { searchTerm, setSearchTerm, locations, isLoading, error, setLocations };
}