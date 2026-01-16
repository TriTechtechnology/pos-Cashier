import React, { useState, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { Button } from './button';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onSearch?: (value: string) => void;
  showClearButton?: boolean;
  disabled?: boolean;
  className?: string;
}

export const SearchInput: React.FC<SearchInputProps> = React.memo(({
  value,
  onChange,
  placeholder = "Search..",
  onSearch,
  showClearButton = true,
  disabled = false,
  className = ''
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleClear = useCallback(() => {
    onChange('');
  }, [onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSearch) {
      onSearch(value);
    }
  }, [value, onSearch]);

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-secondary" />
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={disabled}
          className={`
            w-full pl-10 pr-10 py-2 bg-input-bg border border-border rounded-lg 
            text-text-primary text-sm transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
            disabled:opacity-50 disabled:cursor-not-allowed
            ${isFocused ? 'border-primary' : 'border-border'}
          `}
        />
        
        {showClearButton && value && (
          <Button
            variant="icon-line"
            size="sm"
            onClick={handleClear}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted"
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>
    </div>
  );
});

SearchInput.displayName = 'SearchInput';
