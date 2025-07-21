import React from 'react';

export default function TideIcon({ className, onClick }: { className?: string, onClick?: () => void }) {
  return (
    <svg
      className={className}
      onClick={onClick}
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
      <path d="M2 12h3l3-9 4 18 3-9h3" />
    </svg>
  );
}