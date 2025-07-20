"use client";

import React, { useState, useEffect } from 'react';

const formatTimeAgo = (observationTimeStr: string, timeZone: string): string => {
  if (!observationTimeStr || !timeZone) return '';

  try {
    // This is a robust way to convert a local time string from a specific timezone into a correct Date object.
    // It works by calculating the timezone offset for the given time and timezone.

    // 1. Create a date by treating the local time string as if it were UTC.
    const pseudoUtcDate = new Date(observationTimeStr.replace(' ', 'T') + 'Z');

    // 2. Format this "pseudo UTC" date into the target timezone to find out what time it would be there.
    // We use 'en-CA' because it gives a YYYY-MM-DD format.
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: timeZone,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
    });

    // 3. Reconstruct an ISO string from the formatted parts.
    const parts = formatter.formatToParts(pseudoUtcDate).reduce((acc, part) => {
      if (part.type !== 'literal') acc[part.type] = part.value;
      return acc;
    }, {} as Record<string, string>);

    // Intl.DateTimeFormat can return '24' for the hour, which is invalid in ISO 8601.
    const hour = parts.hour === '24' ? '00' : parts.hour;

    if (!parts.year || !parts.month || !parts.day || !hour || !parts.minute || !parts.second) return '';

    const dateInTargetTzStr = `${parts.year}-${parts.month}-${parts.day}T${hour}:${parts.minute}:${parts.second}`;
    const dateInTargetTz = new Date(dateInTargetTzStr + 'Z');

    // 4. The difference between these two dates is our timezone offset.
    const offset = pseudoUtcDate.getTime() - dateInTargetTz.getTime();

    // 5. The actual observation time is the original time string, but with the correct offset applied.
    const observationDate = new Date(pseudoUtcDate.getTime() + offset);

    // 6. Now calculate the difference from the current time.
    const now = new Date();
    const diffInMinutes = Math.round((now.getTime() - observationDate.getTime()) / (1000 * 60));

    if (isNaN(diffInMinutes)) return '';

    // Use Intl.RelativeTimeFormat for cleaner "time ago" formatting.
    if (Math.abs(diffInMinutes) < 1) return 'Just now';

    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

    if (Math.abs(diffInMinutes) < 60) {
      return rtf.format(-diffInMinutes, 'minute');
    }

    const diffInHours = Math.round(diffInMinutes / 60);
    return rtf.format(-diffInHours, 'hour');
  } catch (error) {
    console.error("Error formatting time ago:", error);
    return '';
  }
};

interface ObservationTimeProps {
  observationTime?: string;
  timeZone?: string;
}

const ObservationTime: React.FC<ObservationTimeProps> = ({ observationTime, timeZone }) => {
  const [timeAgo, setTimeAgo] = useState('');

  useEffect(() => {
    if (!observationTime || !timeZone) {
      setTimeAgo('');
      return;
    }

    setTimeAgo(formatTimeAgo(observationTime, timeZone));

    // Update the time every 60 seconds
    const interval = setInterval(() => {
      setTimeAgo(formatTimeAgo(observationTime, timeZone));
    }, 60000);
    return () => clearInterval(interval);
  }, [observationTime, timeZone]);

  if (!timeAgo) return null;

  return <div className="observation-time">{timeAgo}</div>;
};

export default ObservationTime;