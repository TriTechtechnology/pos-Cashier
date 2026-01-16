/**
 * SlotCard Component
 * 
 * PURPOSE: Displays individual order slots (dine-in tables, take-away counters, delivery slots).
 * Shows slot status, order details, and allows slot management. Home page specific component.
 * 
 * LINKS WITH:
 * - SlotIcon: Visual indicator for slot type and status
 * - SlotContent: Slot information display (number, status, order details)
 * - useSlotCard hook: Slot state management and operations
 * - Slot, OrderType types: Defines data structures
 * 
 * WHY: Home page specific component moved to _components directory following
 * the established pattern. Keeps all home page UI components organized.
 */

'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { DollarSign } from 'lucide-react';
import { Slot, OrderType } from '@/types/pos';
import { useSlotCard } from './hooks/useSlotCard';
import { SlotIcon } from './slot-icon';
import { SlotContent } from './slot-content';

interface SlotCardProps {
  slot: Slot;
  index: number;
  isSelected: boolean;
  selectedIndex: number | null | undefined;
  onSelect: (index: number) => void;
  onSwap: (fromIndex: number, toIndex: number) => void;
  onClick?: (slot: Slot) => void;
  onAddOrder?: (orderType: OrderType) => void;
  isCompact?: boolean;
  onDelete?: () => Promise<boolean | void>;
  showDeleteButton?: boolean;
}

const SlotCard: React.FC<SlotCardProps> = React.memo(({ 
  slot, 
  index,
  isSelected,
  selectedIndex,
  onSelect,
  onSwap,
  onClick, 
  isCompact = false,
  onDelete,
  showDeleteButton = false
}) => {
  const {
    isPressed,
    cardHeight,
    iconSize,
    textSize,
    padding,
    borderStyling,
    timerBorderClass,
    currentTimer,
    handleTouchStart,
    handleTouchEnd,
    handleMouseDown,
    handleMouseUp,
    handleMouseLeave,
    justSelectedRef
  } = useSlotCard({
    slot,
    index,
    isSelected,
    selectedIndex,
    onSelect,
    isCompact
  });

  const handleClick = (e: React.MouseEvent) => {
    // CRITICAL: If there's a DIFFERENT selected slot, ALWAYS allow swap (ignore justSelectedRef)
    if (selectedIndex !== null && selectedIndex !== undefined && selectedIndex !== index && onSwap) {
      onSwap(selectedIndex, index);
      return;
    }

    // Block click ONLY if we just selected THIS slot via hold
    if (justSelectedRef.current && isSelected) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    // If clicking the same slot that's already selected, ONLY deselect (no navigation)
    if (selectedIndex === index) {
      onSelect(-1); // Deselect
      return; // Don't navigate - just cancel selection
    }

    // Otherwise, handle normal click behavior (no selection active)
    if (onClick && (slot.status === 'available' || slot.status === 'processing' || slot.status === 'draft')) {
      onClick(slot);
    }
  };

  return (
    <Card
      className={`
        relative cursor-pointer transition-all duration-200 group
        ${cardHeight} ${padding}
        ${isPressed ? 'scale-95' : ''}
        ${borderStyling}
        ${timerBorderClass}
        ${slot.status === 'processing' ? 'bg-card' : 'bg-secondary'}
        ${isPressed ? 'scale-95 shadow-inner' : ''}
        touch-manipulation select-none
      `}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      <CardContent className="h-full flex flex-col justify-between p-0">
        {/* Header with Icon and Status */}
        <div className="flex items-center justify-between">
          <SlotIcon 
            slot={slot} 
            iconSize={iconSize} 
            isCompact={isCompact} 
          />
          
          <div className="flex items-center gap-1">
            {/* Unpaid Order Indicator - Red dollar icon for unpaid processing orders */}
            {slot.status === 'processing' && slot.paymentStatus === 'unpaid' && (
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center"
                title="Payment pending"
              >
                <DollarSign className="w-3 h-3 text-red-500" />
              </div>
            )}

            {/* Delete Button - Only show when in edit mode and deletable */}
            {showDeleteButton && onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="w-1 h-1 rounded-sm bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/80 transition-colors"
                title="Delete Slot"
              >
                <span className="text-xs font-bold">−</span>
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <SlotContent 
          slot={slot} 
          textSize={textSize} 
          isCompact={isCompact} 
          currentTimer={currentTimer}
        />

        {/* Processing Timer Border Animation */}
        {slot.status === 'processing' && (
          <div className="absolute inset-0 pointer-events-none">
            <div className={`absolute inset-0 rounded-lg ${timerBorderClass}`} />
          </div>
        )}
      </CardContent>
    </Card>
  );
});

SlotCard.displayName = 'SlotCard';

export default SlotCard;
