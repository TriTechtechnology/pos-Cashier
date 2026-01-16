// console.log('📦 [MODULE LOAD] useMenuManagement module loading...');

/**
 * useMenuManagement Hook
 *
 * PURPOSE: Centralized state management for menu page including categories, search,
 * cart interactions, slot management, and item modifiers. Consolidates all menu-related
 * state and logic into a single, reusable hook.
 *
 * LINKS WITH:
 * - MenuPageContent: Main component that uses this hook
 * - useMenuStore: Menu data and category management
 * - useCartActions: Cart operations and state
 * - useDraftStore: Draft order management
 * - useDynamicSlotStore: Dynamic slot information fetching
 * - MenuItem, ItemModifier, CartOverlay: Components that interact with this state
 *
 * WHY: Follows the professional refactoring pattern established in home page.
 * Separates business logic from UI components, making code more maintainable,
 * testable, and reusable across different components.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { MenuItem, CartItemModifiers, Slot, CustomerInfo, OrderItem } from '@/types/pos';
import { useNavigationActions, useSelectedSlot, useSelectedOrderType, useNavigationMode } from '@/lib/store/navigation';
// REMOVED: generateOrderNumber - order ID generation moved to cart store
import type { CartItem as StoreCartItem } from '@/lib/store/cart-new';
import { useCartItems, useCartSubtotal, useCartTotal, useCurrentSlotId, useOrderType, useCustomer, useCartActions, useOrderId } from '@/lib/store/cart-new';
import { useMenuStore } from '@/lib/store/menu';
import { useSafeSlot } from '@/lib/store/unified-integration-wrapper';
import { useUnifiedSlotStore } from '@/lib/store/unified-slots';
import { useOrderOverlayStore } from '@/lib/store/order-overlay';

// Menu management state interface
interface MenuState {
  searchQuery: string;
  slotId: string;
  currentSlotInfo: Slot | null;
  selectedIndex: number | null;
  selectedItem: MenuItem | null;
  isModifierOpen: boolean;
  isEditing: boolean;
  editingItemId: string;
  savedSelections: CartItemModifiers | null;
  isCartOpen: boolean;
  isSlotSelectorOpen: boolean;
  overlayMode: 'cart' | 'confirmation';
}

// Initial state - NO HARDCODED SLOT ID
const initialState: MenuState = {
  searchQuery: '',
  slotId: '', // Will be set from URL parameters
  currentSlotInfo: null,
  selectedIndex: null,
  selectedItem: null,
  isModifierOpen: false,
  isEditing: false,
  editingItemId: '',
  savedSelections: null,
  isCartOpen: false,
  isSlotSelectorOpen: false,
  overlayMode: 'cart'
};

export const useMenuManagement = () => {
  //   console.log('🚀 [HOOK START] useMenuManagement hook called');

  // PWA-first navigation - use Zustand instead of URL params
  const { navigateToHome, navigateToMenu } = useNavigationActions();
  const navSelectedSlot = useSelectedSlot();
  const navSelectedOrderType = useSelectedOrderType();
  const navMode = useNavigationMode();
  //   console.log('🧭 [NAVIGATION STATE]', { navSelectedSlot, navSelectedOrderType, navMode });

  //   console.log('🔧 [HOOK STATE] Creating local state...');
  // Local state management
  const [state, setState] = useState<MenuState>(initialState);

  // Track if we've done the initial auto-open for this session (simple boolean)
  // const hasInitiallyAutoOpenedRef = useRef(false);

  // 🏆 PROFESSIONAL: No race condition state needed with single source of truth

  //   console.log('🔧 [HOOK CART] Getting cart hooks...');

  // Professional cart store integration
  const currentSlotId = useCurrentSlotId();
  const cartItems = useCartItems();
  const subtotal = useCartSubtotal();
  const total = useCartTotal();
  const orderType = useOrderType();
  const customer = useCustomer();
  const cartOrderId = useOrderId(); // Get current cart's order ID
  // Cart store for order ID access (needed for bulletproof draft saving)
  const { setCurrentSlot, addItem, setOrderType, updateItemModifiers, updateQuantity, loadExistingOrder, clearCart } = useCartActions();


  // Unified slot store for direct access
  const unifiedSlotStore = useUnifiedSlotStore();

  // Menu store
  const {
    selectedCategory,
    reorderedItems,
    itemPreferences,
    setSelectedCategory,
    reorderItems,
    toggleItemAvailability,
    toggleItemImage,
    fetchCategories,
    saveItemOrder,
    saveItemPreferences,
    getAllCategories
  } = useMenuStore();

  // 🎨 CUSTOM ITEMS: Get all categories (API + Custom)
  const categories = getAllCategories();

  // State update helper
  const updateState = useCallback((updates: Partial<MenuState>) => {
    // DEBUG: Log all state updates that affect isCartOpen
    if ('isCartOpen' in updates) {
      console.log('🔧 [updateState] isCartOpen being changed to:', updates.isCartOpen);
      console.trace(); // This will show the call stack!
    }
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // REACTIVE: Subscribe to current slot changes
  const currentSlot = useSafeSlot(state.slotId);

  // Update currentSlotInfo when slot changes reactively
  useEffect(() => {
    if (state.slotId && currentSlot) {
      // Only update if slot data actually changed
      const hasChanged = !state.currentSlotInfo ||
        state.currentSlotInfo.id !== currentSlot.id ||
        state.currentSlotInfo.status !== currentSlot.status ||
        state.currentSlotInfo.startTime !== currentSlot.startTime;

      if (hasChanged) {
        //         console.log('🔄 [REACTIVE SLOT] Slot', state.slotId, 'updated:', currentSlot.status);
        updateState({ currentSlotInfo: currentSlot });
      }
    }
  }, [currentSlot, state.slotId, state.currentSlotInfo, updateState]);

  // 🔄 PROFESSIONAL CART RELOAD: Function to reload cart data with proper paid/unpaid item tracking
  // MOVED UP: Must be defined before the useEffect that uses it
  const reloadCartFromOverlay = useCallback(async (slotId: string, forceEdit = false) => {
    //     console.log('🔄 [RELOAD CART] Professional reload with proper payment status tracking for slot:', slotId, 'forceEdit:', forceEdit);
    try {
      // 🎯 CRITICAL: Use different methods based on context
      const overlayStore = useOrderOverlayStore.getState();
      const overlay = forceEdit
        ? await overlayStore.getOrderForEditing(slotId)
        : await overlayStore.getActiveOrderBySlot(slotId);

      if (overlay?.items?.length) {
        // 🏆 PROFESSIONAL APPROACH: Preserve individual item payment status AND uniqueId
        const orderItems = overlay.items.map((item: OrderItem & { modifiers?: CartItemModifiers; isPaid?: boolean; uniqueId?: string }) => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity || 1,
          price: item.price,
          total: item.total || item.price,
          notes: item.notes,
          modifiers: {
            variations: Array.isArray(item.modifiers?.variations) ? item.modifiers.variations : [],
            addOns: Array.isArray(item.modifiers?.addOns) ? item.modifiers.addOns : [],
            specialInstructions: item.modifiers?.specialInstructions || item.notes || undefined,
            notes: item.modifiers?.notes || undefined
          },
          // 🎯 CRITICAL: Preserve uniqueId for cart item editing (BULLETPROOF FIX)
          uniqueId: item.uniqueId,
          // 🎯 CRITICAL: Preserve individual item payment status (not order-level status)
          isPaid: item.isPaid || false,
          originalOrderId: overlay.id
        }));

        // 💡 SMART LOADING: Use mixed payment status for professional POS workflow
        loadExistingOrder(orderItems, overlay.customer as CustomerInfo, overlay.orderType, 'mixed', overlay.id);

        // Silent professional reload for performance
        return true;
      } else {
        //         console.log('ℹ️ [RELOAD CART] No overlay data found for slot:', slotId);
        return false;
      }
    } catch (error) {
      console.error('❌ [RELOAD CART] Error reloading cart from overlay:', error);
      return false;
    }
  }, [loadExistingOrder]);

  // Fetch current slot information directly from unified store
  const fetchCurrentSlotInfo = useCallback((targetSlotId: string) => {
    try {
      //       console.log('🔍 [FETCH SLOT] Looking for slot ID:', targetSlotId);

      // Get unified slot directly for complete data
      const unifiedSlot = unifiedSlotStore.getSlot(targetSlotId);
      //       console.log('📋 [UNIFIED SLOT RAW DATA]:', JSON.stringify(unifiedSlot, null, 2));

      if (unifiedSlot) {
        // ⚡ PHASE 1: Clean slot UI state only
        // Silent slot debug for performance

        // ⚡ LIGHTNING-FAST: Convert to UI-only slot (order data → Overlay Store)
        const slot = {
          id: unifiedSlot.id,
          number: unifiedSlot.number,
          orderType: unifiedSlot.orderType,
          status: unifiedSlot.status,
          isActive: unifiedSlot.isActive,
          startTime: unifiedSlot.startTime,
          timeStatus: unifiedSlot.timeStatus,
          elapsedTime: unifiedSlot.elapsedTime,
          customerCount: unifiedSlot.customerCount,
          // Order reference only (full data in Order Overlay Store)
          orderId: unifiedSlot.orderRefId,
          customerName: undefined, // → Use Order Overlay hooks
          orderDetails: undefined, // → Use Order Overlay hooks
          orderTotal: undefined,   // → Use Order Overlay hooks
          orderCustomer: undefined, // → Use Order Overlay hooks
          paymentMethod: unifiedSlot.paymentMethod,
          paymentStatus: unifiedSlot.paymentStatus,
          specialInstructions: undefined, // → Use Order Overlay hooks
          createdAt: unifiedSlot.createdAt,
          updatedAt: unifiedSlot.updatedAt
        };

        // Silent slot UI state for performance
        updateState({ currentSlotInfo: slot });
      } else {
        console.warn('⚠️ [SLOT MISSING] Slot', targetSlotId, 'not found');
        updateState({ currentSlotInfo: null });
      }
    } catch (error) {
      console.error('❌ [FETCH ERROR] Error fetching slot info:', error);
      updateState({ currentSlotInfo: null });
    }
  }, [updateState, unifiedSlotStore]);

  // PWA-FIRST INITIALIZATION: Initialize from navigation store instead of URL
  // This runs only once on mount with navigation store values
  useEffect(() => {
    console.log('🚀 [NAV INIT] Effect triggered - Navigation state initialized');
    const slot = navSelectedSlot;
    const type = navSelectedOrderType;
    const mode = navMode;

    console.log('🧭 [NAVIGATION PARAMS] slot:', slot, 'type:', type, 'mode:', mode);

    // CRITICAL: Always set slot ID first if provided
    if (slot) {
      console.log('🎯 [SLOT INIT] Setting slot ID to:', slot);
      updateState({ slotId: slot });
      console.log('🎯 [SLOT INIT] Calling setCurrentSlot with:', slot);
      setCurrentSlot(slot); // CRITICAL: Initialize cart for this slot

      // Set order type if provided
      if (type) {
        setOrderType(type);
        console.log('🏷️ [ORDER TYPE] Set to:', type);
      }

      // Handle different modes
      if (mode === 'payment') {
        console.log('💳 [PAYMENT MODE] overlay-first load');
        (async () => {
          const overlay = await useOrderOverlayStore.getState().getActiveOrderBySlot(slot);
          if (overlay?.items?.length) {
            console.log('✅ [OVERLAY FOUND] Loading overlay into cart');
            const orderItems = overlay.items.map((item: OrderItem & { modifiers?: CartItemModifiers }) => ({
              id: item.id,
              name: item.name,
              quantity: item.quantity || 1,
              price: item.price,
              total: item.total || item.price,
              notes: item.notes,
              modifiers: {
                variations: Array.isArray(item.modifiers?.variations) ? item.modifiers.variations : [],
                addOns: Array.isArray(item.modifiers?.addOns) ? item.modifiers.addOns : [],
                specialInstructions: item.modifiers?.specialInstructions || item.notes || undefined,
                notes: item.modifiers?.notes || undefined
              }
            }));
            // For payment mode, items are always unpaid (completing payment)
            loadExistingOrder(orderItems, overlay.customer as CustomerInfo, overlay.orderType, 'unpaid', overlay.id);
            setTimeout(() => {
              updateState({
                currentSlotInfo: {
                  id: slot,
                  number: '0',
                  orderType: overlay.orderType,
                  status: 'processing',
                  orderDetails: orderItems,
                  orderCustomer: overlay.customer as CustomerInfo,
                  paymentStatus: overlay.paymentStatus,
                  paymentMethod: overlay.paymentMethod,
                  orderTotal: overlay.total
                } as Slot,
                isCartOpen: true,
                overlayMode: 'confirmation'
              });
            }, 100);
            return;
          }
          // ⚡ PHASE 1: No fallback needed - Order Overlay is single source of truth
          console.log('ℹ️ [ORDER OVERLAY] No order data found for slot', slot);
          // For payment completion without overlay data, show error
          alert('No order details found for payment completion. Order data may not be available.');
          return;
        })();
      } else if (mode === 'draft') {
        // DRAFT MODE: Load existing draft order from overlay
        console.log('📝 [DRAFT MODE] Loading draft order for slot:', slot);
        (async () => {
          const overlay = await useOrderOverlayStore.getState().getOrderForEditing(slot);
          if (overlay?.items?.length) {
            console.log('✅ [DRAFT OVERLAY FOUND] Loading draft order into cart');
            const orderItems = overlay.items.map((item: OrderItem & { modifiers?: CartItemModifiers }) => ({
              id: item.id,
              name: item.name,
              quantity: item.quantity || 1,
              price: item.price,
              total: item.total || item.price,
              notes: item.notes,
              modifiers: {
                variations: Array.isArray(item.modifiers?.variations) ? item.modifiers.variations : [],
                addOns: Array.isArray(item.modifiers?.addOns) ? item.modifiers.addOns : [],
                specialInstructions: item.modifiers?.specialInstructions || item.notes || undefined,
                notes: item.modifiers?.notes || undefined
              }
            }));
            loadExistingOrder(orderItems, overlay.customer as CustomerInfo, overlay.orderType, 'unpaid', overlay.id);
            fetchCurrentSlotInfo(slot);

            // NO AUTO-OPEN: Cashier controls cart visibility
          } else {
            console.log('❌ [DRAFT OVERLAY] No draft found for slot:', slot);
            // Just load menu without cart data
            fetchCurrentSlotInfo(slot);
          }
        })();
      } else if (mode === 'edit') {
        // EDIT MODE: Load order for editing
        console.log('✏️ [EDIT MODE] Loading order for editing:', slot);
        reloadCartFromOverlay(slot, true);
      } else {
        // Regular menu mode - load slot info
        // NO AUTO-OPEN: Cashier controls cart visibility manually via cart button
        // This is better UX for professional POS systems
        fetchCurrentSlotInfo(slot);
      }
    } else {
      console.error('❌ [NAV ERROR] No slot in navigation state');
    }

  }, [navSelectedSlot, navSelectedOrderType, navMode, setCurrentSlot, setOrderType, updateState, loadExistingOrder, fetchCurrentSlotInfo, unifiedSlotStore, reloadCartFromOverlay]);

  // EDIT MODE: Removed - now handled in main navigation init useEffect above

  // 🛡️ REMOVED PROBLEMATIC AUTO-RELOAD: This violated offline-first principles
  // Cart loading should ONLY happen via explicit user actions:
  // 1. Edit mode (?edit=true) - loads overlay for editing
  // 2. Payment mode (?payment=true) - loads overlay for payment
  // 3. Draft mode (?isDraft=true) - loads draft data
  // Available slots should NEVER auto-load overlay data

  // 🛡️ REMOVED PROBLEMATIC PROCESSING AUTO-LOAD: This also violated offline-first principles
  // Navigation to slots should NEVER auto-load overlay data
  // User must explicitly interact (edit/payment/draft buttons) to load order data

  // REMOVED: Order ID generation moved to cart store when first item is added
  // This prevents duplicate order ID generation when switching between slots

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // DISABLED: Auto-open cart effect removed - causing repeated opens for existing orders
  // Auto-opening is now handled ONLY in URL initialization (lines 300-312)
  // This prevents the cart from auto-opening repeatedly when navigating between slots

  // 🏆 PROFESSIONAL: No auto-save draft system needed!
  // Cart already creates ORDER OVERLAYS automatically via upsertFromCart()
  // Single source of truth: ORDER OVERLAYS in IndexedDB

  // Event handlers
  const handleCategoryChange = useCallback((categoryName: string) => {
    setSelectedCategory(categoryName);
  }, [setSelectedCategory]);

  const handleSearchChange = useCallback((query: string) => {
    updateState({ searchQuery: query });
  }, [updateState]);

  const handleAddToCart = useCallback((item: MenuItem) => {
    // Check if slot is selected
    if (!state.slotId) {
      updateState({ isSlotSelectorOpen: true });
      return;
    }

    // Open item modifier
    updateState({
      selectedItem: item,
      isEditing: false,
      editingItemId: '',
      savedSelections: null,
      isModifierOpen: true
    });
  }, [state.slotId, updateState]);

  const handleSlotSelected = useCallback(async (selectedSlotId: string) => {
    const unifiedSlot = unifiedSlotStore.getSlot(selectedSlotId);
    const newOrderType = unifiedSlot?.orderType || 'dine-in';

    // PWA-first: Update navigation state (no URL needed)
    // Type assertion - orderType from slot is guaranteed to be one of these (never 'draft')
    navigateToMenu(selectedSlotId, newOrderType as 'dine-in' | 'take-away' | 'delivery', 'normal');

    // Update state
    updateState({ slotId: selectedSlotId });
    setCurrentSlot(selectedSlotId);

    // Load cart if slot has order
    if (unifiedSlot?.orderRefId) {
      const overlay = useOrderOverlayStore.getState().getByOrderId(unifiedSlot.orderRefId);

      if (overlay?.items?.length) {
        const orderItems = overlay.items.map((item: any) => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity || 1,
          price: item.price,
          total: item.total || item.price,
          notes: item.notes,
          modifiers: {
            variations: Array.isArray(item.modifiers?.variations) ? item.modifiers.variations : [],
            addOns: Array.isArray(item.modifiers?.addOns) ? item.modifiers.addOns : [],
            specialInstructions: item.modifiers?.specialInstructions || item.notes || undefined,
            notes: item.modifiers?.notes || undefined
          },
          isPaid: item.isPaid || false,
          originalOrderId: overlay.id
        }));

        loadExistingOrder(orderItems, overlay.customer as CustomerInfo, overlay.orderType, 'mixed', overlay.id);
      }
    }

    await fetchCurrentSlotInfo(selectedSlotId);

    // Just close slot selector - don't auto-open cart (cashier will open manually if needed)
    updateState({
      isSlotSelectorOpen: false
    });
  }, [setCurrentSlot, fetchCurrentSlotInfo, updateState, unifiedSlotStore, navigateToMenu, loadExistingOrder]);

  const handleModifierAddToCart = useCallback((modifiedItem: MenuItem & {
    modifiers?: CartItemModifiers;
    calculatedPrice: number;
    originalPrice: number;
    id: string;
    isEditing?: boolean;
    quantity?: number;
  }) => {
    console.log('🎯 [handleModifierAddToCart] CALLED with:', {
      isEditing: modifiedItem.isEditing,
      id: modifiedItem.id,
      quantity: modifiedItem.quantity,
      hasModifiers: !!modifiedItem.modifiers
    });

    if (modifiedItem.isEditing) {
      // Update existing item in cart using uniqueId
      console.log('🔄 [EDIT ITEM] Updating item with uniqueId:', modifiedItem.id);
      console.log('🔄 [EDIT ITEM] New modifiers:', modifiedItem.modifiers);
      console.log('🔄 [EDIT ITEM] New quantity:', modifiedItem.quantity);

      // 🔥 USER REQUEST: Quantity changes should duplicate items (like swipe right behavior)
      // Always update modifiers first
      updateItemModifiers(modifiedItem.id, modifiedItem.modifiers || {});

      // Get desired quantity
      const desiredQty = Math.max(1, modifiedItem.quantity ?? 1);
      console.log('🔄 [EDIT ITEM] Desired quantity:', desiredQty);

      // Keep original item as qty 1 with updated modifiers
      updateQuantity(modifiedItem.id, 1);

      // Add duplicates as separate line items (same as swipe right behavior)
      if (desiredQty > 1) {
        console.log(`🔄 [EDIT ITEM] Adding ${desiredQty - 1} duplicate items`);
        for (let i = 0; i < desiredQty - 1; i++) {
          const modifiersClone = modifiedItem.modifiers ? JSON.parse(JSON.stringify(modifiedItem.modifiers)) : { variations: [], addOns: [] };
          // Use the original menu item (selectedItem) as the base for duplicates
          const baseMenuItem: MenuItem = state.selectedItem || {
            id: modifiedItem.id,
            name: modifiedItem.name,
            description: modifiedItem.description || '',
            price: modifiedItem.price,
            category: (modifiedItem as MenuItem).category || 'food',
            image: (modifiedItem as MenuItem).image || '',
            available: true
          };
          addItem(baseMenuItem, 1, modifiersClone, { keepSeparate: true });
        }
      }

      // Close the modifier overlay after updating
      updateState({
        isModifierOpen: false,
        selectedItem: null,
        isEditing: false,
        editingItemId: '',
        savedSelections: null
      });

      console.log('✅ [EDIT ITEM] Item updated successfully');
    } else {
      // Add new item - always keep separate lines and deep copy modifiers
      const modifiersClone = modifiedItem.modifiers ? JSON.parse(JSON.stringify(modifiedItem.modifiers)) : { variations: [], addOns: [] };
      addItem(modifiedItem, 1, modifiersClone, { keepSeparate: true });
    }
  }, [updateItemModifiers, updateQuantity, addItem, updateState, state.selectedItem]);

  const handleCartClick = useCallback(() => {
    // Simple toggle - cashier controls cart after initial auto-open
    const newState = !state.isCartOpen;
    console.log('🎯 [handleCartClick] BEFORE:', {
      currentState: state.isCartOpen,
      newState
    });

    // DIRECT state update
    setState(prev => {
      console.log('🎯 [setState] prev.isCartOpen:', prev.isCartOpen, '→ new:', newState);
      return { ...prev, isCartOpen: newState, overlayMode: 'cart' };
    });

    console.log('🎯 [handleCartClick] AFTER setState called with isCartOpen:', newState);
  }, [state.isCartOpen]);

  const handleOverlayModeChange = useCallback((mode: 'cart' | 'confirmation') => {
    updateState({ overlayMode: mode });
  }, [updateState]);

  const handleCancelOrder = useCallback(async () => {
    console.log('🚫 [CANCEL ORDER] Starting cancellation for slot:', state.slotId);

    // 🏆 PROFESSIONAL: Wait for full cancellation before navigation
    try {
      // Step 1: Clear the cart immediately
      clearCart();

      // Step 2: Delete order overlay if it exists
      if (state.slotId && cartOrderId) {
        try {
          const { useOrderOverlayStore } = await import('@/lib/store/order-overlay');
          const overlayStore = useOrderOverlayStore.getState();
          await overlayStore.removeOverlay(String(cartOrderId));
          console.log('✅ [CANCEL ORDER] Deleted order overlay:', cartOrderId);
        } catch (error) {
          console.warn('⚠️ [CANCEL ORDER] Order overlay not found or already deleted:', error);
        }
      }

      // Step 3: Set slot back to available
      if (state.slotId) {
        try {
          const { useUnifiedSlotStore } = await import('@/lib/store/unified-slots');
          const { setSlotAvailable } = useUnifiedSlotStore.getState();
          await setSlotAvailable(state.slotId);
          console.log('✅ [CANCEL ORDER] Slot set to available:', state.slotId);
        } catch (error) {
          console.warn('⚠️ [CANCEL ORDER] Could not update slot status:', error);
        }
      }

      // Step 4: Clear overlay cache
      try {
        const { useOrderOverlayStore } = await import('@/lib/store/order-overlay');
        const overlayStore = useOrderOverlayStore.getState();
        overlayStore.clearSlotCache(state.slotId || '');
        console.log('✅ [CANCEL ORDER] Cleared overlay cache for slot:', state.slotId);
      } catch (error) {
        console.warn('⚠️ [CANCEL ORDER] Could not clear overlay cache:', error);
      }

      console.log('✅ [CANCEL ORDER] Cancellation completed successfully');
    } catch (error) {
      console.error('❌ [CANCEL ORDER] Error during cancellation:', error);
    } finally {
      // Step 5: Close cart overlay and navigate to home (PWA-first)
      updateState({ isCartOpen: false, overlayMode: 'cart' });
      navigateToHome();
    }
  }, [updateState, navigateToHome, state.slotId, cartOrderId, clearCart]);

  const handleDraftOrder = useCallback(async () => {
    // 🏆 BULLETPROOF: Cart already creates overlays automatically!
    // No need to manually create overlay - just navigate home
    // The cart has already saved the overlay with proper incremental order ID
    console.log('💾 [DRAFT ORDER] Cart overlay already exists, navigating home');

    // Close cart and route to home (PWA-first)
    updateState({ isCartOpen: false, overlayMode: 'cart' });
    navigateToHome();
  }, [updateState, navigateToHome]);

  const handleSelect = useCallback((index: number) => {
    if (index === -1) {
      updateState({ selectedIndex: null }); // Deselect
    } else {
      updateState({ selectedIndex: index });
    }
  }, [updateState]);

  const handleSwap = useCallback((fromIndex: number, toIndex: number) => {
    if (fromIndex !== toIndex) {
      // Reorder the items using the menu store
      reorderItems(selectedCategory, fromIndex, toIndex);

      // Save to backend immediately after reordering
      const categoryItems = (reorderedItems[selectedCategory] || (categories
        .find(cat => cat.name === selectedCategory)
        ?.items.filter(item =>
          item.name.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
          (item.description || '').toLowerCase().includes(state.searchQuery.toLowerCase())
        ) || []));
      saveItemOrder(selectedCategory, categoryItems);

      updateState({ selectedIndex: null });
    } else {
      updateState({ selectedIndex: null });
    }
  }, [selectedCategory, reorderItems, reorderedItems, saveItemOrder, updateState, categories, state.searchQuery]);

  const handleEditItem = useCallback((item: StoreCartItem) => {
    // In the new cart store, item.id is the menu item ID and item.uniqueId identifies the cart instance
    const originalItemId = item.id;

    console.log('🔍 [EDIT ITEM] Editing cart item with uniqueId:', item.uniqueId);
    console.log('🔍 [EDIT ITEM] Original menu ID:', originalItemId);
    console.log('🔍 [EDIT ITEM] Cart item modifiers:', item.modifiers);
    console.log('🔍 [EDIT ITEM] Cart item quantity:', item.quantity);

    const menuItem: MenuItem & { modifiers?: CartItemModifiers } = {
      id: originalItemId,
      name: item.name,
      description: item.description || '',
      price: item.price,
      category: item.category || 'food',
      image: item.image || '',
      available: item.available || true,
      modifiers: item.modifiers
    };

    // 🔥 CRITICAL FIX: Include quantity in savedSelections
    const savedSelections = item.modifiers ? {
      ...item.modifiers,
      quantity: item.quantity // CRITICAL: Pass quantity from cart item
    } : { quantity: item.quantity };

    console.log('🔍 [EDIT ITEM] Saved selections with quantity:', savedSelections);

    updateState({
      selectedItem: menuItem,
      savedSelections,
      isEditing: true,
      editingItemId: item.uniqueId, // Use uniqueId to update the exact cart instance
      isModifierOpen: true
    });
  }, [updateState]);

  const handleOrderComplete = useCallback(() => {
    // Handle order completion
    //     console.log('Order completed successfully');

    // Close payment overlay
    updateState({ overlayMode: 'cart' });

    // Close cart overlay
    updateState({ isCartOpen: false });

    // Navigate back to home page (PWA-first)
    navigateToHome();
  }, [navigateToHome, updateState]);

  // 🎨 CUSTOM ITEM: Delete handler
  const handleDeleteCustomItem = useCallback(async (itemId: string) => {
    try {
      // Import menu store and custom items service
      const { useMenuStore } = await import('@/lib/store/menu');
      const { customItemsService } = await import('@/lib/services/customItemsService');

      // Remove from localStorage
      customItemsService.removeCustomItem(itemId);

      // Refresh menu to update UI
      useMenuStore.getState().refreshCustomItems();

      console.log('✅ [DELETE CUSTOM ITEM] Deleted custom item:', itemId);
    } catch (error) {
      console.error('❌ [DELETE CUSTOM ITEM] Error deleting custom item:', error);
    }
  }, []);

  // Computed values
  const filteredItems = useMemo(() => {
    return categories
      .find(cat => cat.name === selectedCategory)
      ?.items.filter(item =>
        item.name.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
        (item.description || '').toLowerCase().includes(state.searchQuery.toLowerCase())
      ) || [];
  }, [categories, selectedCategory, state.searchQuery]);

  const displayItems = useMemo(() => {
    // Get the base items (reordered if available, otherwise from category)
    const baseItems = reorderedItems[selectedCategory] ||
      categories.find(cat => cat.name === selectedCategory)?.items || [];

    // Always apply search filter if there's a search query
    if (state.searchQuery && state.searchQuery.trim().length > 0) {
      return baseItems.filter(item =>
        item.name.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
        (item.description || '').toLowerCase().includes(state.searchQuery.toLowerCase())
      );
    }

    // No search query - return base items as-is
    return baseItems;
  }, [reorderedItems, selectedCategory, categories, state.searchQuery]);

  // Computed value for paid order edit mode (for slot management button locking)
  const isPaidOrderEditMode = useMemo(() => {
    const isEditMode = navMode === 'edit';
    const hasPaidItems = cartItems.some(item => item.isPaid === true);
    return isEditMode && hasPaidItems;
  }, [navMode, cartItems]);

  // Silent debug logging for performance

  return {
    // State
    ...state,
    categories,
    selectedCategory,
    reorderedItems,
    itemPreferences,
    cartItems,
    subtotal,
    total,
    orderType,
    customer,
    currentSlotId,
    displayItems,
    filteredItems,
    isPaidOrderEditMode,

    // Actions
    handleCategoryChange,
    handleSearchChange,
    handleAddToCart,
    handleSlotSelected,
    handleModifierAddToCart,
    handleCartClick,
    handleOverlayModeChange,
    handleCancelOrder,
    handleDraftOrder,
    handleSelect,
    handleSwap,
    handleEditItem,
    handleOrderComplete,
    handleDeleteCustomItem,

    // Menu store actions
    toggleItemAvailability,
    toggleItemImage,
    saveItemPreferences,

    // Utility functions
    updateState,
    reloadCartFromOverlay
  };
};
