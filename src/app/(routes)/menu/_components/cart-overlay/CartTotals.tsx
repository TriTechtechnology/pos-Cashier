'use client';

import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils/format';
import { useUnifiedSlot } from '@/lib/store/unified-slots';
import { useCurrentSlotId, useCartItems } from '@/lib/store/cart-new';
import { useOverlayByOrderId } from '@/lib/store/order-overlay';
import { useNavigationMode } from '@/lib/store/navigation';

interface CartTotalsProps {
  mode: 'cart' | 'confirmation';
  subtotal: number;
  tax: number;
  total: number;
  discount: number;
  cartDiscount: number;
  itemsLength: number;
  taxRate?: number; // Dynamic tax rate based on payment method (Cash: 16%, Card: 5%)
  onProceedToPayment: () => void;
  onCompleteOrder?: () => void;
}

export const CartTotals: React.FC<CartTotalsProps> = React.memo(({
  mode,
  subtotal,
  tax,
  total,
  discount,
  cartDiscount,
  itemsLength,
  taxRate = 16, // Default to cash tax rate
  onProceedToPayment,
  onCompleteOrder
}) => {
  // PWA-FIRST: Get navigation mode from navigation store instead of URL
  const navigationMode = useNavigationMode();
  const isEditMode = navigationMode === 'edit';

  // Get current state for smart logic
  const currentSlotId = useCurrentSlotId();
  const cartItems = useCartItems();
  const unifiedSlot = useUnifiedSlot(currentSlotId || '');
  const overlayOrder = useOverlayByOrderId(unifiedSlot?.orderRefId);

  // SMART LOGIC: Determine button behavior based on edit mode and new items
  const isExistingOrder = isEditMode;

  // PHASE 2: Smart button logic based on payment status and new items
  const { buttonText, buttonAction } = useMemo(() => {
    if (!isEditMode || !currentSlotId) {
      // NEW ORDER: Always "Complete Payment"
      return {
        buttonText: 'Complete Payment',
        buttonAction: 'payment'
      };
    }

    // EXISTING ORDER: Get payment status from slot and overlay
    const paymentStatus = unifiedSlot?.paymentStatus;

    // BULLETPROOF: Calculate what needs payment using paid item tracking
    const { hasNewItems, hasModifications, additionalAmount } = (() => {
      if (!isEditMode || !currentSlotId) {
        return { hasNewItems: false, hasModifications: false, additionalAmount: 0 };
      }

      // Separate paid and unpaid items
      const paidItems = cartItems.filter(item => item.isPaid);
      const unpaidItems = cartItems.filter(item => !item.isPaid);

      // Calculate amounts
      const paidAmount = paidItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
      const unpaidAmount = unpaidItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);

      console.log('💰 [PAYMENT LOGIC]', {
        totalItems: cartItems.length,
        paidItems: paidItems.length,
        unpaidItems: unpaidItems.length,
        paidAmount: paidAmount.toFixed(2),
        unpaidAmount: unpaidAmount.toFixed(2),
        currentTotal: total.toFixed(2)
      });

      // If there are unpaid items, customer needs to pay for them
      const hasNewItems = unpaidItems.length > 0;

      // For existing paid orders, check if there are any quantity increases or new modifiers
      const hasModifications = paidItems.some(item => {
        // Check if quantity increased beyond what was paid
        const unpaidQuantity = (item.quantity || 0) - (item.paidQuantity || 0);
        return unpaidQuantity > 0;
      });

      return {
        hasNewItems,
        hasModifications,
        additionalAmount: unpaidAmount
      };
    })();

    // Production: Clean item modification detection
    // Debug logging can be enabled if needed for troubleshooting

    if (paymentStatus === 'paid' && !hasNewItems && !hasModifications) {
      // PAID ORDER, NO NEW ITEMS: Direct completion
      return {
        buttonText: 'Complete Order',
        buttonAction: 'complete'
      };
    } else if (paymentStatus === 'paid' && (hasNewItems || hasModifications)) {
      // PAID ORDER, HAS NEW ITEMS: Additional payment needed
      return {
        buttonText: `Pay Additional ${formatCurrency(additionalAmount)}`,
        buttonAction: 'payment'
      };
    } else {
      // UNPAID ORDER: Complete payment
      return {
        buttonText: 'Complete Payment',
        buttonAction: 'payment'
      };
    }
  }, [isEditMode, currentSlotId, cartItems, unifiedSlot?.paymentStatus, overlayOrder?.items, total, formatCurrency]);

  // Calculate separate totals for paid vs unpaid items
  const { paidItemsTotal, unpaidItemsTotal, paidItemsCount, unpaidItemsCount } = useMemo(() => {
    if (!isEditMode || cartItems.length === 0) {
      return {
        paidItemsTotal: 0,
        unpaidItemsTotal: subtotal,
        paidItemsCount: 0,
        unpaidItemsCount: itemsLength
      };
    }

    const paidItems = cartItems.filter(item => item.isPaid);
    const unpaidItems = cartItems.filter(item => !item.isPaid);

    const paidTotal = paidItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
    const unpaidTotal = unpaidItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);

    return {
      paidItemsTotal: paidTotal,
      unpaidItemsTotal: unpaidTotal,
      paidItemsCount: paidItems.length,
      unpaidItemsCount: unpaidItems.length
    };
  }, [isEditMode, cartItems, subtotal, itemsLength]);

  return (
    <div className="flex flex-col flex-shrink-0 mx-4 mb-4">
      {/* Order Summary */}
      <div className="bg-card rounded-lg border border-border p-4">

        <div className="space-y-2 text-sm">
          {/* Show breakdown for existing paid orders */}
          {isEditMode && (paidItemsCount > 0 || unpaidItemsCount > 0) ? (
            <>
              {/* Paid Items Section */}
              {paidItemsCount > 0 && (
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-green-600 font-medium">Paid Items ({paidItemsCount})</span>
                    {/* <div className="text-xs text-green-600 mb-2">✓ Already paid - no charge</div> */}
                    <span className="text-green-700 font-semibold">{formatCurrency(paidItemsTotal)}</span>
                    
                  </div>
                  
                </div>
              )}

              {/* Unpaid Items Section */}
              {unpaidItemsCount > 0 && (
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">New Items ({unpaidItemsCount})</span>
                    <span className="text-text-primary">{formatCurrency(unpaidItemsTotal)}</span>
                  </div>
                </div>
              )}

              {/* Separator 
              <div className="border-t border-border my-2"></div>
              */}
            </>
          ) : (
            // Standard display for new orders
            <div className="flex justify-between">
              <span className="text-text-secondary">Items ({itemsLength})</span>
              <span className="text-text-primary">{formatCurrency(subtotal)}</span>
            </div>
          )}

          {discount > 0 && (
            <div className="flex justify-between">
              <span className="text-text-secondary">Item Discounts</span>
              <span className="text-success-light">-{formatCurrency(discount)}</span>
            </div>
          )}

          {cartDiscount > 0 && (
            <div className="flex justify-between">
              <span className="text-text-secondary">Cart Discount</span>
              <span className="text-success-light">- {formatCurrency(cartDiscount)}</span>
            </div>
          )}

          {/* Show tax and fees only in confirmation mode */}
          {mode === 'confirmation' && (
            <>
              <div className="flex justify-between">
                <span className="text-text-secondary">Tax ({taxRate}%)</span>
                <span className="text-text-primary">{formatCurrency(tax)}</span>
              </div>
            </>
          )}

          <div className="border-t border-dotted border-border pt-2 mt-2">
            <div className="flex justify-between">
              <span className="text-lg font-semibold text-text-primary">
                {isEditMode && paidItemsCount > 0 ? 'Amount Due' : (mode === 'cart' ? 'Subtotal' : 'Total')}
              </span>
              <span className="text-lg font-bold text-text-primary">
                {isEditMode && paidItemsCount > 0
                  ? formatCurrency(unpaidItemsTotal - discount - cartDiscount + (mode === 'confirmation' ? tax * (unpaidItemsTotal / subtotal) : 0))
                  : (mode === 'cart' ? formatCurrency(Math.max(0, subtotal - discount - cartDiscount)) : formatCurrency(total))
                }
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Button - Smart logic based on edit mode and payment status */}
      {mode === 'cart' && (
        <Button
          variant="fill"
          size="lg"
          className={`w-full h-12 text-lg font-semibold mt-3 ${
            buttonAction === 'complete' && isExistingOrder
              ? 'bg-success hover:bg-success/90 text-white'
              : ''
          }`}
          onClick={buttonAction === 'complete' && isExistingOrder ? onCompleteOrder : onProceedToPayment}
          disabled={itemsLength === 0}
        >
          {isExistingOrder ? buttonText : 'Proceed to Payment'}
        </Button>
      )}

      {/* Confirmation mode shows no buttons - only for review */}
    </div>
  );
});

CartTotals.displayName = 'CartTotals';
