import React from 'react';

interface ItemModifierHeaderProps {
  itemName: string;
  pricePerItem: number;
}

export const ItemModifierHeader: React.FC<ItemModifierHeaderProps> = React.memo(({
  itemName,
  pricePerItem
}) => {
  return (
    <div className="sticky top-0 z-10 bg-secondary backdrop-blur-sm border-b border-border p-5">
      <div className="flex items-center justify-between">
        {/* Item Name */}
        <h2 className="text-xl font-semibold text-text-primary font-inter">
          {itemName}
        </h2>
        
        {/* Price always visible in top right - Show calculated price per item */}
        <div className="text-lg font-medium text-text-primary font-inter">
          Rs. {Math.round(pricePerItem)}
        </div>
      </div>
    </div>
  );
});

ItemModifierHeader.displayName = 'ItemModifierHeader';
