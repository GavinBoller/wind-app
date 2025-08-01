import React from 'react';

interface WindStationIconProps {
  className?: string;
  title?: string;
}

/**
 * An icon to indicate a primary wind observation station.
 * Uses a windsock design for clear visual communication.
 */
export default function WindStationIcon({ className, title }: WindStationIconProps) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {title && <title>{title}</title>}
      <path d="M4 4v16" />
      <path d="M4 6h16l-3 3-3-3H4" />
    </svg>
  );
}