import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * A custom hook to handle pull-to-refresh functionality on touch devices.
 * @param onRefresh - An async function to be called when a refresh is triggered.
 * @returns An object containing `isRefreshing` state and `pullY` for UI feedback.
 */
export function usePullToRefresh(onRefresh: () => Promise<any>) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullY, setPullY] = useState(0);
  const touchStartRef = useRef(0);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await onRefresh();
    // Add a small delay to let the animation finish before hiding the indicator
    setTimeout(() => setIsRefreshing(false), 500);
  }, [onRefresh]);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    // Only track pulls that start at the very top of the page
    if (window.scrollY === 0) {
      touchStartRef.current = e.touches[0].clientY;
    } else {
      touchStartRef.current = 0;
    }
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (touchStartRef.current > 0) {
      const dy = e.touches[0].clientY - touchStartRef.current;
      if (dy > 0) e.preventDefault(); // Prevents default browser pull-to-refresh
      setPullY(dy > 0 ? dy : 0);
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (touchStartRef.current === 0) return;
    const wasPulled = pullY > 100; // Refresh threshold
    touchStartRef.current = 0;
    setPullY(0);
    if (wasPulled) handleRefresh();
  }, [pullY, handleRefresh]);

  useEffect(() => {
    const options = { passive: false }; // `passive: false` is needed to call preventDefault()
    window.addEventListener('touchstart', handleTouchStart, options);
    window.addEventListener('touchmove', handleTouchMove, options);
    window.addEventListener('touchend', handleTouchEnd);
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return { isRefreshing, pullY };
}