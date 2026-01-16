'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface CartSummaryProps {
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  itemCount: number;
  onContinueToPayment: () => void;
  onClearCart?: () => void;
  disabled?: boolean;
}

export const CartSummary: React.FC<CartSummaryProps> = React.memo(({
  subtotal,
  tax,
  discount,
  total,
  itemCount,
  onContinueToPayment,
  onClearCart,
  disabled = false
}) => {
  if (itemCount === 0) {
    return null;
  }

  return (
    <div className="border-t border-border bg-background p-4 space-y-3">
      {/* Summary Lines */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        
        {discount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Discount</span>
            <span>-${discount.toFixed(2)}</span>
          </div>
        )}
        
        <div className="flex justify-between">
          <span>Tax (15%)</span>
          <span>${tax.toFixed(2)}</span>
        </div>
        
        <Separator />
        
        <div className="flex justify-between font-semibold text-base">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        {onClearCart && (
          <Button
            variant="line"
            onClick={onClearCart}
            className="flex-1"
            disabled={disabled}
          >
            Clear Cart
          </Button>
        )}
        
        <Button
          onClick={onContinueToPayment}
          className="flex-2 bg-primary hover:bg-primary/90 text-primary-foreground"
          disabled={disabled || itemCount === 0}
        >
          Continue to Payment
        </Button>
      </div>
    </div>
  );
});

CartSummary.displayName = 'CartSummary';