import React, { useState, useRef } from 'react';
import { Repeat, Trash2, CheckCircle, RotateCcw, X } from 'lucide-react';
import { CartItem as CartItemType } from '@/lib/store/cart-new';
import { formatCurrency } from '@/lib/utils/format';

interface SwipeableCartItemProps {
  item: CartItemType;
  onItemClick: (item: CartItemType) => void;
  onRepeat: (item: CartItemType) => void;
  onDelete: (uniqueId: string) => void;
  onRefund?: (item: CartItemType) => void;
  onMarkWaste?: (item: CartItemType) => void;
}

export const SwipeableCartItem: React.FC<SwipeableCartItemProps> = React.memo(({
  item,
  onItemClick,
  onRepeat,
  onDelete,
  onRefund,
  onMarkWaste
}) => {
  const [isSwiping, setIsSwiping] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [startX, setStartX] = useState(0);
  const [lastTap, setLastTap] = useState(0);
  const itemRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    setStartX(e.touches[0].clientX);
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isSwiping) return;
    
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX;
    
    // Limit swipe to left (negative) or right (positive) with max distance
    const maxSwipe = 120;
    const clampedDiff = Math.max(-maxSwipe, Math.min(maxSwipe, diff));
    
    setSwipeOffset(clampedDiff);
  };

  const handleTouchEnd = () => {
    setIsSwiping(false);

    // Different actions for paid vs unpaid items
    const isPaidItem = item.isPaid === true;

    // Determine swipe action based on distance (more than half = 60px)
    if (swipeOffset > 60) {
      // Swipe right
      if (isPaidItem) {
        // PAID ITEM: Remake (food quality issue, remake without charge)
        onMarkWaste?.(item);
      } else {
        // UNPAID ITEM: Repeat item (add another)
        onRepeat(item);
      }
    } else if (swipeOffset < -60) {
      // Swipe left
      if (isPaidItem) {
        // PAID ITEM: Void/Cancel (refund with manager approval)
        onRefund?.(item);
      } else {
        // UNPAID ITEM: Delete from cart
        onDelete(item.uniqueId);
      }
    }

    // Reset position
    setSwipeOffset(0);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setStartX(e.clientX);
    setIsSwiping(true);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isSwiping) return;
    
    const currentX = e.clientX;
    const diff = currentX - startX;
    
    const maxSwipe = 120;
    const clampedDiff = Math.max(-maxSwipe, Math.min(maxSwipe, diff));
    
    setSwipeOffset(clampedDiff);
  };

  const handleMouseUp = () => {
    handleTouchEnd();
  };

  const handleMouseLeave = () => {
    if (isSwiping) {
      handleTouchEnd();
    }
  };

  const handleDoubleTap = () => {
    // 🎯 PROFESSIONAL: Prevent double-tap on modifier upgrade items
    console.log('👆 [DOUBLE TAP] Item:', item.name, 'isModifierUpgrade:', item.isModifierUpgrade);

    if (item.isModifierUpgrade === true) {
      console.log('⚠️ [SWIPEABLE ITEM] Cannot edit modifier upgrade item - blocked at double-tap level');
      return;
    }

    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300; // 300ms for double tap

    if (now - lastTap < DOUBLE_TAP_DELAY) {
      // Double tap detected - open item modifier
      console.log('✅ [DOUBLE TAP] Opening modifier for:', item.name);
      onItemClick(item);
    }

    setLastTap(now);
  };

  // Determine item payment status for different actions
  const isPaidItem = item.isPaid === true;

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Action Buttons (hidden behind item) - Different for paid vs unpaid */}
      <div className="absolute inset-0 flex pointer-events-none">
        {/* Left Action (Swipe right reveals) */}
        <div className={`flex-1 flex items-center justify-center rounded-l-lg opacity-0 transition-opacity duration-200 ${
          isPaidItem ? 'bg-orange-500' : 'bg-blue-500'
        }`} style={{ opacity: swipeOffset > 0 ? Math.min(swipeOffset / 60, 1) : 0 }}>
          {isPaidItem ? (
            <RotateCcw className="w-6 h-6 text-white" />
          ) : (
            <Repeat className="w-6 h-6 text-white" />
          )}
        </div>
        {/* Right Action (Swipe left reveals) */}
        <div className={`flex-1 flex items-center justify-center rounded-r-lg opacity-0 transition-opacity duration-200 ${
          isPaidItem ? 'bg-red-500' : 'bg-red-500'
        }`} style={{ opacity: swipeOffset < 0 ? Math.min(Math.abs(swipeOffset) / 60, 1) : 0 }}>
          {isPaidItem ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <Trash2 className="w-6 h-6 text-white" />
          )}
        </div>
      </div>
      
      {/* Main Item Content */}
      <div
        ref={itemRef}
        className={`relative p-3 border-b border-border/20 transition-transform duration-200 ease-out rounded-lg ${
          isSwiping ? 'transition-none' : ''
        } ${
          isPaidItem
            ? 'bg-card border-green-200 border-l-0 border-1-green-500'
            : 'bg-card'
        }`}
        style={{
          transform: `translateX(${swipeOffset}px)`,
          touchAction: 'pan-y'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 pr-3" onClick={handleDoubleTap}>
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
            {/* Paid indicator */}
            {isPaidItem && (
              <CheckCircle className="w-5 h-5 text-green-600" />
            )}

            {/* Price display */}
            <span className={`font-semibold text-base ${
              isPaidItem ? 'text-green-700' : 'text-text-primary'
            }`}>
              {formatCurrency(item.totalPrice)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});

SwipeableCartItem.displayName = 'SwipeableCartItem';
