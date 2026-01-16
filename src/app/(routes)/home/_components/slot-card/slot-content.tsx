/**
 * SlotContent Component
 * 
 * PURPOSE: Displays slot information including number, status, timer, and order details.
 * Home page specific component for slot content display.
 * 
 * LINKS WITH:
 * - SlotCard: Main slot card component that uses this content
 * - Slot type: Defines slot data structure
 * - Lucide icons: Visual indicators for timer and draft status
 * 
 * WHY: Home page specific component moved to _components directory following
 * the established pattern. Keeps all home page UI components organized.
 */

import { Clock } from 'lucide-react';
import { Slot } from '@/types/pos';

interface SlotContentProps {
  slot: Slot;
  textSize: string;
  isCompact: boolean;
  currentTimer: string;
}

export const SlotContent: React.FC<SlotContentProps> = ({ 
  slot, 
  textSize, 
  isCompact, 
  currentTimer 
}) => {
  return (
    <div className="flex flex-col">
      <span className={`${textSize} font-semibold text-text-primary`}>
        {slot.status === 'available' ? `Add ${slot.id}` : slot.id}
      </span>
      
      {/* Timer for Processing Orders */}
      {slot.status === 'processing' && (
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3 text-text-secondary" />
          <span className={`${isCompact ? 'text-[10px]' : 'text-xs'} text-text-secondary`}>
            {currentTimer}
          </span>
        </div>
      )}
      
      {/* Order Details Indicator for Draft Orders */}
      {slot.status === 'draft' && (
        <div className="flex items-center gap-1">
          <span className={`${isCompact ? 'text-[10px]' : 'text-xs'} text-warning`}>
            Saved Draft
          </span>
        </div>
      )}
    </div>
  );
};
