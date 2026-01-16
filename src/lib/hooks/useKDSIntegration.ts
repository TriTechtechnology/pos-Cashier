/**
 * useKDSIntegration Hook - KDS Integration for Orders Management
 *
 * PURPOSE: Provides real-time integration with Kitchen Display System.
 * Handles order status synchronization between POS and KDS.
 *
 * LINKS WITH:
 * - useOrderManagement: Order status updates
 * - KDS API: Kitchen communication
 * - Unified Slot System: Status synchronization
 *
 * WHY: Centralizes KDS integration logic and provides real-time updates
 * for pending/ready order statuses controlled by kitchen staff.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { kdsAPI, type KDSOrder, type KDSOrderStatus, type KDSConfig } from '@/lib/api/kds';
import { useSafeSlotActions } from '@/lib/store/unified-integration-wrapper';

export interface KDSIntegrationState {
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  config: KDSConfig | null;
  activeOrders: KDSOrder[];
  lastUpdate: Date | null;
}

export interface KDSOrderStatusMapping {
  'received': 'pending';
  'in-preparation': 'in-progress';
  'ready': 'ready';
  'completed': 'completed';
  'cancelled': 'cancelled';
}

// Map KDS statuses to POS order statuses
const mapKDSStatusToPOS = (kdsStatus: KDSOrderStatus): 'pending' | 'in-progress' | 'ready' | 'completed' | 'cancelled' => {
  const mapping: KDSOrderStatusMapping = {
    'received': 'pending',
    'in-preparation': 'in-progress',
    'ready': 'ready',
    'completed': 'completed',
    'cancelled': 'cancelled'
  };
  return mapping[kdsStatus];
};

export const useKDSIntegration = () => {
  const [state, setState] = useState<KDSIntegrationState>({
    isConnected: false,
    isLoading: true,
    error: null,
    config: null,
    activeOrders: [],
    lastUpdate: null
  });

  const slotActions = useSafeSlotActions();
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Initialize KDS connection
  const initializeKDS = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Get KDS configuration
      const configResponse = await kdsAPI.getConfig();
      if (!configResponse.success) {
        throw new Error(configResponse.error || 'Failed to get KDS configuration');
      }

      const config = configResponse.data!;

      // Check if KDS is enabled
      if (!config.enabled) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          isConnected: false,
          config,
          error: 'KDS is disabled in configuration'
        }));
        return;
      }

      // Get active orders
      const ordersResponse = await kdsAPI.getActiveOrders();
      if (!ordersResponse.success) {
        throw new Error(ordersResponse.error || 'Failed to get active orders');
      }

      setState(prev => ({
        ...prev,
        isLoading: false,
        isConnected: true,
        config,
        activeOrders: ordersResponse.data!,
        lastUpdate: new Date()
      }));

      console.log('✅ [KDS] Connected successfully', {
        endpoint: config.endpoint,
        activeOrders: ordersResponse.data!.length
      });

    } catch (error) {
      console.error('❌ [KDS] Failed to initialize:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        isConnected: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  }, []);

  // Subscribe to real-time updates
  const subscribeToUpdates = useCallback(() => {
    if (!state.isConnected || !state.config) return;

    console.log('🔔 [KDS] Subscribing to real-time updates...');

    const unsubscribe = kdsAPI.subscribeToUpdates(
      (updatedOrder: KDSOrder) => {
        console.log('📡 [KDS] Received order update:', {
          orderId: updatedOrder.orderId,
          status: updatedOrder.status,
          slotId: updatedOrder.slotId
        });

        // Update active orders list
        setState(prev => ({
          ...prev,
          activeOrders: prev.activeOrders.map(order =>
            order.orderId === updatedOrder.orderId ? updatedOrder : order
          ),
          lastUpdate: new Date()
        }));

        // Sync with POS slot system
        syncOrderStatusWithSlot(updatedOrder);
      },
      (error: Error) => {
        console.error('❌ [KDS] Update subscription error:', error);
        setState(prev => ({
          ...prev,
          error: error.message,
          isConnected: false
        }));
      }
    );

    unsubscribeRef.current = unsubscribe;
  }, [state.isConnected, state.config]);

  // Sync KDS order status with POS slot
  const syncOrderStatusWithSlot = useCallback(async (kdsOrder: KDSOrder) => {
    try {
      const posStatus = mapKDSStatusToPOS(kdsOrder.status);

      console.log('🔄 [KDS] Syncing status with slot:', {
        slotId: kdsOrder.slotId,
        kdsStatus: kdsOrder.status,
        posStatus
      });

      // Update slot based on status
      switch (posStatus) {
        case 'pending':
        case 'in-progress':
          // Keep slot in processing state but update internal status
          // The order management will show the correct status
          break;

        case 'ready':
          // Order is ready for pickup/serving
          console.log('🍽️ [KDS] Order ready for slot:', kdsOrder.slotId);
          break;

        case 'completed':
          // Order completed by kitchen, set slot to completed
          await slotActions.setSlotCompleted(kdsOrder.slotId);
          console.log('✅ [KDS] Order completed, slot updated:', kdsOrder.slotId);
          break;

        case 'cancelled':
          // Order cancelled, set slot to available
          await slotActions.setSlotAvailable(kdsOrder.slotId);
          console.log('❌ [KDS] Order cancelled, slot available:', kdsOrder.slotId);
          break;
      }

    } catch (error) {
      console.error('❌ [KDS] Failed to sync status with slot:', error);
    }
  }, [slotActions]);

  // Send order to KDS
  const sendOrderToKDS = useCallback(async (orderData: {
    orderId: string;
    slotId: string;
    customerName: string;
    orderType: 'dine-in' | 'take-away' | 'delivery';
    items: Array<{
      id: string;
      name: string;
      quantity: number;
      modifiers?: any;
    }>;
    specialInstructions?: string;
    priority?: 'normal' | 'high' | 'urgent';
  }) => {
    if (!state.isConnected) {
      console.warn('⚠️ [KDS] Not connected, skipping order send');
      return false;
    }

    try {
      console.log('📤 [KDS] Sending order to kitchen:', orderData.orderId);

      const response = await kdsAPI.sendOrder({
        orderId: orderData.orderId,
        slotId: orderData.slotId,
        customerName: orderData.customerName,
        orderType: orderData.orderType,
        priority: orderData.priority || 'normal',
        items: orderData.items.map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          modifiers: item.modifiers,
          isReady: false
        })),
        specialInstructions: orderData.specialInstructions
      });

      if (response.success) {
        console.log('✅ [KDS] Order sent successfully:', response.data!.id);

        // Add to active orders
        setState(prev => ({
          ...prev,
          activeOrders: [...prev.activeOrders, response.data!],
          lastUpdate: new Date()
        }));

        return true;
      } else {
        console.error('❌ [KDS] Failed to send order:', response.error);
        return false;
      }

    } catch (error) {
      console.error('❌ [KDS] Error sending order:', error);
      return false;
    }
  }, [state.isConnected]);

  // Get order status from KDS
  const getOrderStatus = useCallback(async (orderId: string): Promise<KDSOrder | null> => {
    if (!state.isConnected) return null;

    try {
      const response = await kdsAPI.getOrderStatus(orderId);
      return response.success ? response.data! : null;
    } catch (error) {
      console.error('❌ [KDS] Error getting order status:', error);
      return null;
    }
  }, [state.isConnected]);

  // Refresh active orders
  const refreshActiveOrders = useCallback(async () => {
    if (!state.isConnected) return;

    try {
      const response = await kdsAPI.getActiveOrders();
      if (response.success) {
        setState(prev => ({
          ...prev,
          activeOrders: response.data!,
          lastUpdate: new Date()
        }));
      }
    } catch (error) {
      console.error('❌ [KDS] Error refreshing orders:', error);
    }
  }, [state.isConnected]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  // Initialize on mount
  useEffect(() => {
    initializeKDS();
  }, [initializeKDS]);

  // Subscribe to updates when connected
  useEffect(() => {
    if (state.isConnected && state.config) {
      subscribeToUpdates();
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [state.isConnected, state.config, subscribeToUpdates]);

  return {
    // State
    isConnected: state.isConnected,
    isLoading: state.isLoading,
    error: state.error,
    config: state.config,
    activeOrders: state.activeOrders,
    lastUpdate: state.lastUpdate,

    // Actions
    sendOrderToKDS,
    getOrderStatus,
    refreshActiveOrders,
    initializeKDS,

    // Helpers
    mapKDSStatusToPOS
  };
};