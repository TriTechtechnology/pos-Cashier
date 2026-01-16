/**
 * Global POS Components Index
 * 
 * PURPOSE: Centralized exports for global POS components that are used across
 * multiple pages or in the main layout. Page-specific components have been
 * moved to their respective page directories.
 * 
 * LINKS WITH:
 * - Layout components: Used in main layout
 * - Global utilities: Used across multiple pages
 * 
 * WHY: Only components that are truly global (used in layout or multiple pages)
 * remain here. All page-specific components have been moved to their respective
 * page directories for better organization.
 */

// Global Components (used in layout or multiple pages)
export { default as LoyaltyCardModal } from './LoyaltyCardModal';
export { default as LoyaltyCardScanner } from './LoyaltyCardScanner';
export { default as QRScanner } from './QRScanner';

// Loyalty Integration (global utility)
export * from './LoyaltyIntegration';
export * from './OrderOverlay';

// Note: The following components have been moved to their respective page directories:
// - CartOverlay, PaymentOverlay, ItemModifier, MenuItem, OrderCompletion → menu/_components
// - SlotCard, OrderSection → home/_components
// - CustomerManagement, DiscountManagement, PaymentProcessing → menu/_components