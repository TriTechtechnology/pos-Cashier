'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, Edit, RotateCcw } from 'lucide-react';
import type { CartItem } from '@/lib/store/cart-new';

interface CartItemsListProps {
  items: CartItem[];
  onItemClick: (item: CartItem) => void;
  onItemRemove: (itemId: string) => void;
  onItemRepeat?: (item: CartItem) => void;
}

export const CartItemsList: React.FC<CartItemsListProps> = React.memo(({
  items,
  onItemClick,
  onItemRemove,
  onItemRepeat
}) => {
  if (items.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <div className="text-6xl mb-4">🛒</div>
          <p className="text-lg font-medium">Your cart is empty</p>
          <p className="text-sm">Add items from the menu to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 px-4 overflow-y-auto">
      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.uniqueId}
            className="bg-muted/30 rounded-lg p-3 border border-border hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm truncate">{item.name}</span>
                  <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md shrink-0">
                    ×{item.quantity}
                  </span>
                </div>

                {/* Description */}
                {item.description && (
                  <div className="text-xs text-muted-foreground mb-2">
                    {item.description}
                  </div>
                )}

                {/* Modifiers Display */}
                {((item.modifiers?.variations?.length ?? 0) > 0 || (item.modifiers?.addOns?.length ?? 0) > 0) && (
                  <div className="text-xs text-muted-foreground space-y-1 mb-2">
                    {item.modifiers.variations?.map((variation, index) => (
                      <div key={index} className="flex justify-between">
                        <span>• {variation.name}</span>
                        <span>+${variation.price.toFixed(2)}</span>
                      </div>
                    ))}
                    {item.modifiers.addOns?.map((addon, index) => (
                      <div key={index} className="flex justify-between">
                        <span>• {addon.name}</span>
                        <span>+${addon.price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Special Instructions */}
                {item.modifiers?.specialInstructions && (
                  <div className="text-xs text-muted-foreground italic bg-muted/50 px-2 py-1 rounded mb-2">
                    &ldquo;{item.modifiers.specialInstructions}&rdquo;
                  </div>
                )}

                <div className="font-semibold text-sm">
                  ${item.totalPrice.toFixed(2)}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="icon"
                  size="sm"
                  onClick={() => onItemClick(item)}
                  className="h-8 w-8 p-0 hover:bg-primary/10"
                  title="Edit item"
                >
                  <Edit className="h-3 w-3" />
                </Button>

                {onItemRepeat && (
                  <Button
                    variant="icon"
                    size="sm"
                    onClick={() => onItemRepeat(item)}
                    className="h-8 w-8 p-0 hover:bg-blue-100"
                    title="Repeat item"
                  >
                    <RotateCcw className="h-3 w-3" />
                  </Button>
                )}

                <Button
                  variant="icon"
                  size="sm"
                  onClick={() => onItemRemove(item.uniqueId)}
                  className="h-8 w-8 p-0 hover:bg-destructive/10 text-destructive"
                  title="Remove item"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

CartItemsList.displayName = 'CartItemsList';