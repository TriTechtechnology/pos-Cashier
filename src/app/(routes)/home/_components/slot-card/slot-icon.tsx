/**
 * SlotIcon Component
 * 
 * PURPOSE: Displays visual indicators for different slot statuses (available, processing, draft).
 * Home page specific component for slot visual representation.
 * 
 * LINKS WITH:
 * - SlotCard: Main slot card component that uses this icon
 * - Slot type: Defines slot data structure
 * - Lucide icons: Visual indicators for different states
 * 
 * WHY: Home page specific component moved to _components directory following
 * the established pattern. Keeps all home page UI components organized.
 */

import { UsersRound, Plus, SearchX } from 'lucide-react';
import { Slot } from '@/types/pos';

interface SlotIconProps {
  slot: Slot;
  iconSize: string;
  isCompact?: boolean;
}

export const SlotIcon: React.FC<SlotIconProps> = ({ slot, iconSize }) => {
  switch (slot.status) {
    case 'available':
      return (
        <div className="flex items-center gap-1">
          <Plus className={`${iconSize} text-text-secondary`} />
        </div>
      );
    case 'processing':
      return <UsersRound className={`${iconSize} text-text-primary`} />;
    case 'draft':
      return <SearchX className={`${iconSize} text-warning`} />;
    default:
      return <UsersRound className={`${iconSize} text-text-secondary`} />;
  }
};
