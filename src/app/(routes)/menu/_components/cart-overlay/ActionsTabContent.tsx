import React from 'react';
import { Button } from '@/components/ui/button';

interface ActionsTabContentProps {
  discountCode: string;
  discountError: string;
  showAvailableDiscounts: boolean;
  availableDiscounts: Array<{ type: 'percentage' | 'fixed'; value: number; code: string; name: string; minimumOrder: number; isActive: boolean; validFrom: Date; validUntil: Date; }>; 
  cartDiscount: number;
  onDiscountCodeChange: (code: string) => void;
  onApplyDiscount: () => void;
  onRemoveDiscount: () => void;
  onShowAvailableDiscounts: (show: boolean) => void;
}

export const ActionsTabContent: React.FC<ActionsTabContentProps> = React.memo(({
  discountCode,
  discountError,
  showAvailableDiscounts,
  availableDiscounts,
  cartDiscount,
  onDiscountCodeChange,
  onApplyDiscount,
  onRemoveDiscount,
  onShowAvailableDiscounts
}) => {
  return (
    <div className="h-full overflow-y-auto scrollbar-hide p-4">
      {/* Discount Code Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-text-primary">Discount Codes</h3>
          <Button
            variant="line"
            size="sm"
            onClick={() => onShowAvailableDiscounts(!showAvailableDiscounts)}
            className="text-xs"
          >
            {showAvailableDiscounts ? 'Hide' : 'Show'} Available
          </Button>
        </div>

        {/* Available Discounts */}
        {showAvailableDiscounts && (
          <div className="space-y-2">
            {availableDiscounts.map((discount, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-md border border-border">
                <div>
                  <p className="text-sm font-medium text-text-primary">{discount.name}</p>
                  <p className="text-xs text-text-secondary">Code: {discount.code}</p>
                </div>
                <span className="text-sm text-success-light">
                  {discount.type === 'percentage' ? `${discount.value}%` : `-${discount.value}`}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Discount Input */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={discountCode}
              onChange={(e) => onDiscountCodeChange(e.target.value)}
              className="flex-1 bg-background border border-border rounded-md px-3 py-2 text-sm"
              placeholder="Enter discount code"
            />
            <Button variant="fill" size="sm" onClick={onApplyDiscount}>Apply</Button>
          </div>
          {discountError && (
            <p className="text-xs text-destructive">{discountError}</p>
          )}
        </div>

        {/* Applied Discount */}
        {cartDiscount > 0 && (
          <div className="flex items-center justify-between p-3 rounded-md border border-border">
            <div>
              <p className="text-sm font-medium text-text-primary">Applied Discount</p>
              <p className="text-xs text-text-secondary">Manual</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-success-light">- {cartDiscount}</span>
              <Button variant="line" size="sm" onClick={onRemoveDiscount}>Remove</Button>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions - Minimal & Aesthetic */}
      <div className="space-y-4 mt-6">
        <h3 className="text-base font-medium text-text-primary">Quick Actions</h3>

        <div className="grid grid-cols-3 gap-3">
          <Button
            variant="line"
            className="h-12 flex flex-col items-center justify-center"
            onClick={() => console.log('Split bill')}
          >
            <span className="text-sm">Split Bill</span>
          </Button>

          <Button
            variant="line"
            className="h-12 flex flex-col items-center justify-center"
            onClick={() => console.log('Add tip')}
          >
            <span className="text-sm">Add Tip</span>
          </Button>

          <Button
            variant="line"
            className="h-12 flex flex-col items-center justify-center"
            onClick={() => console.log('Hold order')}
          >
            <span className="text-sm">Hold</span>
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="line"
            className="h-12 flex flex-col items-center justify-center"
            onClick={() => console.log('Manager override')}
          >
            <span className="text-sm">Manager</span>
          </Button>

          <Button
            variant="line"
            className="h-12 flex flex-col items-center justify-center"
            onClick={() => console.log('Print receipt')}
          >
            <span className="text-sm">Print</span>
          </Button>
        </div>
      </div>
    </div>
  );
});

ActionsTabContent.displayName = 'ActionsTabContent';
