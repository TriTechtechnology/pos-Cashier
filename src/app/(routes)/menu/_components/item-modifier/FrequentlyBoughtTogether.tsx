'use client';

import React from 'react';
import { MenuItem } from '@/types/pos';
import { formatCurrency } from '@/lib/utils/format';

interface FrequentlyBoughtTogetherProps {
  items: MenuItem[];
  selectedItems: string[];
  onItemToggle: (itemId: string) => void;
  disabled?: boolean;
}

export const FrequentlyBoughtTogether: React.FC<FrequentlyBoughtTogetherProps> = ({
  items,
  selectedItems,
  onItemToggle,
  disabled = false
}) => {
  if (items.length === 0) return null;

  return (
    <div className={`space-y-3 ${disabled ? 'opacity-50' : ''}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-text-primary">
          Frequently Bought Together
          {disabled && <span className="text-sm text-text-secondary ml-2">(Not available when editing)</span>}
        </h3>
        {!disabled && (
          <span className="text-sm text-text-secondary">
            {selectedItems.length} selected
          </span>
        )}
      </div>
      
      <div className="space-y-2">
        {items.map((item) => {
          const isSelected = selectedItems.includes(item.id);
          
          return (
            <div
              key={item.id}
              onClick={() => !disabled && onItemToggle(item.id)}
              className={`p-3 border rounded-lg transition-all duration-200 ${
                disabled 
                  ? 'border-border bg-muted cursor-not-allowed'
                  : isSelected
                    ? 'border-primary bg-primary/5 cursor-pointer'
                    : 'border-border hover:border-primary/50 hover:bg-card cursor-pointer'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-text-primary">
                        {item.name}
                      </h4>
                      {item.description && (
                        <p className="text-xs text-text-secondary mt-1 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                    </div>
                    <div className="text-right ml-3">
                      <p className="text-sm font-semibold text-text-primary">
                        {formatCurrency(item.price)}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Selection indicator */}
                <div className={`ml-3 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  isSelected
                    ? 'border-primary bg-primary'
                    : 'border-border'
                }`}>
                  {isSelected && (
                    <div className="w-2 h-2 bg-white rounded-full" />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {!disabled && selectedItems.length > 0 && (
        <div className="mt-3 p-2 bg-primary/5 border border-primary/20 rounded-lg">
          <p className="text-xs text-text-secondary">
            Selected items will be added as separate cart items
          </p>
        </div>
      )}
    </div>
  );
};
