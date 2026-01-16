/**
 * CustomItemInputs Component
 *
 * PURPOSE: Editable name and price inputs for custom menu items
 * Only shown when adding/editing custom items (isCustomTemplate or isCustomItem)
 */

import React from 'react';

interface CustomItemInputsProps {
  name: string;
  price: number;
  onNameChange: (value: string) => void;
  onPriceChange: (value: number) => void;
}

export const CustomItemInputs: React.FC<CustomItemInputsProps> = React.memo(({
  name,
  price,
  onNameChange,
  onPriceChange
}) => {
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow empty or valid numbers
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      onPriceChange(value === '' ? 0 : parseFloat(value));
    }
  };

  return (
    <div className="space-y-4 p-4 bg-card rounded-lg border border-border">
      <h3 className="text-lg font-semibold text-text-primary">Custom Item Details</h3>

      {/* Name Input */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">
          Item Name *
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Enter item name"
          className="w-full px-4 py-3 bg-secondary border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
          autoFocus
          maxLength={50}
        />
      </div>

      {/* Price Input */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">
          Price (Rs.) *
        </label>
        <input
          type="text"
          inputMode="decimal"
          value={price === 0 ? '' : price}
          onChange={handlePriceChange}
          placeholder="0.00"
          className="w-full px-4 py-3 bg-secondary border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <p className="text-xs text-text-secondary">
        ✨ This item will be saved to your Custom category for quick reuse
      </p>
    </div>
  );
});

CustomItemInputs.displayName = 'CustomItemInputs';
