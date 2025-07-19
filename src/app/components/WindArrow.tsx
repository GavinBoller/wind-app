import React from 'react';

interface WindArrowProps {
  directionDegrees: number;
  className?: string;
}

const WindArrow: React.FC<WindArrowProps> = ({ directionDegrees, className = "" }) => {
  // The arrow polygon points "up". A wind from the North (0°) should point down (180°).
  // We add 180 degrees to flip the direction.
  const rotation = (directionDegrees + 180) % 360;

  return (
    <svg
      className={className}
      viewBox="0 0 12 20"
      style={{ '--wind-direction-rotation': `${rotation}deg` } as React.CSSProperties}
    >
      <path d="M6 0 L0 15 L6 10 L12 15 Z" />
    </svg>
  );
};

export default WindArrow;