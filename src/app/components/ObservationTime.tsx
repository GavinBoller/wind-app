"use client";

import React, { useState, useEffect } from 'react';

const formatTimeAgo = (observationTimeStr: string, timeZone: string): string => {
  if (!observationTimeStr || !timeZone) return '';

  try {
    // The observation time string (e.g., "2024-07-19 14:10:00") is a local time
    // for the station's timezone. We need to convert this to a Date object
    // that correctly represents that moment in time.

    // 1. Create a date object by treating the local time string as if it were UTC.
    const dateInUtc = new Date(observationTimeStr.replace(' ', 'T') + 'Z');

    // 2. Use Intl.DateTimeFormat to get the individual parts of this UTC date,
    //    but formatted as they would appear in the station's actual timezone.
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timeZone,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
    });

    const parts = formatter.formatToParts(dateInUtc);
    const map = new Map(parts.map(x => [x.type, x.value]));

    // 3. Reconstruct a new date object from these parts.
    const year = map.get('year');
    const month = map.get('month');
    const day = map.get('day');
    const hour = map.get('hour') === '24' ? '00' : map.get('hour'); // Intl can return '24'
    const minute = map.get('minute');
    const second = map.get('second');

    if (!year || !month || !day || !hour || !minute || !second) return '';

    const dateInTargetTz = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}Z`);

    // 4. The offset is the difference between the two times.
    const offset = dateInUtc.getTime() - dateInTargetTz.getTime();

    // 5. The actual observation time in UTC is the original time plus the offset.
    const observationDate = new Date(dateInUtc.getTime() + offset);

    const now = new Date();
    const minutesAgo = Math.round((now.getTime() - observationDate.getTime()) / (1000 * 60));

    if (isNaN(minutesAgo)) return '';
    if (minutesAgo < 1) return 'Just now';
    if (minutesAgo === 1) return '1 min ago';
    return `${minutesAgo} mins ago`;
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