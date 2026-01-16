import React from 'react';
import { Button } from '@/components/ui/button';
import { QuantityControls } from './QuantityControls';

interface ItemModifierFooterProps {
  quantity: number;
  isFormValid: boolean;
  isEditing: boolean;
  onQuantityChange: (quantity: number) => void;
  onAddToCart: () => void;
}

export const ItemModifierFooter: React.FC<ItemModifierFooterProps> = React.memo(({
  quantity,
  isFormValid,
  isEditing,
  onQuantityChange,
  onAddToCart
}) => {
  return (
    <div className="sticky bottom-0 z-10 bg-secondary backdrop-blur-sm border-t border-border p-4">
      <div className="flex items-center justify-between">
        {/* Quantity Controls - Left */}
        <QuantityControls
          quantity={quantity}
          onQuantityChange={onQuantityChange}
        />

        {/* Add to Cart Button - Right */}
        <Button
          onClick={onAddToCart}
          disabled={!isFormValid}
          variant="fill"
          size="default"
          className="px-6 py-3 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isEditing ? 'UPDATE ITEM' : 'ADD TO CART'}
        </Button>
      </div>
    </div>
  );
});

ItemModifierFooter.displayName = 'ItemModifierFooter';
