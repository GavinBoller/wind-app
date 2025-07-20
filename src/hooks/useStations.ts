import useSWR from 'swr';
import type { Station } from '@/types';

const fetcher = async (url: string): Promise<Station[]> => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Failed to fetch station data');
  }
  return res.json();
};

export function useStations() {
  return useSWR<Station[], Error>('/api/stations-with-observations', fetcher);
}