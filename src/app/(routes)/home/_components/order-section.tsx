/**
 * OrderSection Component
 * 
 * PURPOSE: Displays a section of order slots (dine-in, take-away, delivery) with
 * responsive grid layout and add new slot functionality. Home page specific component.
 * 
 * LINKS WITH:
 * - SlotCard: Individual slot display component
 * - HomePageContent: Main component that uses this section
 * - useSlotManagement: Provides slot data and handlers
 * - Slot, OrderType types: Defines data structures
 * 
 * WHY: Home page specific component moved to _components directory following
 * the established pattern. Keeps all home page UI components organized.
 */

'use client';

import { Slot, OrderType } from '@/types/pos';
import { SlotCard } from './slot-card';

interface SelectedSlot {
  index: number;
  section: string;
}

interface OrderSectionProps {
  title: string;
  orderType: OrderType;
  slots: Slot[];
  onSlotClick?: (slot: Slot) => void;
  onAddOrder?: (orderType: OrderType) => void;
  isMainSection?: boolean;
  isCompact?: boolean;
  selectedIndex?: number | null | undefined;
  onSelect: (index: number) => void;
  onSwap: (fromIndex: number, toIndex: number) => void;
  onDeleteSlot?: (slotId: string) => Promise<boolean>;
  selectedSlot?: SelectedSlot | null;
}

const OrderSection: React.FC<OrderSectionProps> = ({
  title,
  orderType,
  slots,
  onSlotClick,
  onAddOrder,
  isMainSection = false,
  isCompact = false,
  selectedIndex,
  onSelect,
  onSwap,
  onDeleteSlot,
  selectedSlot
}) => {
  const handleAddOrder = () => {
    if (onAddOrder) {
      onAddOrder(orderType);
    }
  };

  const getGridConfig = () => {
    if (isMainSection) {
      // Main Dine In section - responsive with max 10 tiles per row
      return {
        containerClass: "w-full max-w-full",
        titleClass: "mb-3 px-5",
        titleSize: "text-2xl font-semibold text-text-primary",
        gridClass: "grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-10 gap-2 md:gap-3",
        containerPadding: "px-5 py-3"
      };
    } else {
      // Secondary sections - same visual size as main section with consistent height
      return {
        containerClass: "w-full max-w-full",
        titleClass: "mb-3 px-5",
        titleSize: "text-2xl font-semibold text-text-primary",
        gridClass: "grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-10 gap-2 md:gap-3",
        containerPadding: "px-5 py-3"
      };
    }
  };

  const gridConfig = getGridConfig();
  const cardHeight = isCompact ? 'h-20' : 'h-24';

  return (
    <div className={gridConfig.containerClass}>
      {/* Section Title */}
      <div className={gridConfig.titleClass}>
        <h2 className={gridConfig.titleSize}>
          {title}
        </h2>
      </div>

      {/* Slots Grid Container */}
      <div className={gridConfig.containerPadding}>
        <div className={gridConfig.gridClass}>
          {slots.map((slot, index) => {
            const isLastSlot = index === slots.length - 1;
            const canDelete = isLastSlot && slot.status === 'available' && !!selectedSlot;
            
            return (
              <SlotCard
                key={slot.id}
                slot={slot}
                index={index}
                isSelected={selectedIndex === index}
                selectedIndex={selectedIndex}
                onSelect={onSelect}
                onSwap={onSwap}
                onClick={onSlotClick}
                onAddOrder={onAddOrder}
                isCompact={isCompact}
                onDelete={canDelete && onDeleteSlot ? () => onDeleteSlot(slot.id) : undefined}
                showDeleteButton={canDelete}
              />
            );
          })}
          
          {/* Add New Slot Button - Only for real order types, not drafts */}
          {orderType !== 'draft' && (
            <div
              className={`flex items-center justify-center w-full ${cardHeight} border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary hover:bg-accent/50 transition-all duration-200 hover:scale-105 active:scale-95`}
              onClick={handleAddOrder}
            >
              <div className="flex flex-col items-center gap-1 text-text-secondary">
                <span className="text-lg font-bold">+</span>
                <span className="text-xs font-medium">Add</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderSection;
