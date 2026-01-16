'use client';

import { Minus, Plus } from 'lucide-react';

interface QuantityControlsProps {
  quantity: number;
  onQuantityChange: (quantity: number) => void;
}

export const QuantityControls: React.FC<QuantityControlsProps> = ({
  quantity,
  onQuantityChange
}) => {
  return (
    <div className="flex items-center space-x-4">
      <button
        onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
        className="w-10 h-10 bg-card border border-border rounded-full hover:bg-secondary active:bg-secondary transition-colors flex items-center justify-center"
      >
        <Minus className="w-4 h-4 text-text-primary" />
      </button>
      <span className="text-lg font-inter text-text-primary">{quantity}</span>
      <button
        onClick={() => onQuantityChange(quantity + 1)}
        className="w-10 h-10 bg-card border border-border rounded-full hover:bg-secondary active:bg-secondary transition-colors flex items-center justify-center"
      >
        <Plus className="w-4 h-4 text-text-primary" />
      </button>
    </div>
  );
};
