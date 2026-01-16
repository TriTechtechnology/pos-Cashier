import React from 'react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils/format';
import { Discount } from './DiscountTypes';
import { formatDiscountDisplay } from './DiscountUtils';

interface DiscountDisplayProps {
  discount: Discount;
  showRemoveButton?: boolean;
  onRemove?: () => void;
  variant?: 'applied' | 'available';
}

export const DiscountDisplay: React.FC<DiscountDisplayProps> = React.memo(({
  discount,
  showRemoveButton = false,
  onRemove,
  variant = 'applied'
}) => {
  const isApplied = variant === 'applied';
  
  const containerClasses = isApplied
    ? 'p-3 border border-success-light rounded-lg bg-success-light/10'
    : 'p-3 border border-border rounded-lg bg-muted/30';

  const textClasses = isApplied ? 'text-success-light' : 'text-text-primary';

  return (
    <div className={containerClasses}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-xs font-medium ${textClasses}`}>
            {discount.name}
          </p>
          <p className={`text-xs ${textClasses}`}>
            {formatDiscountDisplay(discount)}
          </p>
          {discount.minimumOrder && (
            <p className="text-xs text-text-secondary mt-1">
              Min: {formatCurrency(discount.minimumOrder)}
            </p>
          )}
        </div>
        
        {showRemoveButton && onRemove && (
          <Button
            variant="line"
            size="sm"
            onClick={onRemove}
            className={`text-xs ${textClasses} hover:opacity-80`}
          >
            Remove
          </Button>
        )}
      </div>
    </div>
  );
});

DiscountDisplay.displayName = 'DiscountDisplay';
