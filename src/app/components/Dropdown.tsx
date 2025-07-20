"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';

interface DropdownProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  contentClassName?: string;
}

export default function Dropdown({ trigger, children, contentClassName }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleToggle = () => setIsOpen(prev => !prev);

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, handleClickOutside]);

  return (
    <div className="relative" ref={dropdownRef}>
      <div onClick={handleToggle}>
        {trigger}
      </div>
      {isOpen && (
        <div className={contentClassName} onClick={() => setIsOpen(false)}>
          {children}
        </div>
      )}
    </div>
  );
}