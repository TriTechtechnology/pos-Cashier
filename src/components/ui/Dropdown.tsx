'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface DropdownOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface DropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const Dropdown: React.FC<DropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select option',
  className = '',
  disabled = false,
  size = 'md'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(option => option.value === value);

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-sm',
    lg: 'px-4 py-3 text-base'
  };

  const handleSelect = (optionValue: string) => {
    if (!disabled) {
      onChange(optionValue);
      setIsOpen(false);
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full flex items-center justify-between
          bg-card border border-border rounded-xl
          text-text-primary placeholder-text-secondary
          focus:outline-none focus:border-border
          transition-all duration-200 ease-in-out
                     active:border-border
          ${sizeClasses[size]}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <span className={selectedOption ? 'text-text-primary' : 'text-text-secondary'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown 
          className={`w-4 h-4 text-text-secondary transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => handleSelect(option.value)}
              disabled={option.disabled}
              className={`
                w-full flex items-center justify-between px-4 py-3 text-left
                transition-colors duration-150 ease-in-out
                ${option.value === value 
                  ? 'bg-primary text-primary-foreground' 
                  : 'active:bg-accent/50 text-text-primary'
                }
                ${option.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                first:rounded-t-lg last:rounded-b-lg
              `}
            >
              <span className="truncate">{option.label}</span>
              {option.value === value && (
                <Check className="w-4 h-4 flex-shrink-0" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
