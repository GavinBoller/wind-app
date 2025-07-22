import React from 'react';
import type { TideEntry } from '@/types';

interface TideChartProps {
  data: TideEntry[];
  timeZone?: string;
}

// Helper function to create a smooth path using Bezier curves
const createPath = (points: { x: number; y: number }[]): string => {
  if (points.length < 2) return '';
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return path;
};

// Function to estimate tide height at a given time using cosine interpolation
const estimateTideHeight = (now: Date, prevTide: TideEntry, nextTide: TideEntry): number => {
    const prevTime = new Date(prevTide.dateTime).getTime();
    const nextTime = new Date(nextTide.dateTime).getTime();
    const nowTime = now.getTime();

    if (nowTime < prevTime || nowTime > nextTime) {
        return (prevTide.height + nextTide.height) / 2; // fallback
    }

    const totalDuration = nextTime - prevTime;
    const elapsedDuration = nowTime - prevTime;
    const proportion = elapsedDuration / totalDuration;

    // Cosine interpolation for a smooth tidal curve
    const amplitude = (nextTide.height - prevTide.height) / 2;
    const verticalShift = (prevTide.height + nextTide.height) / 2;
    const cosFactor = -Math.cos(proportion * Math.PI);

    return verticalShift + amplitude * cosFactor;
};

export default function TideChart({ data, timeZone }: TideChartProps) {
  if (!data || data.length < 2) {
    return <div className="tide-chart-nodata">Not enough tide data to display chart.</div>;
  }

  const width = 300;
  const height = 120;
  const padding = { top: 20, right: 20, bottom: 30, left: 35 };

  const chartData = data.map(d => ({ ...d, date: new Date(d.dateTime) }));

  const minHeight = Math.min(...chartData.map(d => d.height));
  const maxHeight = Math.max(...chartData.map(d => d.height));
  const startTime = chartData[0].date.getTime();
  const endTime = chartData[chartData.length - 1].date.getTime();
  const now = new Date();

  const xScale = (time: number) =>
    padding.left + ((time - startTime) / (endTime - startTime)) * (width - padding.left - padding.right);

  const yScale = (h: number) =>
    height - padding.bottom - ((h - minHeight) / (maxHeight - minHeight)) * (height - padding.top - padding.bottom);

  const points = chartData.map(d => ({ x: xScale(d.date.getTime()), y: yScale(d.height) }));
  const pathData = createPath(points);

  const nowX = xScale(now.getTime());
  
  let estimatedHeight = NaN;
  const nextTideIndex = chartData.findIndex(d => d.date > now);
  if (nextTideIndex > 0) {
      const prevTide = chartData[nextTideIndex - 1];
      const nextTide = chartData[nextTideIndex];
      estimatedHeight = estimateTideHeight(now, prevTide, nextTide);
  }
  const nowY = isNaN(estimatedHeight) ? -1 : yScale(estimatedHeight);

  // --- Logic for label positioning to avoid overlap ---
  let nowLabelYOffset = 4; // Default y offset (below marker)
  const collisionThresholdX = 30; // Horizontal pixel distance
  const collisionThresholdY = 15; // Vertical pixel distance

  for (const p of points) {
    // Is the 'now' marker horizontally close to a tide point?
    if (Math.abs(nowX - p.x) < collisionThresholdX) {
      // Are their labels going to be vertically close?
      // (now label is at nowY + nowLabelYOffset, point label is at p.y - 8)
      if (Math.abs((nowY + nowLabelYOffset) - (p.y - 8)) < collisionThresholdY) {
        // Collision detected. Move the 'now' label further down to avoid overlap.
        nowLabelYOffset = 16;
        break;
      }
    }
  }

  const formatTime = (date: Date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone });

  return (
    <div className="tide-chart-container">
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <path d={`${pathData} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`} fill="url(#waterGradient)" />
        <path d={pathData} fill="none" stroke="#61dafb" strokeWidth="2" />
        <defs>
            <linearGradient id="waterGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#61dafb" stopOpacity="0.4"/>
                <stop offset="100%" stopColor="#1a2a44" stopOpacity="0.1"/>
            </linearGradient>
        </defs>
        {chartData.map((d, i) => (
          <g key={i}>
            <circle cx={points[i].x} cy={points[i].y} r="3" fill="#f0f4f8" />
            <text x={points[i].x} y={points[i].y - 8} textAnchor="middle" className="tide-chart-point-label">{d.height.toFixed(2)}m</text>
            <text x={points[i].x} y={height - 8} textAnchor="middle" className="tide-chart-time-label">{formatTime(d.date)}</text>
          </g>
        ))}
        {nowX > padding.left && nowX < width - padding.right && nowY > 0 && (
          <g>
            <line x1={nowX} y1={padding.top} x2={nowX} y2={height - padding.bottom} className="tide-chart-now-line" />
            <text x={nowX} y={padding.top - 5} textAnchor="middle" className="tide-chart-now-header-label">Now</text>
            <circle cx={nowX} cy={nowY} r="4" className="tide-chart-now-marker" />
            <text x={nowX + 5} y={nowY + nowLabelYOffset} className="tide-chart-now-label">{estimatedHeight.toFixed(2)}m</text>
          </g>
        )}
      </svg>
    </div>
  );
}