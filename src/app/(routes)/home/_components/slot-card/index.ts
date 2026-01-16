/**
 * SlotCard Components Index
 * 
 * PURPOSE: Centralized exports for all slot card related components.
 * Provides clean imports and follows the established pattern.
 * 
 * LINKS WITH:
 * - All slot card components in this directory
 * - OrderSection: Component that imports from this index
 * 
 * WHY: Follows the established pattern of having index files for clean imports
 * and better organization of page-specific components.
 */

export { default as SlotCard } from './slot-card';
export { SlotIcon } from './slot-icon';
export { SlotContent } from './slot-content';
export { useSlotCard } from './hooks/useSlotCard';
