import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
// import { Discount } from './DiscountTypes'; // Currently unused

interface DiscountInputProps {
  discountCode: string;
  discountError: string;
  onDiscountCodeChange: (code: string) => void;
  onApplyDiscount: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export const DiscountInput: React.FC<DiscountInputProps> = React.memo(({
  discountCode,
  discountError,
  onDiscountCodeChange,
  onApplyDiscount,
  disabled = false,
  placeholder = "Enter discount code..."
}) => {
  const [isApplying, setIsApplying] = useState(false);

  const handleApply = async () => {
    if (!discountCode.trim() || disabled) return;
    
    setIsApplying(true);
    try {
      await onApplyDiscount();
    } finally {
      setIsApplying(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleApply();
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex space-x-2">
        <input
          type="text"
          placeholder={placeholder}
          value={discountCode}
          onChange={(e) => onDiscountCodeChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className="flex-1 p-2 bg-input-bg border border-border rounded text-text-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <Button
          variant="line"
          size="sm"
          onClick={handleApply}
          disabled={!discountCode.trim() || disabled || isApplying}
          className="px-4 min-w-[80px]"
        >
          {isApplying ? '...' : 'Apply'}
        </Button>
      </div>
      
      {discountError && (
        <p className="text-sm text-red-500">{discountError}</p>
      )}
    </div>
  );
});

DiscountInput.displayName = 'DiscountInput';
