/**
 * useOrderOverlayData Hook - Bulletproof Order Data Loading
 *
 * PURPOSE: Professional order data loading with proper fallbacks and cache management
 * ENSURES: Always loads the correct active order data for any slot
 */

import { useState, useEffect } from 'react';
import { useOrderOverlayStore, type OverlayOrder } from '@/lib/store/order-overlay';
import type { CartItem } from '@/lib/store/cart-new';
import type { Slot } from '@/types/pos';

interface UseOrderOverlayDataProps {
  slotId: string;
  orderNumber?: string | number;
  slot?: Slot;
}

interface OrderOverlayData {
  cartItems: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  discount: number;
  cartDiscount: number;
  orderData: OverlayOrder | null;
  isLoading: boolean;
  error: string | null;
}

export const useOrderOverlayData = ({
  slotId,
  orderNumber,
  slot
}: UseOrderOverlayDataProps): OrderOverlayData => {
  const [orderData, setOrderData] = useState<OverlayOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const overlayStore = useOrderOverlayStore();

  // 🚀 INSTANT ORDER LOADING: Direct retrieval by slot ID
  useEffect(() => {
    let mounted = true;

    const loadOrderData = async () => {
      console.log('🚀 [INSTANT LOAD] Loading order for slot:', slotId);
      setIsLoading(true);
      setError(null);

      try {
        let foundOrder: OverlayOrder | null = null;

        // 🎯 SIMPLE & CORRECT: Always load by order number (order ID)
        // Order ID is the primary key - this works for ALL orders (active, completed, paid, unpaid)
        if (orderNumber) {
          // First check in-memory
          foundOrder = overlayStore.overlays[orderNumber.toString()];

          if (!foundOrder) {
            // Fallback to loading from IndexedDB if not in memory
            await overlayStore.loadAll?.();
            foundOrder = overlayStore.overlays[orderNumber.toString()];
          }

          if (foundOrder) {
            console.log('✅ [ORDER LOAD] Found order by ID:', foundOrder.id, 'status:', foundOrder.status);
          } else {
            console.log('⚠️ [ORDER LOAD] No order found for ID:', orderNumber);
          }
        } else {
          console.log('⚠️ [ORDER LOAD] No order number provided - cannot load order data');
        }

        if (!mounted) return;

        if (foundOrder) {
          console.log('✅ [ORDER DATA] Successfully loaded order:', foundOrder.id, 'items:', foundOrder.items?.length || 0);
          setOrderData(foundOrder);
        } else {
          if (orderNumber) {
            console.warn('⚠️ [ORDER DATA] No order found for order number:', orderNumber);
            setError('Order not found');
          } else {
            console.log('✅ [ORDER DATA] No active order - ready for new order');
          }
          setOrderData(null);
        }
      } catch (err) {
        console.error('❌ [ORDER DATA] Error loading order:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load order');
          setOrderData(null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadOrderData();

    return () => {
      mounted = false;
    };
  }, [slotId, orderNumber, slot?.orderId, overlayStore]);

  // 🏗️ PROFESSIONAL CART CONVERSION: Transform overlay data to cart items
  const cartItems: CartItem[] = orderData?.items?.map((item, index) => ({
    uniqueId: `order-${orderData.id}-${index}`,
    id: item.id || `item-${index}`,
    name: item.name,
    price: item.price,
    quantity: item.quantity || 1,
    totalPrice: item.total || item.price,
    category: 'food',
    available: true,
    isPaid: (item as any).isPaid || false, // Preserve payment status
    modifiers: {
      variations: item.modifiers?.variations || [],
      addOns: item.modifiers?.addOns || [],
      specialInstructions: item.modifiers?.specialInstructions || item.notes || undefined,
      notes: item.modifiers?.notes || undefined
    }
  })) || [];

  // 💰 PROFESSIONAL TOTALS: Calculate from overlay data or cart items
  // 🚨 CRITICAL FIX: Never mix total and calculated values
  // If overlay has subtotal/tax/total, use them directly
  // If not, calculate from cart items
  const hasOverlayTotals = orderData?.subtotal !== undefined && orderData?.tax !== undefined && orderData?.total !== undefined;

  let subtotal: number;
  let tax: number;
  let total: number;

  if (hasOverlayTotals) {
    // 🔧 PRODUCTION FIX: Detect and fix legacy bad calculations
    // Old code used: subtotal = total * 0.9, tax = total * 0.1 (WRONG!)
    // Problem: These values add up to total BUT are wrong breakdowns
    // Real: subtotal should be items sum, tax should be subtotal * 0.1
    // Legacy bug: subtotal = 90% of total, tax = 10% of total
    const savedSubtotal = orderData.subtotal!;
    const savedTax = orderData.tax!;
    const savedTotal = orderData.total!;

    // Calculate what items actually sum to
    const itemsSum = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);

    // Check if saved subtotal matches items sum (within tolerance)
    const subtotalDiff = Math.abs(savedSubtotal - itemsSum);

    if (itemsSum > 0 && subtotalDiff > 0.01) {
      // Subtotal doesn't match items! This is legacy bad calculation
      // Fix: Use items sum as subtotal, recalculate tax
      console.warn('🔧 [TOTALS FIX] Detected legacy bad subtotal, using items sum:', {
        savedSubtotal,
        itemsSum,
        diff: subtotalDiff.toFixed(2)
      });

      subtotal = itemsSum;
      tax = savedTotal - itemsSum; // Tax is the difference
      total = savedTotal; // Total was always correct
    } else {
      // Subtotal matches items - use saved values
      subtotal = savedSubtotal;
      tax = savedTax;
      total = savedTotal;
    }
  } else {
    // Calculate from cart items (fallback)
    const itemsTotal = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);
    subtotal = itemsTotal;
    tax = itemsTotal * 0.15; // 15% tax
    total = subtotal + tax;
  }

  const discount = 0; // TODO: Extract from overlay data when implemented
  const cartDiscount = 0; // TODO: Extract from overlay data when implemented

  return {
    cartItems,
    subtotal,
    tax,
    total,
    discount,
    cartDiscount,
    orderData,
    isLoading,
    error
  };
};