/**
 * PROFESSIONAL CART STORE - BULLETPROOF ARCHITECTURE
 * 
 * This is a complete rewrite using industry best practices:
 * - Simple, predictable state management
 * - Proper Zustand patterns
 * - No complex persistence that causes issues
 * - Clean separation of concerns
 * - Bulletproof reactivity
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { MenuItem, CartItemModifiers, CustomerInfo, OrderType } from '@/types/pos';
import { discardOrderNumber, generateOrderNumber } from '@/lib/utils/posUtils';
import { syncCartToOverlay, removeOrderOverlay } from '@/lib/services/cartSyncService';

// Core interfaces
export interface CartItem extends MenuItem {
  uniqueId: string;
  quantity: number;
  modifiers: CartItemModifiers;
  totalPrice: number;

  // Payment tracking for bulletproof paid item management
  isPaid?: boolean;           // Has this specific item been paid for?
  paidQuantity?: number;      // How many of this item were paid for (for partial payments)
  originalOrderId?: string;   // Reference to original order if editing existing order
  originalPaidPrice?: number; // Original price that was paid (for differential charging)
  originalPaidModifiers?: CartItemModifiers; // Original modifiers that were paid for

  // 🎯 PROFESSIONAL: Modifier upgrade items (non-editable)
  isModifierUpgrade?: boolean; // True if this is a differential charge item (cannot be edited directly)
}

export interface CartState {
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  customer: CustomerInfo | null;
  discount: number;
  orderType: OrderType | null;
  slotId: string | null;
  orderId: string | null; // BULLETPROOF: Single source of truth for order ID
}

export interface CartStore {
  // State
  currentSlotId: string | null;
  carts: Record<string, CartState>;

  // Actions
  setCurrentSlot: (slotId: string) => void;
  addItem: (item: MenuItem, quantity?: number, modifiers?: CartItemModifiers, options?: { keepSeparate?: boolean }) => void;
  removeItem: (uniqueId: string) => void;
  updateQuantity: (uniqueId: string, quantity: number) => void;
  updateItemModifiers: (uniqueId: string, modifiers: CartItemModifiers) => void;
  clearCart: () => void;
  setOrderType: (orderType: string) => void;
  setCustomer: (customer: CustomerInfo) => void;
  applyDiscount: (discount: number) => void;
  setOrderId: (orderId: string) => void; // BULLETPROOF: Set order ID for cart
  loadExistingOrder: (orderItems: any[], customer?: CustomerInfo, orderType?: OrderType, paymentStatus?: 'paid' | 'unpaid' | 'mixed', orderId?: string) => void;

  // Getters
  getCurrentCart: () => CartState;
  getCartItems: () => CartItem[];
  getCartSubtotal: () => number;
  getCartTotal: () => number;
}

// Helper function to calculate item price
const calculateItemPrice = (item: MenuItem, modifiers: CartItemModifiers): number => {
  let price = item.price;
  
  // Add modifier prices
  if (modifiers.variations && modifiers.variations.length > 0) {
    price += modifiers.variations.reduce((sum, mod) => sum + (mod.price || 0), 0);
  }
  
  if (modifiers.addOns && modifiers.addOns.length > 0) {
    price += modifiers.addOns.reduce((sum, mod) => sum + (mod.price || 0), 0);
  }
  
  return price;
};

// Helper function to generate unique ID
const generateUniqueId = (item: MenuItem): string => {
  return `${item.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Create the store - TEMPORARILY DISABLED PERSISTENCE DUE TO LOCALSTORAGE ERRORS
export const useCartStore = create<CartStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    currentSlotId: null,
    carts: {},
    
    // Actions
    setCurrentSlot: (slotId: string) => {
      console.log('🎯 [CART STORE] setCurrentSlot called with:', slotId);
      set({ currentSlotId: slotId });

      // Initialize cart for slot if it doesn't exist
      const state = get();
      if (!state.carts[slotId]) {
        console.log('🎯 [CART STORE] Initializing new cart for slot:', slotId);
        set((state) => ({
          carts: {
            ...state.carts,
            [slotId]: {
              items: [],
              subtotal: 0,
              tax: 0,
              total: 0,
              customer: null,
              discount: 0,
              orderType: null,
              slotId: slotId,
              orderId: null
            }
          }
        }));
      }
      console.log('✅ [CART STORE] Slot', slotId, 'set successfully');
    },

    addItem: (item: MenuItem, quantity = 1, modifiers = { variations: [], addOns: [] }, options?: { keepSeparate?: boolean }) => {
      const state = get();
      if (!state.currentSlotId) return;

      const uniqueId = generateUniqueId(item);
      const itemPrice = calculateItemPrice(item, modifiers);
      const totalPrice = itemPrice * quantity;

      const newItem: CartItem = {
        ...item,
        uniqueId,
        quantity,
        modifiers,
        totalPrice
      };

      set((state) => {
        const currentCart = state.carts[state.currentSlotId!];
        const existingItemIndex = currentCart.items.findIndex(
          cartItem => cartItem.id === item.id &&
          JSON.stringify(cartItem.modifiers) === JSON.stringify(modifiers)
        );

        let newItems: CartItem[];
        const shouldMerge = !options?.keepSeparate;
        if (existingItemIndex >= 0 && shouldMerge) {
          // Update existing item quantity
          newItems = [...currentCart.items];
          newItems[existingItemIndex] = {
            ...newItems[existingItemIndex],
            quantity: newItems[existingItemIndex].quantity + quantity,
            totalPrice: itemPrice * (newItems[existingItemIndex].quantity + quantity)
          };
        } else {
          // Add new item
          newItems = [...currentCart.items, newItem];
        }

        const subtotal = newItems.reduce((sum, cartItem) => sum + cartItem.totalPrice, 0);
        const tax = subtotal * 0.1;
        const total = subtotal + tax - currentCart.discount;

        // Fast synchronous order ID generation - existing orders keep their ID
        let orderId = currentCart.orderId;
        if (!orderId && newItems.length > 0) {
          orderId = generateOrderNumber(); // Now synchronous and fast
        }

        const updatedCart = {
          ...currentCart,
          items: newItems,
          subtotal,
          tax,
          total,
          orderId
        };

        // ⚡ PHASE 1: Use centralized sync service
        if (orderId && newItems.length > 0) {
          syncCartToOverlay({
            orderId,
            slotId: state.currentSlotId!,
            orderType: currentCart.orderType || 'dine-in',
            items: newItems,
            customer: currentCart.customer,
            total,
            subtotal,
            tax,
            paymentStatus: 'unpaid',
            status: 'active'
          }).catch(error => {
            console.error('❌ [CART] Sync failed in addItem:', error);
          });
        }

        return {
          carts: {
            ...state.carts,
            [state.currentSlotId!]: updatedCart
          }
        };
      });
    },
    
    removeItem: (uniqueId: string) => {
      const state = get();
      if (!state.currentSlotId) return;

      set((state) => {
        const currentCart = state.carts[state.currentSlotId!];
        const newItems = currentCart.items.filter(item => item.uniqueId !== uniqueId);

        const subtotal = newItems.reduce((sum, cartItem) => sum + cartItem.totalPrice, 0);
        const tax = subtotal * 0.1;
        const total = subtotal + tax - currentCart.discount;

        const newCart: CartState = {
          ...currentCart,
          items: newItems,
          subtotal,
          tax,
          total
        };

        // ⚡ PHASE 1: Use centralized sync service
        const orderId = currentCart.orderId;
        if (orderId) {
          if (newItems.length === 0) {
            // If cart is empty, remove the overlay
            removeOrderOverlay(orderId).catch(error => {
              console.error('❌ [CART] Failed to remove overlay in removeItem:', error);
            });
          } else {
            // Update overlay with new items
            syncCartToOverlay({
              orderId,
              slotId: state.currentSlotId!,
              orderType: currentCart.orderType || 'dine-in',
              items: newItems,
              customer: currentCart.customer,
              total,
              subtotal,
              tax,
              paymentStatus: 'unpaid',
              status: 'active'
            }).catch(error => {
              console.error('❌ [CART] Sync failed in removeItem:', error);
            });
          }
        }

        return {
          carts: {
            ...state.carts,
            [state.currentSlotId!]: newCart
          }
        };
      });
    },
    
    updateQuantity: (uniqueId: string, quantity: number) => {
      const state = get();
      if (!state.currentSlotId || quantity <= 0) return;

      set((state) => {
        const currentCart = state.carts[state.currentSlotId!];
        const newItems = currentCart.items.map(item =>
          item.uniqueId === uniqueId
            ? { ...item, quantity, totalPrice: (item.totalPrice / item.quantity) * quantity }
            : item
        );

        const subtotal = newItems.reduce((sum, cartItem) => sum + cartItem.totalPrice, 0);
        const tax = subtotal * 0.1;
        const total = subtotal + tax - currentCart.discount;

        const newCart: CartState = {
          ...currentCart,
          items: newItems,
          subtotal,
          tax,
          total
        };

        // ⚡ PHASE 1: Use centralized sync service
        const orderId = currentCart.orderId;
        if (orderId && newItems.length > 0) {
          syncCartToOverlay({
            orderId,
            slotId: state.currentSlotId!,
            orderType: currentCart.orderType || 'dine-in',
            items: newItems,
            customer: currentCart.customer,
            total,
            subtotal,
            tax,
            paymentStatus: 'unpaid',
            status: 'active'
          }).catch(error => {
            console.error('❌ [CART] Sync failed in updateQuantity:', error);
          });
        }

        return {
          carts: {
            ...state.carts,
            [state.currentSlotId!]: newCart
          }
        };
      });
    },
    
    updateItemModifiers: (uniqueId: string, modifiers: CartItemModifiers) => {
      const state = get();
      console.log('🔍 [updateItemModifiers] Called with uniqueId:', uniqueId);
      console.log('🔍 [updateItemModifiers] currentSlotId:', state.currentSlotId);

      if (!state.currentSlotId) {
        console.log('❌ [updateItemModifiers] NO CURRENT SLOT ID - returning early');
        return;
      }

      set((state) => {
        const currentCart = state.carts[state.currentSlotId!];
        const cartItemsInfo = currentCart.items.map(i => `${i.name}: ${i.uniqueId}`).join(', ');
        console.log('🔍 [updateItemModifiers] Current cart items:', cartItemsInfo);
        console.log('🔍 [updateItemModifiers] Looking for uniqueId:', uniqueId);

        const targetItem = currentCart.items.find(item => item.uniqueId === uniqueId);
        console.log('🔍 [updateItemModifiers] Target item found:', !!targetItem);

        if (!targetItem) {
          console.log('❌ [updateItemModifiers] Available uniqueIds in cart:', currentCart.items.map(i => i.uniqueId));
          console.log('❌ [updateItemModifiers] Searching for:', uniqueId);
        }

        if (!targetItem) {
          console.log('❌ [updateItemModifiers] ITEM NOT FOUND - returning state without changes');
          return state;
        }

        // DEBUG: Check payment tracking fields
        console.log('🔍 [UPDATE MODIFIERS DEBUG]', {
          itemName: targetItem.name,
          isPaid: targetItem.isPaid,
          hasOriginalPaidPrice: !!targetItem.originalPaidPrice,
          originalPaidPrice: targetItem.originalPaidPrice,
          hasOriginalPaidModifiers: !!targetItem.originalPaidModifiers,
          originalPaidModifiers: targetItem.originalPaidModifiers
        });

        // PROFESSIONAL POS LOGIC: Handle paid vs unpaid items differently
        if (targetItem.isPaid && targetItem.originalPaidPrice && targetItem.originalPaidModifiers) {
          // PAID ITEM EDIT: Calculate only the price difference
          const originalPrice = targetItem.originalPaidPrice / targetItem.quantity; // Per unit original price
          const newPrice = calculateItemPrice(targetItem, modifiers);
          const priceDifference = newPrice - originalPrice;

          console.log('💰 [PAID ITEM EDIT]', {
            item: targetItem.name,
            originalPrice: originalPrice.toFixed(2),
            newPrice: newPrice.toFixed(2),
            difference: priceDifference.toFixed(2)
          });

          if (priceDifference > 0) {
            // 🔍 PROFESSIONAL: Check if a modifier upgrade item already exists for this paid item
            const existingUpgradeItem = currentCart.items.find(item =>
              item.id === targetItem.id &&
              item.name.includes('(modifier upgrade)') &&
              item.originalOrderId === targetItem.originalOrderId &&
              !item.isPaid
            );

            if (existingUpgradeItem) {
              // UPDATE EXISTING upgrade item instead of creating duplicate
              console.log('🔄 [PAID ITEM EDIT] Updating existing modifier upgrade item');
              console.log('🔍 [DEBUG] New modifiers:', JSON.stringify(modifiers, null, 2));
              console.log('🔍 [DEBUG] Original paid modifiers:', JSON.stringify(targetItem.originalPaidModifiers, null, 2));

              // 🎯 PROFESSIONAL: Calculate TRUE differential like Square/Clover
              // For variations: Show new variation with DIFFERENTIAL price (not full price)
              // For addons: Show added addons (full price), exclude removed ones

              const originalVariationPrice = targetItem.originalPaidModifiers?.variations?.[0]?.price || 0;
              const newVariationPrice = modifiers.variations?.[0]?.price || 0;
              const variationPriceDiff = newVariationPrice - originalVariationPrice;

              const updatedUpgradeItem: CartItem = {
                ...existingUpgradeItem,
                price: priceDifference,
                totalPrice: priceDifference * targetItem.quantity,
                modifiers: {
                  // Variations: Show new variation with adjusted price (differential)
                  variations: modifiers.variations?.map(v => ({
                    ...v,
                    price: variationPriceDiff // Show only the price increase/decrease
                  })).filter(v =>
                    !targetItem.originalPaidModifiers?.variations?.some(orig => orig.id === v.id)
                  ) || [],
                  // AddOns: Show only ADDED addons (not ones that were already there)
                  addOns: modifiers.addOns?.filter(a =>
                    !targetItem.originalPaidModifiers?.addOns?.some(orig => orig.id === a.id)
                  ) || [],
                  specialInstructions: modifiers.specialInstructions !== targetItem.originalPaidModifiers?.specialInstructions
                    ? modifiers.specialInstructions : undefined,
                  notes: modifiers.notes !== targetItem.originalPaidModifiers?.notes
                    ? modifiers.notes : undefined
                },
                isModifierUpgrade: true // 🎯 Mark as non-editable
              };

              console.log('✅ [DEBUG] Updated upgrade item - isModifierUpgrade:', updatedUpgradeItem.isModifierUpgrade);
              console.log('✅ [DEBUG] Updated upgrade item modifiers:', JSON.stringify(updatedUpgradeItem.modifiers, null, 2));

              // 🎯 PROFESSIONAL: Keep paid item UNCHANGED - matches Square/Clover
              // Original line item shows original modifiers/price (immutable)
              // Upgrade item shows the differential (what changed)
              const newItems = currentCart.items.map(item => {
                if (item.uniqueId === existingUpgradeItem.uniqueId) return updatedUpgradeItem;
                return item; // Paid item stays untouched
              });

              const subtotal = newItems.reduce((sum, cartItem) => sum + cartItem.totalPrice, 0);
              const tax = subtotal * 0.1;
              const total = subtotal + tax - currentCart.discount;

              // Sync to overlay
              const orderId = currentCart.orderId;
              if (orderId && newItems.length > 0) {
                syncCartToOverlay({
                  orderId,
                  slotId: state.currentSlotId!,
                  orderType: currentCart.orderType || 'dine-in',
                  items: newItems,
                  customer: currentCart.customer,
                  total,
                  subtotal,
                  tax,
                  paymentStatus: 'unpaid',
                  status: 'active'
                }).catch(error => {
                  console.error('❌ [CART] Sync failed in updateItemModifiers (update upgrade):', error);
                });
              }

              return {
                carts: {
                  ...state.carts,
                  [state.currentSlotId!]: {
                    ...currentCart,
                    items: newItems,
                    subtotal,
                    tax,
                    total
                  }
                }
              };
            }

            // CREATE NEW upgrade item (first time editing)
            console.log('➕ [PAID ITEM EDIT] Creating new modifier upgrade item');
            console.log('🔍 [DEBUG] New modifiers:', JSON.stringify(modifiers, null, 2));
            console.log('🔍 [DEBUG] Original paid modifiers:', JSON.stringify(targetItem.originalPaidModifiers, null, 2));

            // 🎯 PROFESSIONAL: Calculate TRUE differential like Square/Clover
            const originalVariationPrice = targetItem.originalPaidModifiers?.variations?.[0]?.price || 0;
            const newVariationPrice = modifiers.variations?.[0]?.price || 0;
            const variationPriceDiff = newVariationPrice - originalVariationPrice;

            const differenceItem: CartItem = {
              uniqueId: generateUniqueId(targetItem),
              id: targetItem.id,
              name: `${targetItem.name} (modifier upgrade)`,
              description: targetItem.description,
              price: priceDifference,
              quantity: targetItem.quantity,
              totalPrice: priceDifference * targetItem.quantity,
              category: targetItem.category,
              image: targetItem.image,
              available: targetItem.available,
              modifiers: {
                // Variations: Show new variation with differential price
                variations: modifiers.variations?.map(v => ({
                  ...v,
                  price: variationPriceDiff // Show only the price increase/decrease
                })).filter(v =>
                  !targetItem.originalPaidModifiers?.variations?.some(orig => orig.id === v.id)
                ) || [],
                // AddOns: Show only ADDED addons
                addOns: modifiers.addOns?.filter(a =>
                  !targetItem.originalPaidModifiers?.addOns?.some(orig => orig.id === a.id)
                ) || [],
                specialInstructions: modifiers.specialInstructions !== targetItem.originalPaidModifiers?.specialInstructions
                  ? modifiers.specialInstructions : undefined,
                notes: modifiers.notes !== targetItem.originalPaidModifiers?.notes
                  ? modifiers.notes : undefined
              },
              isPaid: false, // This is the unpaid difference
              paidQuantity: 0,
              originalOrderId: targetItem.originalOrderId,
              isModifierUpgrade: true // 🎯 Mark as non-editable
            };

            console.log('✅ [DEBUG] Created upgrade item - isModifierUpgrade:', differenceItem.isModifierUpgrade);
            console.log('✅ [DEBUG] Created upgrade item modifiers:', JSON.stringify(differenceItem.modifiers, null, 2));

            // 🎯 PROFESSIONAL: Keep paid item UNCHANGED - matches Square/Clover
            // Original line item shows original modifiers/price (immutable)
            // Upgrade item shows the differential (what changed)
            const newItems = [...currentCart.items, differenceItem];

            const subtotal = newItems.reduce((sum, cartItem) => sum + cartItem.totalPrice, 0);
            const tax = subtotal * 0.1;
            const total = subtotal + tax - currentCart.discount;

            // ⚡ PHASE 1: Use centralized sync service
            const orderId = currentCart.orderId;
            if (orderId && newItems.length > 0) {
              syncCartToOverlay({
                orderId,
                slotId: state.currentSlotId!,
                orderType: currentCart.orderType || 'dine-in',
                items: newItems,
                customer: currentCart.customer,
                total,
                subtotal,
                tax,
                paymentStatus: 'unpaid',
                status: 'active'
              }).catch(error => {
                console.error('❌ [CART] Sync failed in updateItemModifiers (paid item):', error);
              });
            }

            return {
              carts: {
                ...state.carts,
                [state.currentSlotId!]: {
                  ...currentCart,
                  items: newItems,
                  subtotal,
                  tax,
                  total
                }
              }
            };
          } else {
            // 🎯 PROFESSIONAL: Even with 0 or negative price difference, NEVER update paid item
            // Always show changes in adjustment line (Square/Clover pattern)
            console.log('📋 [PAID ITEM EDIT] Price difference <= 0, still using upgrade item for changes');

            // Find or create upgrade item
            const existingUpgradeItem = currentCart.items.find(item =>
              item.id === targetItem.id &&
              item.name.includes('(modifier upgrade)') &&
              item.originalOrderId === targetItem.originalOrderId &&
              !item.isPaid
            );

            const originalVariationPrice = targetItem.originalPaidModifiers?.variations?.[0]?.price || 0;
            const newVariationPrice = modifiers.variations?.[0]?.price || 0;
            const variationPriceDiff = newVariationPrice - originalVariationPrice;

            if (existingUpgradeItem) {
              // Update existing upgrade item
              const updatedUpgradeItem: CartItem = {
                ...existingUpgradeItem,
                price: priceDifference,
                totalPrice: priceDifference * targetItem.quantity,
                modifiers: {
                  variations: modifiers.variations?.map(v => ({
                    ...v,
                    price: variationPriceDiff
                  })).filter(v =>
                    !targetItem.originalPaidModifiers?.variations?.some(orig => orig.id === v.id)
                  ) || [],
                  addOns: modifiers.addOns?.filter(a =>
                    !targetItem.originalPaidModifiers?.addOns?.some(orig => orig.id === a.id)
                  ) || [],
                  specialInstructions: modifiers.specialInstructions !== targetItem.originalPaidModifiers?.specialInstructions
                    ? modifiers.specialInstructions : undefined,
                  notes: modifiers.notes !== targetItem.originalPaidModifiers?.notes
                    ? modifiers.notes : undefined
                },
                isModifierUpgrade: true
              };

              const newItems = currentCart.items.map(item => {
                if (item.uniqueId === existingUpgradeItem.uniqueId) return updatedUpgradeItem;
                return item;
              });

              const subtotal = newItems.reduce((sum, cartItem) => sum + cartItem.totalPrice, 0);
              const tax = subtotal * 0.1;
              const total = subtotal + tax - currentCart.discount;

              const orderId = currentCart.orderId;
              if (orderId && newItems.length > 0) {
                syncCartToOverlay({
                  orderId,
                  slotId: state.currentSlotId!,
                  orderType: currentCart.orderType || 'dine-in',
                  items: newItems,
                  customer: currentCart.customer,
                  total,
                  subtotal,
                  tax,
                  paymentStatus: 'unpaid',
                  status: 'active'
                }).catch(error => {
                  console.error('❌ [CART] Sync failed:', error);
                });
              }

              return {
                carts: {
                  ...state.carts,
                  [state.currentSlotId!]: {
                    ...currentCart,
                    items: newItems,
                    subtotal,
                    tax,
                    total
                  }
                }
              };
            } else {
              // Create new upgrade item (even if price diff is 0)
              const differenceItem: CartItem = {
                uniqueId: generateUniqueId(targetItem),
                id: targetItem.id,
                name: `${targetItem.name} (modifier upgrade)`,
                description: targetItem.description,
                price: priceDifference,
                quantity: targetItem.quantity,
                totalPrice: priceDifference * targetItem.quantity,
                category: targetItem.category,
                image: targetItem.image,
                available: targetItem.available,
                modifiers: {
                  variations: modifiers.variations?.map(v => ({
                    ...v,
                    price: variationPriceDiff
                  })).filter(v =>
                    !targetItem.originalPaidModifiers?.variations?.some(orig => orig.id === v.id)
                  ) || [],
                  addOns: modifiers.addOns?.filter(a =>
                    !targetItem.originalPaidModifiers?.addOns?.some(orig => orig.id === a.id)
                  ) || [],
                  specialInstructions: modifiers.specialInstructions !== targetItem.originalPaidModifiers?.specialInstructions
                    ? modifiers.specialInstructions : undefined,
                  notes: modifiers.notes !== targetItem.originalPaidModifiers?.notes
                    ? modifiers.notes : undefined
                },
                isPaid: false,
                paidQuantity: 0,
                originalOrderId: targetItem.originalOrderId,
                isModifierUpgrade: true
              };

              const newItems = [...currentCart.items, differenceItem];
              const subtotal = newItems.reduce((sum, cartItem) => sum + cartItem.totalPrice, 0);
              const tax = subtotal * 0.1;
              const total = subtotal + tax - currentCart.discount;

              const orderId = currentCart.orderId;
              if (orderId && newItems.length > 0) {
                syncCartToOverlay({
                  orderId,
                  slotId: state.currentSlotId!,
                  orderType: currentCart.orderType || 'dine-in',
                  items: newItems,
                  customer: currentCart.customer,
                  total,
                  subtotal,
                  tax,
                  paymentStatus: 'unpaid',
                  status: 'active'
                }).catch(error => {
                  console.error('❌ [CART] Sync failed:', error);
                });
              }

              return {
                carts: {
                  ...state.carts,
                  [state.currentSlotId!]: {
                    ...currentCart,
                    items: newItems,
                    subtotal,
                    tax,
                    total
                  }
                }
              };
            }
          }
        } else {
          // UNPAID ITEM: Standard modifier update with full price recalculation
          const newItemPrice = calculateItemPrice(targetItem, modifiers);
          const unitPrice = newItemPrice;
          const newTotalPrice = unitPrice * targetItem.quantity;

          const updatedItem = { ...targetItem, modifiers, totalPrice: newTotalPrice };
          const newItems = currentCart.items.map(item =>
            item.uniqueId === uniqueId ? updatedItem : item
          );

          const subtotal = newItems.reduce((sum, cartItem) => sum + cartItem.totalPrice, 0);
          const tax = subtotal * 0.1;
          const total = subtotal + tax - currentCart.discount;

          // ⚡ PHASE 1: Use centralized sync service
          const orderId = currentCart.orderId;
          if (orderId && newItems.length > 0) {
            syncCartToOverlay({
              orderId,
              slotId: state.currentSlotId!,
              orderType: currentCart.orderType || 'dine-in',
              items: newItems,
              customer: currentCart.customer,
              total,
              subtotal,
              tax,
              paymentStatus: 'unpaid',
              status: 'active'
            }).catch(error => {
              console.error('❌ [CART] Sync failed in updateItemModifiers (unpaid):', error);
            });
          }

          return {
            carts: {
              ...state.carts,
              [state.currentSlotId!]: {
                ...currentCart,
                items: newItems,
                subtotal,
                tax,
                total
              }
            }
          };
        }
      });
    },
    
    clearCart: () => {
      const state = get();
      if (!state.currentSlotId) return;

      // Get the current cart's order ID before clearing
      const currentCart = state.carts[state.currentSlotId];
      const currentOrderId = currentCart?.orderId;

      // If there's an unused order ID, discard it
      if (currentOrderId && currentCart && currentCart.items.length === 0) {
        console.log('🗑️ [CART STORE] Discarding unused order number during clear:', currentOrderId);
        discardOrderNumber(currentOrderId);
      }

      set((state) => ({
        carts: {
          ...state.carts,
          [state.currentSlotId!]: {
            items: [],
            subtotal: 0,
            tax: 0,
            total: 0,
            customer: null,
            discount: 0,
            orderType: null,
            slotId: state.currentSlotId,
            orderId: null
          }
        }
      }));
    },

    
    setOrderType: (orderType: string) => {
      const state = get();
      if (!state.currentSlotId) return;
      
      set((state) => ({
        carts: {
          ...state.carts,
          [state.currentSlotId!]: {
            ...state.carts[state.currentSlotId!],
            orderType: orderType as OrderType
          }
        }
      }));
    },
    
    setCustomer: (customer: CustomerInfo) => {
      const state = get();
      if (!state.currentSlotId) return;
      
      set((state) => ({
        carts: {
          ...state.carts,
          [state.currentSlotId!]: {
            ...state.carts[state.currentSlotId!],
            customer
          }
        }
      }));
    },

    setOrderId: (orderId: string) => {
      const state = get();
      if (!state.currentSlotId) return;

      set((state) => ({
        carts: {
          ...state.carts,
          [state.currentSlotId!]: {
            ...state.carts[state.currentSlotId!],
            orderId
          }
        }
      }));
      console.log('🎯 [CART] Set order ID for slot', state.currentSlotId, ':', orderId);
    },

    applyDiscount: (discount: number) => {
      const state = get();
      if (!state.currentSlotId) return;
      
      set((state) => {
        const currentCart = state.carts[state.currentSlotId!];
        const total = currentCart.subtotal + currentCart.tax - discount;
        
        return {
          carts: {
            ...state.carts,
            [state.currentSlotId!]: {
              ...currentCart,
              discount,
              total
            }
          }
        };
      });
    },

    loadExistingOrder: (orderItems: any[], customer?: CustomerInfo, orderType?: OrderType, paymentStatus?: 'paid' | 'unpaid' | 'mixed', orderId?: string) => {
      const state = get();
      if (!state.currentSlotId) {
        console.error('❌ [CART] Cannot load existing order: No current slot ID');
        return;
      }

      console.log('🔄 [CART] Loading existing order into slot:', state.currentSlotId);
      console.log('📦 [CART] Order items:', orderItems.length, 'items');
      console.log('💳 [CART] Payment status for loading:', paymentStatus);

      try {
        // BULLETPROOF: Convert and validate order items to cart items
        const cartItems: CartItem[] = orderItems.map((item, index) => {
          // Calculate quantity first for payment tracking
          const quantity = typeof item.quantity === 'number' && item.quantity > 0 ? item.quantity : 1;

          // 🎯 CRITICAL: Preserve uniqueId from overlay if it exists, otherwise generate new one
          // This fixes the bug where editing paid items failed because uniqueId changed on reload
          const uniqueId = item.uniqueId || generateUniqueId(item);
          console.log(`🔑 [UNIQUE ID] Item ${index + 1}: ${item.name} - uniqueId: ${uniqueId} (${item.uniqueId ? 'preserved from overlay' : 'newly generated'})`);

          // 🔍 DEBUG: Log originalPaidModifiers from overlay for paid items
          if (item.isPaid && item.originalPaidModifiers) {
            console.log(`🔍 [ORIGINAL PAID] Item ${index + 1} from overlay:`, JSON.stringify(item.originalPaidModifiers, null, 2));
          }

          // Validate required fields with proper defaults
          const cartItem: CartItem = {
            uniqueId,
            id: item.id || `item-${index}`,
            name: item.name || 'Unknown Item',
            price: typeof item.price === 'number' ? item.price : 0,
            quantity,
            totalPrice: typeof item.total === 'number' ? item.total :
                       typeof item.totalPrice === 'number' ? item.totalPrice :
                       (typeof item.price === 'number' ? item.price * quantity : 0),
            category: item.category || 'food',
            available: true,
            modifiers: {
              variations: item.modifiers?.variations || [],
              addOns: item.modifiers?.addOns || [],
              specialInstructions: item.modifiers?.specialInstructions || item.notes || undefined,
              notes: item.modifiers?.notes || undefined
            },

            // 🏆 PROFESSIONAL PAYMENT TRACKING: Individual item payment status (not order-level)
            isPaid: paymentStatus === 'mixed' ? (item.isPaid || false) : paymentStatus === 'paid',
            paidQuantity: item.paidQuantity !== undefined ? item.paidQuantity :
              (paymentStatus === 'mixed' ? (item.isPaid ? quantity : 0) : (paymentStatus === 'paid' ? quantity : 0)),
            originalOrderId: item.originalOrderId || item.orderId || state.currentSlotId,
            // 🎯 CRITICAL: Load originalPaidPrice from overlay if it exists, otherwise calculate
            originalPaidPrice: item.originalPaidPrice !== undefined ? item.originalPaidPrice :
              ((paymentStatus === 'mixed' ? item.isPaid : paymentStatus === 'paid') ?
              (typeof item.total === 'number' ? item.total :
               typeof item.totalPrice === 'number' ? item.totalPrice :
               (typeof item.price === 'number' ? item.price * quantity : 0)) : undefined),
            // 🎯 CRITICAL: Load originalPaidModifiers from overlay if it exists, otherwise use current modifiers
            originalPaidModifiers: item.originalPaidModifiers !== undefined ? item.originalPaidModifiers :
              ((paymentStatus === 'mixed' ? item.isPaid : paymentStatus === 'paid') ? {
              variations: item.modifiers?.variations || [],
              addOns: item.modifiers?.addOns || [],
              specialInstructions: item.modifiers?.specialInstructions || item.notes || undefined,
              notes: item.modifiers?.notes || undefined
            } : undefined),
            // 🎯 PROFESSIONAL: Preserve isModifierUpgrade flag (prevents editing upgrade items)
            // BULLETPROOF: If name contains "(modifier upgrade)", force true regardless of stored value
            isModifierUpgrade: item.name.includes('(modifier upgrade)') ? true : (item.isModifierUpgrade || false)
          };

          // 🔍 DEBUG: Log modifier upgrade flag explicitly
          if (item.name.includes('(modifier upgrade)')) {
            console.log(`🔍 [LOAD DEBUG ${index + 1}] Upgrade item FROM OVERLAY:`);
            console.log(`  name: ${item.name}`);
            console.log(`  isModifierUpgrade: ${item.isModifierUpgrade}`);
            console.log(`  typeof isModifierUpgrade: ${typeof item.isModifierUpgrade}`);
            console.log(`  item.isModifierUpgrade === true: ${item.isModifierUpgrade === true}`);
          }
          if (cartItem.isModifierUpgrade) {
            console.log(`🔒 [MODIFIER UPGRADE ITEM ${index + 1}] ${cartItem.name} - LOCKED FROM EDITING`);
          }
          console.log(`📋 [CART ITEM ${index + 1}] isModifierUpgrade:`, cartItem.isModifierUpgrade);

          return cartItem;
        });

        // Calculate totals with proper validation
        const subtotal = cartItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
        const tax = subtotal * 0.15; // Using 15% tax as per system standard
        const total = subtotal + tax;

        console.log('💰 [CART TOTALS]', {
          subtotal: subtotal.toFixed(2),
          tax: tax.toFixed(2),
          total: total.toFixed(2),
          itemCount: cartItems.length
        });

        // BACKEND-READY: Structure data for API integration
        const cartData = {
          items: cartItems,
          subtotal,
          tax,
          total,
          customer: customer || null,
          discount: 0,
          orderType: orderType || null,
          slotId: state.currentSlotId,
          orderId: orderId || null, // BULLETPROOF: Set order ID from existing order
          // Backend integration fields
          loadedFromExisting: true,
          loadedAt: new Date().toISOString(),
          originalOrderData: orderItems // Keep reference for backend sync
        };

        set((state) => ({
          carts: {
            ...state.carts,
            [state.currentSlotId!]: cartData
          }
        }));

        // 🚨 CRITICAL FIX: Set the order ID in cart state for cart overlay sync
        if (orderId) {
          console.log('🎯 [ORDER ID SYNC] Setting cart order ID from existing order:', orderId);
          get().setOrderId(orderId);
        }

        console.log('✅ [CART] Successfully loaded existing order into cart');

      } catch (error) {
        console.error('❌ [CART] Error loading existing order:', error);
        throw new Error('Failed to load existing order into cart');
      }
    },

    // Getters
    getCurrentCart: () => {
      const state = get();
      return state.currentSlotId ? state.carts[state.currentSlotId] : {
        items: [],
        subtotal: 0,
        tax: 0,
        total: 0,
        customer: null,
        discount: 0,
        orderType: null,
        slotId: null,
        orderId: null
      };
    },
    
    getCartItems: () => {
      const state = get();
      return state.currentSlotId ? state.carts[state.currentSlotId]?.items || [] : [];
    },
    
    getCartSubtotal: () => {
      const state = get();
      return state.currentSlotId ? state.carts[state.currentSlotId]?.subtotal || 0 : 0;
    },
    
    getCartTotal: () => {
      const state = get();
      return state.currentSlotId ? state.carts[state.currentSlotId]?.total || 0 : 0;
    }
  }))
);

// Professional selectors for components
export const useCartItems = () => useCartStore(state => 
  state.currentSlotId ? state.carts[state.currentSlotId]?.items || [] : []
);

export const useCartSubtotal = () => useCartStore(state => 
  state.currentSlotId ? state.carts[state.currentSlotId]?.subtotal || 0 : 0
);

export const useCartTotal = () => useCartStore(state => 
  state.currentSlotId ? state.carts[state.currentSlotId]?.total || 0 : 0
);

export const useCurrentSlotId = () => useCartStore(state => state.currentSlotId);

export const useOrderType = () => useCartStore(state => 
  state.currentSlotId ? state.carts[state.currentSlotId]?.orderType || null : null
);

export const useCustomer = () => useCartStore(state =>
  state.currentSlotId ? state.carts[state.currentSlotId]?.customer || null : null
);

export const useOrderId = () => useCartStore(state =>
  state.currentSlotId ? state.carts[state.currentSlotId]?.orderId || null : null
);

export const useTax = () => useCartStore(state =>
  state.currentSlotId ? state.carts[state.currentSlotId]?.tax || 0 : 0
);

export const useDiscount = () => useCartStore(state => 
  state.currentSlotId ? state.carts[state.currentSlotId]?.discount || 0 : 0
);

// Actions
export const useCartActions = () => useCartStore(state => ({
  setCurrentSlot: state.setCurrentSlot,
  addItem: state.addItem,
  removeItem: state.removeItem,
  updateQuantity: state.updateQuantity,
  updateItemModifiers: state.updateItemModifiers,
  clearCart: state.clearCart,
  setOrderType: state.setOrderType,
  setCustomer: state.setCustomer,
  applyDiscount: state.applyDiscount,
  setOrderId: state.setOrderId,
  loadExistingOrder: state.loadExistingOrder
}));

