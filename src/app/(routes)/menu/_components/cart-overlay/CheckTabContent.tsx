import React from 'react';
import { CartItem as CartItemType } from '@/lib/store/cart-new';
import { formatCurrency } from '@/lib/utils/format';
import { SwipeableCartItem } from './SwipeableCartItem';

interface CheckTabContentProps {
  mode: 'cart' | 'confirmation';
  items: CartItemType[];
  onItemClick: (item: CartItemType) => void;
  onRepeat: (item: CartItemType) => void;
  onDelete: (uniqueId: string) => void;
  onRefund?: (item: CartItemType) => void;
  onMarkWaste?: (item: CartItemType) => void;
}

export const CheckTabContent: React.FC<CheckTabContentProps> = React.memo(({
  mode,
  items,
  onItemClick,
  onRepeat,
  onDelete,
  onRefund,
  onMarkWaste
}) => {
  if (mode === 'cart') {
    // Cart mode - editable items
    if (items.length > 0) {
      return (
        <div className="h-full overflow-y-auto scrollbar-hide">
          {items.map((item, index) => (
            <SwipeableCartItem
              key={`${item.uniqueId}-${index}`}
              item={item}
              onItemClick={onItemClick}
              onRepeat={onRepeat}
              onDelete={onDelete}
              onRefund={onRefund}
              onMarkWaste={onMarkWaste}
            />
          ))}
        </div>
      );
    } else {
      // Show empty cart message
      return (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="text-4xl mb-4">🛒</div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">Your cart is empty</h3>
            <p className="text-sm text-text-secondary">Add some items to get started</p>
          </div>
        </div>
      );
    }
  } else {
    // Confirmation mode - read-only items
    if (items.length > 0) {
      return (
        <div className="h-full overflow-y-auto scrollbar-hide">
          {items.map((item) => (
            <div key={item.uniqueId} className="p-3 border-b border-border/20">
              <div className="flex items-start justify-between">
                <div className="flex-1 pr-3">
                  <h3 className="font-semibold text-text-primary text-base mb-1">{item.name}</h3>

                  {/* Description */}
                  {item.description && (
                    <p className="text-sm text-text-secondary mb-1">
                      {item.description}
                    </p>
                  )}

                  {/* Variations */}
                  {item.modifiers?.variations && item.modifiers.variations.map((variation, index) => (
                    <p key={`var-${index}`} className="text-sm text-text-secondary mb-0.5">
                      {variation.name}
                    </p>
                  ))}

                  {/* Add-ons */}
                  {item.modifiers?.addOns && item.modifiers.addOns.map((addon, index) => (
                    <p key={`addon-${index}`} className="text-sm text-text-secondary mb-0.5">
                      {addon.name}
                    </p>
                  ))}

                  {/* Special Instructions */}
                  {item.modifiers?.specialInstructions && (
                    <p className="text-sm text-text-secondary mb-0.5">
                      {item.modifiers.specialInstructions}
                    </p>
                  )}

                  {/* Notes */}
                  {item.modifiers?.notes && (
                    <p key={`notes`} className="text-sm text-text-secondary mb-0.5">
                      {item.modifiers.notes}
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-2 flex-shrink-0">
                  {/* Paid indicator for confirmation mode */}
                  {item.isPaid && (
                    <div className="w-2 h-2 bg-green-500 rounded-full" title="Paid"></div>
                  )}
                  <span className={`font-semibold text-base ${
                    item.isPaid ? 'text-green-700' : 'text-text-primary'
                  }`}>
                    {formatCurrency(item.totalPrice)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    } else {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="text-4xl mb-4">📋</div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">No items to confirm</h3>
            <p className="text-sm text-text-secondary">Add items to your cart first</p>
          </div>
        </div>
      );
    }
  }
});

CheckTabContent.displayName = 'CheckTabContent';
