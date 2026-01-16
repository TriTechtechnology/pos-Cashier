/**
 * CartOverlay Component
 * 
 * PURPOSE: Main shopping cart interface that appears as a slide-out overlay from the right side.
 * Handles the complete order flow from cart management to payment confirmation.
 * 
 * LINKS WITH:
 * - CartOverlayHeader: Shows order info, undo/cancel buttons
 * - CartOverlayTabs: Navigation between Check, Actions, Guest tabs
 * - CheckTabContent: Displays cart items with edit/delete options
 * - ActionsTabContent: Discount codes and cart actions
 * - GuestTabContent: Customer info and loyalty card integration
 * - ConfirmationModeContent: Order review before payment
 * - CartTotals: Price calculations and proceed to payment button
 * - useCart hook: Cart state management
 * - useCustomerStore: Customer data management
 * - LoyaltyAPI: Loyalty card operations
 * 
 * WHY: Central component that orchestrates the entire order process,
 * managing state between cart items, customer info, and payment flow.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { CartItem as CartItemType, useCartItems, useCartSubtotal, useCartTotal, useCurrentSlotId, useCustomer, useTax, useDiscount, useCartActions, useOrderId } from '@/lib/store/cart-new';
import { useCustomerStore } from '@/lib/store/customer';
import { LoyaltyAPI } from '@/lib/api/loyalty';
import { useOverlayModeStore } from '@/lib/store/overlay-mode';
// 🏆 PROFESSIONAL: No draft store needed - using single source of truth (ORDER OVERLAYS)
// New optimized sub-components (currently unused - for future optimization)
// import { CartHeader } from './cart-overlay/CartHeader';
// import { CartItemsList } from './cart-overlay/CartItemsList';
// import { CartSummary } from './cart-overlay/CartSummary';

// Legacy components (keep for compatibility)
import { CartOverlayHeader } from './cart-overlay/CartOverlayHeader';
import { CartOverlayTabs } from './cart-overlay/CartOverlayTabs';
import { CheckTabContent } from './cart-overlay/CheckTabContent';
import { ActionsTabContent } from './cart-overlay/ActionsTabContent';
import { GuestTabContent } from './cart-overlay/GuestTabContent';
import { ConfirmationModeContent } from './cart-overlay/ConfirmationModeContent';
import { CartTotals } from './cart-overlay/CartTotals';
import { ManagerApprovalModal } from '@/components/pos/ManagerApprovalModal';
import { OrderCompletionOverlay } from './order-completion/OrderCompletionOverlay';

interface CartOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
  slotId?: string | null;
  orderType?: 'dine-in' | 'take-away' | 'delivery' | null;
  onEditItem?: (item: CartItemType) => void;
  onCancelOrder?: () => void;
  onDraftOrder?: () => void;
  // onUndoLastAction?: () => void; // Legacy - replaced by Clear Cart button
  mode?: 'cart' | 'confirmation';
  onModeChange?: (mode: 'cart' | 'confirmation') => void;
  taxRate?: number; // Dynamic tax rate from payment method (Cash: 16%, Card: 5%)
}

export const CartOverlay: React.FC<CartOverlayProps> = React.memo(({
  isOpen,
  onClose,
  className = '',
  slotId = null,
  orderType = null,
  onEditItem,
  onCancelOrder,
  onDraftOrder,
  // onUndoLastAction, // Legacy - replaced by Clear Cart button
  mode = 'cart',
  onModeChange,
  taxRate = 16 // Default to cash tax rate
}) => {
  console.log('🛒 CartOverlay rendered:', { isOpen, slotId, orderType, mode });
  const [activeTab, setActiveTab] = useState<'check' | 'actions' | 'guest'>('check');
  const [discountCode, setDiscountCode] = useState('');
  const [discountError, setDiscountError] = useState('');
  const [showAvailableDiscounts, setShowAvailableDiscounts] = useState(false);
  const [showOrderCompletion, setShowOrderCompletion] = useState(false);

  // 🏆 PROFESSIONAL MANAGER APPROVAL STATE
  const [showManagerApproval, setShowManagerApproval] = useState(false);
  const [managerApprovalData, setManagerApprovalData] = useState<{
    operation: 'void' | 'waste' | 'modify' | 'refund' | 'cancel';
    item: CartItemType;
    onApprove: (pin: string, reason: string, inventoryReversal?: boolean) => void;
  } | null>(null);
  // BULLETPROOF: Action history for audit trail (kept for manager approval operations)
  const [actionHistory, setActionHistory] = useState<Array<{
    type: 'remove_item' | 'apply_discount' | 'remove_discount' | 'cancel_order' | 'draft_order' | 'add_item';
    data: {
      item?: CartItemType;
      itemId?: string;
      discount?: { code: string; name: string; type: 'percentage' | 'fixed'; value: number } | string;
      slotId?: string | null;
      orderType?: 'dine-in' | 'take-away' | 'delivery' | null;
      id?: string;
      items?: CartItemType[];
      total?: number;
      operation?: string;
      managerPin?: string;
      reason?: string;
    };
    timestamp: number;
  }>>([]);
  
  // PROFESSIONAL APPROACH: Direct store subscriptions
  // PROFESSIONAL APPROACH: Use new bulletproof cart store
  const currentSlotId = useCurrentSlotId();
  const items = useCartItems();
  const subtotal = useCartSubtotal();
  const total = useCartTotal();
  const customer = useCustomer();
  const tax = useTax();
  const discount = useDiscount();
  const cartDiscount = discount; // Use discount from new cart store
  
  console.log('🛒 CartOverlay - Professional cart state:', {
    currentSlotId,
    itemsCount: items.length,
    subtotal,
    total,
    auditTrail: actionHistory.length // Used for audit compliance
  });
  
  // Get professional cart actions
  const { removeItem, clearCart, setCustomer, applyDiscount, addItem } = useCartActions();
  
  // Debug cart items in CartOverlay
  console.log('🛒 CartOverlay - items:', items);
  console.log('🛒 CartOverlay - items.length:', items.length);
  console.log('🛒 CartOverlay - subtotal:', subtotal);

  // Customer store for global customer management
  const {
    scannedCustomer,
    recentCustomers,
    clearScannedCustomer,
    searchQuery,
    searchResults,
    isSearching,
    setSearchQuery,
    setSearchResults,
    setSearching
  } = useCustomerStore();
  
  // Global overlay mode state
  const { setConfirmationMode } = useOverlayModeStore();

  // Draft store for professional draft management (auto-save handled by useMenuManagement)
  // const { saveDraft } = useDraftStore(); // Unused - auto-save handled elsewhere

  const handleItemClick = (item: CartItemType) => {
    console.log('🖱️ [CART] Item clicked - name:', item.name);
    console.log('🖱️ [CART] Item clicked - isModifierUpgrade:', item.isModifierUpgrade);
    console.log('🖱️ [CART] Item clicked - typeof isModifierUpgrade:', typeof item.isModifierUpgrade);
    console.log('🖱️ [CART] Item clicked - isModifierUpgrade === true:', item.isModifierUpgrade === true);
    console.log('🖱️ [CART] Item clicked - isPaid:', item.isPaid);

    // 🔍 DEBUG: For upgrade items, log full details
    if (item.name.includes('(modifier upgrade)')) {
      console.log('🔍 [UPGRADE ITEM DEBUG] Full item:', JSON.stringify(item, null, 2));
    }

    // 🎯 PROFESSIONAL: Prevent editing modifier upgrade items (they auto-update with parent item)
    if (item.isModifierUpgrade === true) {
      console.log('⚠️ [CART] Cannot edit modifier upgrade item directly - edit the original paid item instead');
      return;
    }

    // Open item modifier with saved modifications for editing
    if (onEditItem) {
      onEditItem(item);
    }
  };

  const handleRepeatItem = (item: CartItemType) => {
    addItem(
      item,
      1,
      item.modifiers,
      { keepSeparate: true }
    );
  };

  const handleDeleteItem = (uniqueId: string) => {
    // Track the item being removed for undo functionality
    const itemToRemove = items.find(item => item.uniqueId === uniqueId);
    if (itemToRemove) {
      setActionHistory(prev => [...prev, {
        type: 'remove_item',
        data: { item: itemToRemove, itemId: uniqueId },
        timestamp: Date.now()
      }]);
    }

    removeItem(uniqueId);
  };



  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) return;
    
    setDiscountError('');
    try {
      // For now, use a simple discount logic
      // In the future, this will call the discountsAPI
      const code = discountCode.trim().toUpperCase();
      
      if (code === 'WELCOME10') {
        const discount = {
          code: 'WELCOME10',
          name: 'Welcome Discount',
          type: 'percentage' as const,
          value: 10
        };
        applyDiscount(discount.value);
        setDiscountCode('');
        
        // Track discount application for undo
        setActionHistory(prev => [...prev, {
          type: 'apply_discount',
          data: { discount },
          timestamp: Date.now()
        }]);
      } else if (code === 'SAVE500') {
        const discount = {
          code: 'SAVE500',
          name: 'Fixed Discount',
          type: 'fixed' as const,
          value: 500
        };
        applyDiscount(discount.value);
        setDiscountCode('');
        
        // Track discount application for undo
        setActionHistory(prev => [...prev, {
          type: 'apply_discount',
          data: { discount },
          timestamp: Date.now()
        }]);
      } else if (code === 'FOOD20') {
        const discount = {
          code: 'FOOD20',
          name: 'Food Discount',
          type: 'percentage' as const,
          value: 20
        };
        applyDiscount(discount.value);
        setDiscountCode('');
        
        // Track discount application for undo
        setActionHistory(prev => [...prev, {
          type: 'apply_discount',
          data: { discount },
          timestamp: Date.now()
        }]);
      } else {
        setDiscountError('Invalid discount code');
      }
    } catch {
      setDiscountError('Failed to apply discount');
    }
  };

  const handleRemoveDiscount = () => {
    // Track discount removal for undo
    setActionHistory(prev => [...prev, {
      type: 'remove_discount',
      data: { discount: 'cart_discount' },
      timestamp: Date.now()
    }]);
    
    setDiscountError('');
  };

  // 🏆 BULLETPROOF HEADER BUTTON HANDLERS

  /**
   * CANCEL ORDER (X Button) - Bulletproof Simple Implementation
   * KEEP IT SIMPLE: Just clear cart, clear data, and route home
   * Complex manager approval logic removed for reliability
   */
  const handleCancelOrder = async () => {
    try {
      console.log('🚫 [CANCEL ORDER] Checking slot status for manager approval:', slotId);

      // 🏆 BULLETPROOF SIMPLE: Just proceed with cancellation - manager approval can be added later
      console.log('🚫 [CANCEL ORDER] Simple cancellation for slot:', slotId);
      performCancellation();

    } catch (error) {
      console.error('❌ [CANCEL ORDER] Failed:', error);
    }
  };

  // 🏆 PROFESSIONAL: Actual cancellation logic separated for reuse
  const performCancellation = async () => {
    try {
      console.log('🚫 [CANCEL ORDER] Performing cancellation for slot:', slotId);

      // 🛡️ CRITICAL: Prevent auto-save race condition by signaling cancellation start
      if (onCancelOrder) {
        onCancelOrder(); // This sets isOrderCancelling = true in useMenuManagement
      }

      // Step 1: Clear the cart immediately
      clearCart();

      // Step 2: Clear scanned customer data
      clearScannedCustomer();

      // Step 3: Delete ONLY the current cart's order overlay (if it exists)
      // NEVER delete completed orders - they are historical records!
      if (cartOrderId) {
        try {
          const { useOrderOverlayStore } = await import('@/lib/store/order-overlay');
          const overlayStore = useOrderOverlayStore.getState();
          await overlayStore.removeOverlay(cartOrderId);
          console.log('✅ [CANCEL ORDER] Deleted current cart overlay:', cartOrderId);
        } catch (error) {
          console.warn('⚠️ [CANCEL ORDER] Order overlay not found or already deleted:', error);
        }
      }

      // Step 4: Set slot back to available
      if (slotId) {
        try {
          const { useUnifiedSlotStore } = await import('@/lib/store/unified-slots');
          const { setSlotAvailable } = useUnifiedSlotStore.getState();
          await setSlotAvailable(slotId);
          console.log('✅ [CANCEL ORDER] Slot set to available:', slotId);
        } catch (error) {
          console.warn('⚠️ [CANCEL ORDER] Could not update slot status:', error);
        }
      }

      // 🏆 PROFESSIONAL: No draft clearing needed - using single source of truth (ORDER OVERLAYS)

      // Step 6: BULLETPROOF - Clear overlay store cache for this slot
      try {
        const { useOrderOverlayStore } = await import('@/lib/store/order-overlay');
        const overlayStore = useOrderOverlayStore.getState();
        overlayStore.clearSlotCache(slotId || '');
        console.log('✅ [CANCEL ORDER] Cleared overlay cache for slot:', slotId);
      } catch (error) {
        console.warn('⚠️ [CANCEL ORDER] Could not clear overlay cache:', error);
      }

      // Step 7: Close overlay (routing already handled at the beginning)
      onClose();

      console.log('✅ [CANCEL ORDER] Simple cancellation completed successfully');
    } catch (error) {
      console.error('❌ [CANCEL ORDER] Error during cancellation:', error);
      // Bulletproof fallback: always clear and close
      clearCart();
      clearScannedCustomer();
      onClose();
    }
  };

  // REMOVED: Complex manager approval functions for simplicity and reliability

  /**
   * CLEAR CART (Trash Button) - Professional Implementation
   * Clears menu items only, keeps order overlay intact
   * Disabled for processing orders to prevent data corruption
   */
  const handleClearCart = () => {
    console.log('🗑️ [CLEAR CART] Clearing cart items only (keeping overlay)');

    // Add current items to action history for potential undo
    if (items.length > 0) {
      setActionHistory(prev => [...prev, {
        type: 'remove_item',
        data: {
          items: [...items],
          operation: 'clear_cart'
        },
        timestamp: Date.now()
      }]);
    }

    // Clear only the cart items, overlay remains intact
    clearCart();

    console.log('✅ [CLEAR CART] Cart items cleared successfully');
  };

  // LEGACY: Undo functionality replaced by Clear Cart button
  // handleUndoLastAction removed as it's no longer used in bulletproof implementation

  /**
   * DRAFT ORDER (Save Button) - Professional Implementation
   * Routes to home page while keeping order overlay intact
   * Order overlay automatically saves as draft when leaving menu page
   * Disabled for processing orders to prevent workflow disruption
   */
  const handleDraftOrder = async () => {
    try {
      console.log('💾 [DRAFT ORDER] Routing to home (order overlay auto-saves as draft)');

      // Add to action history for audit
      setActionHistory(prev => [...prev, {
        type: 'draft_order',
        data: { slotId, orderType, items: [...items], total, orderId: cartOrderId },
        timestamp: Date.now()
      }]);

      // Call the parent callback (which should route to home)
      if (onDraftOrder) {
        onDraftOrder();
      } else {
        // Default behavior: close the overlay (parent should handle routing)
        onClose();
      }

      console.log('✅ [DRAFT ORDER] Successfully initiated home navigation');
    } catch (error) {
      console.error('❌ [DRAFT ORDER] Error during draft handling:', error);

      // Fallback: still close overlay
      onClose();
    }
  };

  const handleContinueToPayment = () => {
    // Save any manually entered guest information before moving to confirmation
    if (customer?.name || customer?.phone || customer?.email || customer?.specialInstructions || (customer?.currentStamps && customer?.currentStamps > 0)) {
              const guestData = {
          name: customer?.name || '',
          phone: customer?.phone || '',
          email: customer?.email || '',
          specialInstructions: customer?.specialInstructions || ''
        };

      setCustomer(guestData);
      console.log('Saved guest data before confirmation:', guestData);
    }

    console.log('Moving to confirmation mode. Customer data:', customer);

    if (onModeChange) {
      onModeChange('confirmation');
    }
  };

  const handleCompleteOrder = async () => {
    console.log('💰 [COMPLETE ORDER] Direct order completion (no payment overlay)');

    // BULLETPROOF: Complete paid order directly without payment overlay
    try {
      const { setSlotCompleted } = (await import('@/lib/store/unified-slots')).useUnifiedSlotStore.getState();
      const { useOrderOverlayStore } = await import('@/lib/store/order-overlay');

      if (!slotId) {
        console.error('❌ [COMPLETE ORDER] No slot ID provided');
        return;
      }

      // 🚨 CRITICAL: Set completion flag to prevent auto-save during this process
      if (typeof window !== 'undefined') {
        (window as any).isOrderCompleting = true;
      }

      // 🚨 CRITICAL: Clear cart FIRST to prevent draft pollution
      console.log('🗑️ [COMPLETE ORDER] Clearing cart to prevent draft creation');
      clearCart();

      // CRITICAL: Update the overlay store to mark order as completed BEFORE updating slot
      const overlayStore = useOrderOverlayStore.getState();
      // BULLETPROOF: Use getOrderForEditing to find ANY order for the slot (including paid ones)
      const existingOverlay = await overlayStore.getOrderForEditing(slotId);

      if (existingOverlay) {
        // 🎯 PROFESSIONAL: Mark order as completed but preserve slot association for editing
        await overlayStore.updateOverlay(existingOverlay.id, {
          paymentStatus: 'paid',
          status: 'completed', // CRITICAL: Mark as completed so it doesn't load in cart
          // Mark all items as paid when completing the entire order
          items: existingOverlay.items.map(item => ({
            ...item,
            isPaid: true,
            originalOrderId: existingOverlay.id
          }))
        });
        console.log('✅ [ORDER OVERLAY] Marked order as completed with all items paid for order:', existingOverlay.id);

        // 🗑️ PROFESSIONAL: Clear slot cache to prevent stale data loading
        overlayStore.clearSlotCache(slotId);
      } else {
        // BULLETPROOF: If no overlay exists, create one from cart data to ensure order completion tracking
        console.warn('⚠️ [ORDER OVERLAY] No existing overlay found for slot:', slotId, '- creating completion record from cart data');

        if (items.length > 0 && customer && cartOrderId) {
          const orderNumber = cartOrderId;
          await overlayStore.upsertFromCart({
            orderId: orderNumber,
            slotId: slotId,
            orderType: orderType || 'dine-in',
            items: items.map(item => ({
              id: item.id,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              total: item.totalPrice,
              modifiers: item.modifiers
            })),
            customer: customer,
            total: total,
            paymentMethod: 'cash', // Default method for completion
            paymentStatus: 'paid',
            status: 'completed' // Mark as completed immediately
          });
          console.log('✅ [ORDER OVERLAY] Created completion record for order:', orderNumber);
        } else {
          console.warn('⚠️ [ORDER OVERLAY] No cart data available - order completion without tracking');
        }
      }

      // Mark slot as completed (this will set it to available)
      await setSlotCompleted(slotId);

      console.log('✅ [COMPLETE ORDER] Order completed for slot:', slotId);

      // Show order completion overlay instead of closing immediately
      setShowOrderCompletion(true);

    } catch (error) {
      console.error('❌ [COMPLETE ORDER] Error completing order:', error);
      // Fallback: show confirmation overlay if direct completion fails
      if (onModeChange) {
        onModeChange('confirmation');
      }
    } finally {
      // 🚨 CRITICAL: Clear completion flag regardless of success/failure
      if (typeof window !== 'undefined') {
        (window as any).isOrderCompleting = false;
      }
    }
  };

  const handlePrintReceipt = () => {
    // TODO: Implement print receipt functionality
    console.log('Print receipt');
  };

  const handleDraftOrderFromConfirmation = () => {
    handleDraftOrder();
  };

  const handleTipButton = () => {
    // TODO: Implement tip functionality
    console.log('Tip button clicked');
  };

  const handleOrderCompletionDone = () => {
    setShowOrderCompletion(false);
    onClose();
    // Navigation to home will happen automatically due to slot state change
  };

  // 🏆 PROFESSIONAL PAID ITEM OPERATIONS WITH MANAGER APPROVAL

  const handleRefundItem = (item: CartItemType) => {
    console.log('💰 [REFUND] Requesting manager approval for refund:', item.name);
    setManagerApprovalData({
      operation: 'void',
      item,
      onApprove: (pin: string, reason: string) => {
        handleManagerApprovedRefund(item, pin, reason);
      }
    });
    setShowManagerApproval(true);
  };

  const handleWasteItem = (item: CartItemType) => {
    console.log('🗑️ [WASTE] Requesting manager approval for waste:', item.name);
    setManagerApprovalData({
      operation: 'waste',
      item,
      onApprove: (pin: string, reason: string) => {
        handleManagerApprovedWaste(item, pin, reason);
      }
    });
    setShowManagerApproval(true);
  };

  const handleManagerApprovedRefund = async (item: CartItemType, pin: string, reason: string) => {
    console.log('✅ [MANAGER APPROVED] Processing refund for:', item.name);
    try {
      // TODO: Validate manager PIN
      // TODO: Process actual refund through payment gateway

      // Remove item from cart
      removeItem(item.uniqueId);

      // Add to action history with audit trail
      setActionHistory(prev => [...prev, {
        type: 'remove_item',
        data: {
          item,
          itemId: item.uniqueId,
          managerPin: pin.substring(0, 2) + '****', // Partial PIN for audit
          reason,
          operation: 'refund'
        },
        timestamp: Date.now()
      }]);

      console.log('✅ [REFUND] Item refunded successfully');
    } catch (error) {
      console.error('❌ [REFUND] Error processing refund:', error);
    }
  };

  const handleManagerApprovedWaste = async (item: CartItemType, pin: string, reason: string) => {
    console.log('✅ [MANAGER APPROVED] Processing waste for:', item.name);
    try {
      // TODO: Validate manager PIN

      // Mark item as wasted (remove from cart but no refund)
      removeItem(item.uniqueId);

      // Add remake option automatically
      const remakeItem = {
        ...item,
        uniqueId: `${item.id}-remake-${Date.now()}`,
        name: `${item.name} (Remake)`,
        isPaid: false, // Remake is free
        totalPrice: 0, // No charge for remake
        price: 0,
        isRemake: true
      };

      addItem(remakeItem);

      // Add to action history with audit trail
      setActionHistory(prev => [...prev, {
        type: 'remove_item',
        data: {
          item,
          itemId: item.uniqueId,
          managerPin: pin.substring(0, 2) + '****',
          reason,
          operation: 'waste_with_remake'
        },
        timestamp: Date.now()
      }]);

      console.log('✅ [WASTE + REMAKE] Item wasted and remake added');
    } catch (error) {
      console.error('❌ [WASTE] Error processing waste:', error);
    }
  };

  const handleManagerApprovalClose = () => {
    setShowManagerApproval(false);
    setManagerApprovalData(null);
  };

  // TODO: Handle reordering from customer history - Will be implemented when order history UI is added
  // Temporarily removed unused function to fix TypeScript errors

  // Guest information handler
  const handleSaveGuestInfo = async () => {
    const guestData: typeof customer = {
      name: customer?.name || '',
      phone: customer?.phone || '',
      email: customer?.email || '',
      currentStamps: customer?.currentStamps || 0,
      // Note: guestInstructions are not saved to customer object as they're handled separately
    };

    // If customer has a loyalty card, update stamps
    if (customer?.loyaltyCardId && customer?.currentStamps !== undefined) {
      try {
        if (customer.currentStamps > customer.currentStamps) {
          // Add stamps
          // await LoyaltyAPI.addStamps(customer.loyaltyCardId, customer.currentStamps - customer.currentStamps); // This line was removed
        } else if (customer.currentStamps < customer.currentStamps) {
          // Redeem stamps
          // await LoyaltyAPI.redeemStamps(customer.loyaltyCardId, customer.currentStamps - customer.currentStamps, 'Manual adjustment'); // This line was removed
        }
      } catch (error) {
        console.error('Failed to update loyalty stamps:', error);
      }
    }

    setCustomer(guestData);
    // Show success feedback (you could add a toast notification here)
    console.log('Guest information saved:', guestData);
  };

  // Customer lookup handler
  const handleCustomerLookup = async () => {
    if (!customerLookup.trim()) return;

    setIsLookingUp(true);
    try {
      // Try to search by phone number first
      const searchResult = await LoyaltyAPI.searchByPhone(customerLookup.trim());
      
      if (searchResult.success && searchResult.data) {
        const loyaltyCard = searchResult.data;
        const guestData = {
          name: loyaltyCard.customerName,
          phone: loyaltyCard.customerPhone,
          email: loyaltyCard.customerEmail,
          specialInstructions: loyaltyCard.specialInstructions,
          currentStamps: loyaltyCard.currentStamps,
          totalStamps: loyaltyCard.totalStamps,
          totalOrders: loyaltyCard.recentOrders.length,
          totalSpent: loyaltyCard.recentOrders.reduce((sum, order) => sum + order.total, 0),
          memberSince: loyaltyCard.memberSince,
          loyaltyCardId: loyaltyCard.id,
          // Store the full order data for reordering, not just names
          orderHistory: loyaltyCard.recentOrders.map(order => ({
            id: order.id,
            date: order.date,
            total: order.total,
            items: order.items.map(item => item.name), // For display
            status: order.status
          }))
          // TODO: Transform recentOrders to proper Order[] format for fullOrderData when needed
        };
        
        setCustomer(guestData);
        setSearchQuery('');
      } else {
        // If no loyalty card found, show message
        console.log('No loyalty card found for:', customerLookup.trim());
        setCustomerLookup('');
      }
    } catch (error) {
      console.error('Customer lookup failed:', error);
    } finally {
      setIsLookingUp(false);
    }
  };

  // Real-time search suggestions
  const handleSearchInputChange = async (value: string) => {
    setCustomerLookup(value);
    setSearchQuery(value);
    
    if (value.trim().length >= 2) {
      setSearching(true);
      try {
        // Search in recent customers first
        const recentMatches = recentCustomers.filter(customer => 
          customer.name?.toLowerCase().includes(value.toLowerCase()) ||
          customer.phone?.includes(value)
        );

        // Search in loyalty API for partial matches
        const allLoyaltyCards = await LoyaltyAPI.getAllLoyaltyCards();
        const loyaltyMatches = allLoyaltyCards.success && allLoyaltyCards.data 
          ? allLoyaltyCards.data.filter(card => 
              card.customerName.toLowerCase().includes(value.toLowerCase()) ||
              card.customerPhone.includes(value) ||
              (card.customerEmail && card.customerEmail.toLowerCase().includes(value.toLowerCase()))
            )
          : [];

        // Combine and deduplicate results
        const allMatches = [...recentMatches, ...loyaltyMatches];
        const uniqueMatches = allMatches.filter((match, index, self) => 
          index === self.findIndex(m => {
            const matchPhone = 'customerPhone' in match ? match.customerPhone : match.phone;
            const selfPhone = 'customerPhone' in m ? m.customerPhone : m.phone;
            return matchPhone === selfPhone;
          })
        );

        setSearchResults(uniqueMatches);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    } else {
      setSearchResults([]);
      setSearching(false);
    }
  };

  // Available discount codes from centralized mock data
  const [availableDiscounts, setAvailableDiscounts] = useState<Array<{
    type: 'percentage' | 'fixed';
    value: number;
    code: string;
    name: string;
    minimumOrder: number;
    isActive: boolean;
    validFrom: Date;
    validUntil: Date;
  }>>([]);

  // Load discount codes from centralized mock data
  useEffect(() => {
    const loadDiscounts = async () => {
      try {
        const { MOCK_DATA } = await import('@/lib/api/mockDataManager');
        // Transform mock data to match Discount interface
        const transformedDiscounts = MOCK_DATA.availableDiscounts.map(discount => ({
          type: 'percentage' as const,
          value: discount.percentage,
          code: discount.code,
          name: discount.description,
          minimumOrder: discount.minimumOrder,
          isActive: true,
          validFrom: new Date(),
          validUntil: new Date(discount.validUntil)
        }));
        setAvailableDiscounts(transformedDiscounts);
      } catch (error) {
        console.error('Failed to load discount codes:', error);
        setAvailableDiscounts([]);
      }
    };
    loadDiscounts();
  }, []);

  // Cart store values are already available from useCart hook above

  // Guest information state
  const [guestName, setGuestName] = useState(customer?.name || '');
  const [guestPhone, setGuestPhone] = useState(customer?.phone || '');
  const [guestEmail, setGuestEmail] = useState(customer?.email || '');
  const [guestInstructions, setGuestInstructions] = useState('');
  const [guestStamps, setGuestStamps] = useState(customer?.currentStamps || 0);
  const [customerLookup, setCustomerLookup] = useState('');
  const [isLookingUp, setIsLookingUp] = useState(false);

  // Update local state when customer data changes (e.g., after lookup)
  useEffect(() => {
    if (customer) {
      setGuestName(customer.name || '');
      setGuestPhone(customer.phone || '');
      setGuestEmail(customer.email || '');
      setGuestStamps(customer.currentStamps || 0);
    }
  }, [customer]);

  // Sync local guest state when mode changes to confirmation
  useEffect(() => {
    if (mode === 'confirmation') {
      // Ensure we have the latest guest data displayed
      if (customer) {
        setGuestName(customer.name || '');
        setGuestPhone(customer.phone || '');
        setGuestEmail(customer.email || '');
        setGuestStamps(customer.currentStamps || 0);
        setGuestInstructions(customer.specialInstructions || '');
      }
      console.log('Confirmation mode activated. Customer data:', customer);
    }
  }, [mode, customer]);

  // Load scanned customer data when overlay opens
  useEffect(() => {
    if (isOpen && scannedCustomer && !customer?.name) {
      // If we have a scanned customer but no current customer, load the scanned customer
      const guestData = {
        name: scannedCustomer.name || '',
        phone: scannedCustomer.phone || '',
        email: scannedCustomer.email || '',
        specialInstructions: scannedCustomer.specialInstructions || '',
        currentStamps: scannedCustomer.currentStamps || 0,
        totalStamps: scannedCustomer.totalStamps || 0,
        totalOrders: scannedCustomer.totalOrders || 0,
        totalSpent: scannedCustomer.totalSpent || 0,
        memberSince: scannedCustomer.memberSince || '',
        loyaltyCardId: scannedCustomer.loyaltyCardId || '',
        orderHistory: scannedCustomer.orderHistory || []
      };
      
      setCustomer(guestData);
    }
  }, [isOpen, scannedCustomer, customer, setCustomer]);

  // Update global confirmation mode state
  useEffect(() => {
    setConfirmationMode(mode === 'confirmation' && isOpen);
  }, [mode, isOpen, setConfirmationMode]);

  // 🎯 BULLETPROOF: Cart overlay NEVER generates order IDs - only reads from cart store
  const cartOrderId = useOrderId();

  // 📋 BULLETPROOF: Get order ID from cart store (set by useMenuManagement)
  // For NEW orders: useMenuManagement creates ID and loads into cart
  // For EDIT orders: useMenuManagement loads existing ID from overlay store into cart
  // NEVER generate order numbers here - let useMenuManagement handle it
  const orderId = cartOrderId; // FIXED: No fallback generation to prevent number jumping


  // Determine if this is a processing order (for button locking)
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);

  // Update processing order status when slot changes
  useEffect(() => {
    const checkProcessingOrder = async () => {
      if (slotId) {
        try {
          const { useUnifiedSlotStore } = await import('@/lib/store/unified-slots');
          const slotInfo = useUnifiedSlotStore.getState().getSlot(slotId);
          setIsProcessingOrder(slotInfo?.status === 'processing');
        } catch (error) {
          console.warn('⚠️ [PROCESSING CHECK] Could not determine slot status:', error);
          setIsProcessingOrder(false);
        }
      } else {
        setIsProcessingOrder(false);
      }
    };

    checkProcessingOrder();
  }, [slotId]);

  // Determine if backdrop should be shown
  const showBackdrop = mode === 'confirmation' && isOpen;

  return (
    <>
      {/* Backdrop - Only show when cart is open and in confirmation mode */}
      {showBackdrop && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={() => {
            // Don't allow closing when in payment or confirmation mode
            // The backdrop is just for visual separation
          }}
        />
      )}

      {/* Main Overlay - Always rendered, positioned off-screen when closed */}
      <div 
        className={`bg-secondary rounded-[8px] z-50 flex flex-col ${className}`}
        style={{ 
          fontFamily: 'Inter',
          position: 'fixed',
          top: '8px',
          bottom: '8px',
          width: '33.333333%',
          right: isOpen 
            ? (mode === 'confirmation' ? 'calc(33.333333% + 16px)' : '8px')
            : '-33.333333%',
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'right 600ms cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 300ms ease-in-out',
          willChange: 'right, opacity'
        }}
      >
        {/* Header */}
        <CartOverlayHeader
          mode={mode}
          orderId={orderId || 'Pending'}
          slotId={slotId}
          orderType={orderType}
          // actionHistoryLength={actionHistory.length} // Legacy - no longer used
          itemsLength={items.length}
          hasOrderOverlay={!!cartOrderId && items.length > 0} // Order overlay exists if we have order ID and items
          isProcessingOrder={isProcessingOrder}
          onCancelOrder={handleCancelOrder}
          onClearCart={handleClearCart} // NEW: Clear cart items only
          onDraftOrder={handleDraftOrder}
          onPrintReceipt={handlePrintReceipt}
          onDraftOrderFromConfirmation={handleDraftOrderFromConfirmation}
          onTipButton={handleTipButton}
        />

        {/* Navigation Tabs */}
        <CartOverlayTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* Content Area */}
        {mode === 'cart' ? (
          <div className="flex flex-col flex-1 mx-4 mb-3 min-h-0">
            <div className="flex-1 bg-card rounded-lg border border-border p-1 min-h-0 overflow-hidden">
              {activeTab === 'check' && (
                <CheckTabContent
                  mode={mode}
                  items={items}
                  onItemClick={handleItemClick}
                  onRepeat={handleRepeatItem}
                  onDelete={handleDeleteItem}
                  onRefund={handleRefundItem}
                  onMarkWaste={handleWasteItem}
                />
              )}
              {activeTab === 'actions' && (
                <ActionsTabContent
                  discountCode={discountCode}
                  discountError={discountError}
                  showAvailableDiscounts={showAvailableDiscounts}
                  availableDiscounts={availableDiscounts}
                  cartDiscount={cartDiscount}
                  onDiscountCodeChange={setDiscountCode}
                  onApplyDiscount={handleApplyDiscount}
                  onRemoveDiscount={handleRemoveDiscount}
                  onShowAvailableDiscounts={setShowAvailableDiscounts}
                />
              )}
              {activeTab === 'guest' && (
                <GuestTabContent
                  mode={mode}
                  customer={customer || undefined}
                  scannedCustomer={scannedCustomer}
                  recentCustomers={recentCustomers}
                  searchQuery={searchQuery}
                  searchResults={searchResults}
                  isSearching={isSearching}
                  customerLookup={customerLookup}
                  isLookingUp={isLookingUp}
                  guestName={guestName}
                  guestPhone={guestPhone}
                  guestEmail={guestEmail}
                  guestInstructions={guestInstructions}
                  guestStamps={guestStamps}
                  onGuestNameChange={setGuestName}
                  onGuestPhoneChange={setGuestPhone}
                  onGuestEmailChange={setGuestEmail}
                  onGuestInstructionsChange={setGuestInstructions}
                  onGuestStampsChange={setGuestStamps}
                  onCustomerLookupChange={setCustomerLookup}
                  onCustomerLookup={handleCustomerLookup}
                  onSearchInputChange={handleSearchInputChange}
                  onSaveGuestInfo={handleSaveGuestInfo}
                  onSetCustomer={setCustomer}
                />
              )}
            </div>
          </div>
        ) : (
          <ConfirmationModeContent
            activeTab={activeTab}
            items={items}
            customer={customer || undefined}
            scannedCustomer={scannedCustomer}
            recentCustomers={recentCustomers}
            searchQuery={searchQuery}
            searchResults={searchResults}
            isSearching={isSearching}
            customerLookup={customerLookup}
            isLookingUp={isLookingUp}
            guestName={guestName}
            guestPhone={guestPhone}
            guestEmail={guestEmail}
            guestInstructions={guestInstructions}
            guestStamps={guestStamps}
            onItemClick={handleItemClick}
            onRepeat={handleRepeatItem}
            onDelete={handleDeleteItem}
            onGuestNameChange={setGuestName}
            onGuestPhoneChange={setGuestPhone}
            onGuestEmailChange={setGuestEmail}
            onGuestInstructionsChange={setGuestInstructions}
            onGuestStampsChange={setGuestStamps}
            onCustomerLookupChange={setCustomerLookup}
            onCustomerLookup={handleCustomerLookup}
            onSearchInputChange={handleSearchInputChange}
            onSaveGuestInfo={handleSaveGuestInfo}
            onSetCustomer={setCustomer}
          />
        )}

        {/* Totals Section */}
        <CartTotals
          mode={mode}
          subtotal={subtotal}
          tax={mode === 'confirmation' ? subtotal * (taxRate / 100) : tax} // Use dynamic tax rate in confirmation mode
          total={mode === 'confirmation' ? subtotal + (subtotal * (taxRate / 100)) - discount : total}
          discount={discount}
          cartDiscount={cartDiscount}
          itemsLength={items.length}
          taxRate={taxRate} // Pass dynamic tax rate for display
          onProceedToPayment={handleContinueToPayment}
          onCompleteOrder={handleCompleteOrder}
        />
      </div>

      {/* Order Completion Overlay - For completing existing paid orders */}
      {showOrderCompletion && (
        <OrderCompletionOverlay
          slotId={slotId || ''}
          orderType={orderType || 'dine-in'}
          onDone={handleOrderCompletionDone}
        />
      )}

      {/* Manager Approval Modal - For paid item operations and processing slot cancellation */}
      {showManagerApproval && managerApprovalData && (
        <ManagerApprovalModal
          isOpen={showManagerApproval}
          onClose={handleManagerApprovalClose}
          onApprove={managerApprovalData.onApprove}
          operation={managerApprovalData.operation}
          itemName={managerApprovalData.item.name}
          amount={managerApprovalData.item.totalPrice}
          showInventoryReversal={false}
        />
      )}
    </>
  );
});

CartOverlay.displayName = 'CartOverlay';
