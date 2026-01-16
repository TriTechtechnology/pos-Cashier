'use client';

import React from 'react';

interface KeypadProps {
  onInput: (value: string) => void;
  onClear: () => void;
  onBackspace: () => void;
  className?: string;
  showDecimal?: boolean;
}

export const Keypad: React.FC<KeypadProps> = React.memo(({
  onInput,
  // onClear, // Currently unused
  onBackspace,
  className = '',
  showDecimal = true
}) => {
  const handleKeyClick = (value: string) => {
    onInput(value);
  };

  return (
    <div className={`grid grid-cols-3 gap-2 ${className}`}>
      {/* Number keys 1-9 */}
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
        <button
          key={num}
          onClick={() => handleKeyClick(num.toString())}
          className="p-3 text-lg font-semibold bg-background border border-border rounded-lg hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          {num}
        </button>
      ))}
      
      {/* Decimal point or empty space */}
      {showDecimal ? (
        <button
          onClick={() => handleKeyClick('.')}
          className="p-3 text-lg font-semibold bg-background border border-border rounded-lg hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          .
        </button>
      ) : (
        <div />
      )}

      {/* Zero */}
      <button
        onClick={() => handleKeyClick('0')}
        className="p-3 text-lg font-semibold bg-background border border-border rounded-lg hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
      >
        0
      </button>

      {/* Backspace */}
      <button
        onClick={onBackspace}
        className="p-3 text-lg font-semibold bg-background border border-border rounded-lg hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
      >
        ←
      </button>
    </div>
  );
});

Keypad.displayName = 'Keypad';
