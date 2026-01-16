/**
 * Menu Components Index
 * 
 * PURPOSE: Centralized exports for all menu-specific components.
 * Provides clean imports and follows the established pattern.
 * 
 * LINKS WITH:
 * - All menu components in this directory
 * - MenuPageContent: Main component that imports from this index
 * 
 * WHY: Follows the established pattern of having index files for clean imports
 * and better organization of page-specific components.
 */

export { MenuPageContent } from './menu-page-content';
export { MenuHeader } from './menu-header';
export { CategoryButton } from './category-button';

// Menu-specific components (moved from global components)
export { DraggableMenuItem } from './menu-item';
export { ItemModifier } from './item-modifier';
export { CartOverlay } from './cart-overlay';
export { PaymentOverlay } from './payment-overlay';
export { SlotSelector } from './slot-selector';

// Re-export sub-components for easy access
export * from './cart-overlay';
export * from './item-modifier';
export * from './menu-item';
export * from './order-completion';
export * from './payment-overlay-components';
export * from './customer-management';
export * from './discount-management';
