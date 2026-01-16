/**
 * useOrderManagement Hook - PROFESSIONAL ORDER MANAGEMENT
 *
 * PURPOSE: Centralized state management for orders page including advanced filtering,
 * real-time updates, bulk operations, and kitchen display integration.
 *
 * LINKS WITH:
 * - OrdersPageContent: Main component that uses this hook
 * - useSafeSlotActions: Unified slot system integration
 * - Order types and interfaces
 *
 * WHY: Separates complex order management logic from UI components.
 * Provides professional filtering, search, and real-time update capabilities.
 * Prepares for backend integration and kitchen display system.
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useSafeSlotActions, useSafeSlotsByType } from '@/lib/store/unified-integration-wrapper';
import { useOrderOverlayStore } from '@/lib/store/order-overlay';
import { OrderItem } from '@/types/pos';

export interface Order {
  id: string;
  slotId: string;
  customerName: string;
  customerPhone?: string;
  orderNumber: string;
  orderType: 'dine-in' | 'take-away' | 'delivery';
  paymentMethod: 'cash' | 'card' | 'online';
  placedAt: string;
  completedAt?: string;
  elapsedTime: string;
  timeStatus: 'fresh' | 'warning' | 'overdue';
  itemCount: number;
  status: 'pending' | 'in-progress' | 'ready' | 'completed' | 'cancelled' | 'unpaid';
  priority: 'normal' | 'high' | 'urgent';
  total: number;
  subtotal: number;
  tax: number;
  discount?: number;
  orderDetails: OrderItem[];
  specialInstructions?: string;
  estimatedCompletionTime?: string;
  kitchenNotes?: string;
  refunded?: boolean;
  refundAmount?: number;
  syncStatus?: 'pending' | 'syncing' | 'synced' | 'failed';
}

// Advanced filtering interface
export interface OrderFilters {
  searchQuery: string;
  statusFilter: 'all' | Order['status'];
  orderTypeFilter: 'all' | Order['orderType'];
  paymentMethodFilter: 'all' | Order['paymentMethod'];
  priorityFilter: 'all' | Order['priority'];
  dateRangeFilter: 'all' | 'today' | 'yesterday' | 'week' | 'month' | 'custom';
  customDateFrom?: Date;
  customDateTo?: Date;
  minAmount?: number;
  maxAmount?: number;
  customerFilter?: string;
}

// Order management state
interface OrderManagementState {
  selectedOrders: Set<string>;
  selectedOrder: Order | null;
  isOrderOverlayOpen: boolean;
  isLoading: boolean;
  filters: OrderFilters;
  sortBy: 'placedAt' | 'total' | 'status' | 'priority';
  sortOrder: 'asc' | 'desc';
}

// Initial state
const initialFilters: OrderFilters = {
  searchQuery: '',
  statusFilter: 'all',
  orderTypeFilter: 'all',
  paymentMethodFilter: 'all',
  priorityFilter: 'all',
  dateRangeFilter: 'all' // Show all orders (today's orders already filtered in processedOrders)
};

const initialState: OrderManagementState = {
  selectedOrders: new Set(),
  selectedOrder: null,
  isOrderOverlayOpen: false,
  isLoading: false,
  filters: initialFilters,
  sortBy: 'placedAt',
  sortOrder: 'desc'
};

export const useOrderManagement = () => {
  const [state, setState] = useState<OrderManagementState>(initialState);
  const slotActions = useSafeSlotActions();
  const overlayStore = useOrderOverlayStore();

  // Subscribe to overlays changes for reactivity
  const overlays = useOrderOverlayStore(state => state.overlays);

  // Get real-time slot data for order synchronization
  const dineInSlots = useSafeSlotsByType('dine-in') ;
  const takeAwaySlots = useSafeSlotsByType('take-away');
  const deliverySlots = useSafeSlotsByType('delivery') ;

  // Load today's completed orders from IndexedDB on mount
  React.useEffect(() => {
    const loadTodaysOrders = async () => {
      try {
        // Load all today's orders into memory
        await overlayStore.loadAll?.();
        console.log(`📅 [ORDER MANAGEMENT] Loaded today's orders into memory`);
      } catch (error) {
        console.error('❌ [ORDER MANAGEMENT] Failed to load today\'s orders:', error);
      }
    };

    loadTodaysOrders();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // REMOVED: updateState helper that was causing circular dependencies

  // FIXED: Memoize processed orders to include BOTH processing orders (from slots) AND completed orders (from overlays)
  const processedOrders = useMemo(() => {
    const allSlots = [...dineInSlots, ...takeAwaySlots, ...deliverySlots];

    // Define valid order types once to prevent reference changes
    const validOrderTypes = ['dine-in', 'take-away', 'delivery'] as const;

    // 1. Get processing orders from slots (existing logic)
    const processingOrders: Order[] = allSlots
      .filter(slot =>
        slot.status === 'processing' &&
        slot.orderRefId && // Phase 1: Slots only have orderRefId, not orderDetails
        validOrderTypes.includes(slot.orderType as any)
      )
      .map((slot) => {
        // 🎯 GET ACTUAL ORDER DATA: Get order details from overlay store using orderRefId
        const overlayOrder = overlayStore.getByOrderId(slot.orderRefId!);

        // Determine order status based on payment status
        const orderStatus: Order['status'] = slot.paymentStatus === 'unpaid' ? 'unpaid' : 'in-progress';

        return {
          id: slot.orderRefId!, // ✅ Use actual order ID from slot
          slotId: slot.id,
          customerName: overlayOrder?.customer?.name || 'Processing', // Get real customer name
          customerPhone: overlayOrder?.customer?.phone || undefined,
          orderNumber: slot.orderRefId!, // ✅ Use actual order ID (sequential format like 0001, 0002)
          orderType: slot.orderType as 'dine-in' | 'take-away' | 'delivery',
          paymentMethod: (slot.paymentMethod as 'cash' | 'card' | 'online') || overlayOrder?.paymentMethod as any || 'cash',
          placedAt: overlayOrder?.placedAt ? new Date(overlayOrder.placedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : (slot.startTime ? new Date(slot.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : 'Processing'),
          elapsedTime: slot.elapsedTime || '00:00',
          timeStatus: slot.timeStatus || 'fresh',
          itemCount: overlayOrder?.items?.length || 0, // Get real item count
          status: orderStatus,
          priority: 'normal' as const,
          total: overlayOrder?.total || 0, // Get real total
          subtotal: overlayOrder?.subtotal || 0,
          tax: overlayOrder?.tax || 0,
          orderDetails: overlayOrder?.items || [], // Get real order items
          specialInstructions: overlayOrder?.specialInstructions,
          syncStatus: overlayOrder?.syncStatus // Include sync status
        };
      });

    // 2. Load completed orders from overlays (NO DATE FILTER - show all completed orders)
    const allOverlays = Object.values(overlays);
    console.log(`📊 [ORDER MANAGEMENT] Total overlays: ${allOverlays.length}`, allOverlays.map(o => ({ id: o.id, status: o.status, paymentStatus: o.paymentStatus })));

    const completedOrders: Order[] = allOverlays
      .filter(overlay => {
        // 🏆 BULLETPROOF: Show all completed orders regardless of payment status
        // This includes pay-later orders that were completed
        const isCompleted = overlay.status === 'completed';
        if (isCompleted) {
          console.log(`✅ [ORDER MANAGEMENT] Found completed order:`, { id: overlay.id, status: overlay.status, paymentStatus: overlay.paymentStatus });
        }
        return isCompleted;
      })
      .map(overlay => ({
        id: overlay.id,
        slotId: overlay.slotId,
        customerName: overlay.customer?.name || 'Completed',
        customerPhone: overlay.customer?.phone || undefined,
        orderNumber: overlay.id,
        orderType: overlay.orderType as 'dine-in' | 'take-away' | 'delivery',
        paymentMethod: (overlay.paymentMethod as 'cash' | 'card' | 'online') || 'cash',
        placedAt: overlay.placedAt ? new Date(overlay.placedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '',
        completedAt: overlay.updatedAt ? new Date(overlay.updatedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : undefined,
        elapsedTime: '00:00', // Completed orders don't need elapsed time
        timeStatus: 'fresh' as const,
        itemCount: overlay.items?.length || 0,
        status: 'completed' as const,
        priority: 'normal' as const,
        total: overlay.total || 0,
        subtotal: overlay.subtotal || 0,
        tax: overlay.tax || 0,
        orderDetails: overlay.items || [],
        specialInstructions: overlay.specialInstructions,
        syncStatus: overlay.syncStatus // Include sync status for badges
      }));

    // 3. 🏆 BULLETPROOF: Combine and de-duplicate by order ID
    // Use a Map to ensure each order ID appears only once (completed takes priority)
    const orderMap = new Map<string, Order>();

    // Add processing orders first
    processingOrders.forEach(order => {
      orderMap.set(order.id, order);
    });

    // Add completed orders (overwrites processing if duplicate)
    completedOrders.forEach(order => {
      orderMap.set(order.id, order);
    });

    const allOrders = Array.from(orderMap.values());

    console.log(`📊 [ORDER MANAGEMENT] Loaded ${processingOrders.length} processing + ${completedOrders.length} completed = ${allOrders.length} unique orders (de-duplicated)`);

    return allOrders;
  }, [dineInSlots, takeAwaySlots, deliverySlots, overlays]); // React to overlays changes

  // COMPLETELY REMOVE useEffect - direct assignment to prevent render loops
  // The orders will be returned directly from filteredOrders which uses processedOrders

  // Advanced filtering logic
  const filteredOrders = useMemo(() => {
    let filtered = [...processedOrders];

    // Text search (customer name, order number, slot ID)
    if (state.filters.searchQuery) {
      const query = state.filters.searchQuery.toLowerCase();
      filtered = filtered.filter(order =>
        order.customerName.toLowerCase().includes(query) ||
        order.orderNumber.includes(query) ||
        order.slotId.toLowerCase().includes(query) ||
        order.customerPhone?.includes(query)
      );
    }

    // Status filter
    if (state.filters.statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === state.filters.statusFilter);
    }

    // Order type filter
    if (state.filters.orderTypeFilter !== 'all') {
      filtered = filtered.filter(order => order.orderType === state.filters.orderTypeFilter);
    }

    // Payment method filter
    if (state.filters.paymentMethodFilter !== 'all') {
      filtered = filtered.filter(order => order.paymentMethod === state.filters.paymentMethodFilter);
    }

    // Priority filter
    if (state.filters.priorityFilter !== 'all') {
      filtered = filtered.filter(order => order.priority === state.filters.priorityFilter);
    }

    // Date range filter
    if (state.filters.dateRangeFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      filtered = filtered.filter(order => {
        const orderDate = new Date(order.placedAt);

        switch (state.filters.dateRangeFilter) {
          case 'today':
            return orderDate >= today;
          case 'yesterday':
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            return orderDate >= yesterday && orderDate < today;
          case 'week':
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            return orderDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(today);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            return orderDate >= monthAgo;
          case 'custom':
            if (state.filters.customDateFrom && state.filters.customDateTo) {
              return orderDate >= state.filters.customDateFrom && orderDate <= state.filters.customDateTo;
            }
            return true;
          default:
            return true;
        }
      });
    }

    // Amount range filter
    if (state.filters.minAmount !== undefined) {
      filtered = filtered.filter(order => order.total >= state.filters.minAmount!);
    }
    if (state.filters.maxAmount !== undefined) {
      filtered = filtered.filter(order => order.total <= state.filters.maxAmount!);
    }

    // 🏆 PROFESSIONAL SORTING: Processing orders first, then completed (newest first within each group)
    filtered.sort((a, b) => {
      // 1. Priority: Processing/unpaid orders ALWAYS come before completed orders
      const statusPriority: Record<string, number> = { 'unpaid': 0, 'in-progress': 1, 'completed': 2 };
      const aPriority = statusPriority[a.status] ?? 99;
      const bPriority = statusPriority[b.status] ?? 99;

      if (aPriority !== bPriority) {
        return aPriority - bPriority; // Lower priority number comes first
      }

      // 2. Within same status group, sort by user's selected sort field
      let aValue: string | number, bValue: string | number;

      switch (state.sortBy) {
        case 'placedAt':
          aValue = new Date(a.placedAt).getTime();
          bValue = new Date(b.placedAt).getTime();
          break;
        case 'total':
          aValue = a.total;
          bValue = b.total;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'priority':
          const priorityOrder = { urgent: 3, high: 2, normal: 1 };
          aValue = priorityOrder[a.priority];
          bValue = priorityOrder[b.priority];
          break;
        default:
          return 0;
      }

      if (state.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [processedOrders, state.filters, state.sortBy, state.sortOrder]);

  // Get counts for tabs
  const tabCounts = useMemo(() => ({
    all: processedOrders.length,
    pending: processedOrders.filter(o => o.status === 'pending').length,
    'in-progress': processedOrders.filter(o => o.status === 'in-progress').length,
    unpaid: processedOrders.filter(o => o.status === 'unpaid').length,
    ready: processedOrders.filter(o => o.status === 'ready').length,
    completed: processedOrders.filter(o => o.status === 'completed').length,
    cancelled: processedOrders.filter(o => o.status === 'cancelled').length
  }), [processedOrders]);

  // FIXED: Event handlers using setState directly to prevent circular dependencies
  const handleFilterChange = useCallback((filterUpdates: Partial<OrderFilters>) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, ...filterUpdates }
    }));
  }, []);

  const handleSortChange = useCallback((sortBy: OrderManagementState['sortBy'], sortOrder?: OrderManagementState['sortOrder']) => {
    setState(prev => ({
      ...prev,
      sortBy,
      sortOrder: sortOrder || (prev.sortBy === sortBy && prev.sortOrder === 'desc' ? 'asc' : 'desc')
    }));
  }, []);

  const handleOrderSelect = useCallback((orderId: string, selected: boolean) => {
    setState(prev => {
      const newSelectedOrders = new Set(prev.selectedOrders);
      if (selected) {
        newSelectedOrders.add(orderId);
      } else {
        newSelectedOrders.delete(orderId);
      }
      return { ...prev, selectedOrders: newSelectedOrders };
    });
  }, []);

  const handleSelectAll = useCallback((selected: boolean) => {
    setState(prev => ({
      ...prev,
      selectedOrders: selected ? new Set(filteredOrders.map(o => o.id)) : new Set()
    }));
  }, [filteredOrders]);

  const handleOrderDoubleClick = useCallback((order: Order) => {
    setState(prev => ({
      ...prev,
      selectedOrder: order,
      isOrderOverlayOpen: true
    }));
  }, []);

  const handleCloseOrderOverlay = useCallback(() => {
    setState(prev => ({
      ...prev,
      isOrderOverlayOpen: false,
      selectedOrder: null
    }));
  }, []);

  // FIXED: Order operations using setState directly
  const handleCompleteOrder = useCallback(async (orderId?: string) => {
    const order = orderId ? processedOrders.find(o => o.id === orderId) : state.selectedOrder;
    if (!order) return;

    try {
      await slotActions.setSlotCompleted(order.slotId);
      await slotActions.setSlotAvailable(order.slotId);

      // Close overlay
      setState(prev => ({
        ...prev,
        isOrderOverlayOpen: false,
        selectedOrder: null
      }));
    } catch (error) {
      console.error('Failed to complete order:', error);
    }
  }, [processedOrders, state.selectedOrder, slotActions]);

  const handleBulkComplete = useCallback(async () => {
    const selectedOrderIds = Array.from(state.selectedOrders);
    const promises = selectedOrderIds.map(orderId => handleCompleteOrder(orderId));

    try {
      await Promise.all(promises);
      setState(prev => ({ ...prev, selectedOrders: new Set() }));
    } catch (error) {
      console.error('Failed to bulk complete orders:', error);
    }
  }, [state.selectedOrders, handleCompleteOrder]);

  const handleCancelOrder = useCallback(async (orderId: string) => {
    const order = processedOrders.find(o => o.id === orderId);
    if (!order) return;

    try {
      await slotActions.setSlotAvailable(order.slotId);

      // Order will be updated via processedOrders automatically
    } catch (error) {
      console.error('Failed to cancel order:', error);
    }
  }, [processedOrders, slotActions]);

  const handleRefreshOrders = useCallback(() => {
    setState(prev => ({ ...prev, isLoading: true }));
    // Orders will refresh automatically via processedOrders useMemo
  }, []);

  return {
    // State
    orders: filteredOrders,
    selectedOrders: state.selectedOrders,
    selectedOrder: state.selectedOrder,
    isOrderOverlayOpen: state.isOrderOverlayOpen,
    isLoading: state.isLoading,
    filters: state.filters,
    sortBy: state.sortBy,
    sortOrder: state.sortOrder,
    tabCounts,

    // Actions
    handleFilterChange,
    handleSortChange,
    handleOrderSelect,
    handleSelectAll,
    handleOrderDoubleClick,
    handleCloseOrderOverlay,
    handleBulkComplete,
    handleCancelOrder,
    handleRefreshOrders
  };
};