/**
 * KDS (Kitchen Display System) API Integration
 *
 * PURPOSE: Manages communication between POS and KDS for order status updates.
 * Handles order state transitions (in-progress → pending → ready → completed).
 *
 * LINKS WITH:
 * - Order Management: Real-time status updates
 * - Unified Slot System: Slot status synchronization
 * - Admin Backend: Business rule configuration
 *
 * WHY: Separates kitchen operations from POS operations while maintaining sync.
 * Enables pending/ready status management that's controlled by kitchen staff.
 */

import { API_CONFIG, type APIResponse } from './index';

// KDS-specific order statuses
export type KDSOrderStatus = 'received' | 'in-preparation' | 'ready' | 'completed' | 'cancelled';

// KDS order interface
export interface KDSOrder {
  id: string;
  orderId: string; // Matches POS order number
  slotId: string;
  status: KDSOrderStatus;
  priority: 'normal' | 'high' | 'urgent';
  customerName: string;
  orderType: 'dine-in' | 'take-away' | 'delivery';
  items: KDSOrderItem[];
  specialInstructions?: string;
  estimatedTime?: number; // Minutes
  actualTime?: number; // Minutes taken
  receivedAt: Date;
  startedAt?: Date;
  readyAt?: Date;
  completedAt?: Date;
  kitchenNotes?: string;
}

export interface KDSOrderItem {
  id: string;
  name: string;
  quantity: number;
  modifiers?: {
    variations?: Array<{ id: string; name: string }>;
    addOns?: Array<{ id: string; name: string }>;
    specialInstructions?: string;
  };
  kitchenNotes?: string;
  isReady?: boolean; // Individual item ready status
}

// KDS status update request
export interface KDSStatusUpdate {
  orderId: string;
  status: KDSOrderStatus;
  estimatedTime?: number;
  kitchenNotes?: string;
  timestamp: Date;
}

// KDS configuration from admin
export interface KDSConfig {
  enabled: boolean;
  endpoint: string;
  apiKey: string;
  autoAcceptOrders: boolean;
  defaultEstimatedTime: number; // Minutes
  statusUpdateInterval: number; // Seconds
  priorities: {
    enabled: boolean;
    autoEscalate: boolean;
    escalationTime: number; // Minutes
  };
  notifications: {
    sound: boolean;
    volume: number;
    newOrderSound: string;
    readyOrderSound: string;
  };
}

// Mock KDS orders for development
const mockKDSOrders: KDSOrder[] = [
  {
    id: 'kds-001',
    orderId: '12345678',
    slotId: 'D1',
    status: 'in-preparation',
    priority: 'normal',
    customerName: 'John Doe',
    orderType: 'dine-in',
    items: [
      {
        id: 'item-001',
        name: 'Americano',
        quantity: 2,
        modifiers: {
          variations: [{ id: 'size-l', name: 'Large' }],
          addOns: [{ id: 'extra-shot', name: 'Extra Shot' }]
        },
        isReady: false
      }
    ],
    receivedAt: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
    startedAt: new Date(Date.now() - 3 * 60 * 1000), // 3 minutes ago
    estimatedTime: 8
  },
  {
    id: 'kds-002',
    orderId: '87654321',
    slotId: 'T2',
    status: 'ready',
    priority: 'high',
    customerName: 'Sarah Smith',
    orderType: 'take-away',
    items: [
      {
        id: 'item-002',
        name: 'Latte',
        quantity: 1,
        isReady: true
      }
    ],
    receivedAt: new Date(Date.now() - 12 * 60 * 1000), // 12 minutes ago
    startedAt: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
    readyAt: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
    estimatedTime: 10,
    actualTime: 8
  }
];

// Mock KDS configuration
const mockKDSConfig: KDSConfig = {
  enabled: true,
  endpoint: 'http://localhost:3001/api/kds',
  apiKey: 'mock-kds-api-key',
  autoAcceptOrders: true,
  defaultEstimatedTime: 15,
  statusUpdateInterval: 30,
  priorities: {
    enabled: true,
    autoEscalate: true,
    escalationTime: 20
  },
  notifications: {
    sound: true,
    volume: 0.7,
    newOrderSound: 'new-order.mp3',
    readyOrderSound: 'order-ready.mp3'
  }
};

/**
 * KDS API Functions
 * Provides integration with Kitchen Display System
 */
export const kdsAPI = {
  /**
   * Send new order to KDS
   */
  sendOrder: async (orderData: Omit<KDSOrder, 'id' | 'receivedAt' | 'status'>): Promise<APIResponse<KDSOrder>> => {
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay

    if (API_CONFIG.mode === 'mock') {
      const newOrder: KDSOrder = {
        ...orderData,
        id: `kds-${Date.now()}`,
        status: 'received',
        receivedAt: new Date()
      };

      mockKDSOrders.push(newOrder);

      return {
        success: true,
        data: newOrder,
        message: 'Order sent to kitchen successfully'
      };
    }

    // Real API implementation
    const response = await fetch(`${API_CONFIG.baseUrl}/kds/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_KDS_API_KEY}`
      },
      body: JSON.stringify(orderData)
    });

    if (!response.ok) {
      throw new Error('Failed to send order to KDS');
    }

    return await response.json();
  },

  /**
   * Get KDS order status
   */
  getOrderStatus: async (orderId: string): Promise<APIResponse<KDSOrder>> => {
    await new Promise(resolve => setTimeout(resolve, 200));

    if (API_CONFIG.mode === 'mock') {
      const order = mockKDSOrders.find(o => o.orderId === orderId);

      if (!order) {
        return {
          success: false,
          data: null,
          error: 'Order not found in KDS',
          message: 'Order not found'
        };
      }

      return {
        success: true,
        data: order
      };
    }

    // Real API implementation
    const response = await fetch(`${API_CONFIG.baseUrl}/kds/orders/${orderId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_KDS_API_KEY}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to get order status from KDS');
    }

    return await response.json();
  },

  /**
   * Get all active KDS orders
   */
  getActiveOrders: async (): Promise<APIResponse<KDSOrder[]>> => {
    await new Promise(resolve => setTimeout(resolve, 300));

    if (API_CONFIG.mode === 'mock') {
      const activeOrders = mockKDSOrders.filter(order =>
        order.status !== 'completed' && order.status !== 'cancelled'
      );

      return {
        success: true,
        data: activeOrders
      };
    }

    // Real API implementation
    const response = await fetch(`${API_CONFIG.baseUrl}/kds/orders/active`, {
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_KDS_API_KEY}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to get active orders from KDS');
    }

    return await response.json();
  },

  /**
   * Update order status (called by KDS)
   */
  updateOrderStatus: async (update: KDSStatusUpdate): Promise<APIResponse<KDSOrder>> => {
    await new Promise(resolve => setTimeout(resolve, 200));

    if (API_CONFIG.mode === 'mock') {
      const orderIndex = mockKDSOrders.findIndex(o => o.orderId === update.orderId);

      if (orderIndex === -1) {
        return {
          success: false,
          data: null,
          error: 'Order not found',
          message: 'Order not found in KDS'
        };
      }

      const order = mockKDSOrders[orderIndex];
      const now = new Date();

      // Update order status and timestamps
      const updatedOrder: KDSOrder = {
        ...order,
        status: update.status,
        kitchenNotes: update.kitchenNotes || order.kitchenNotes,
        estimatedTime: update.estimatedTime || order.estimatedTime
      };

      // Set appropriate timestamps
      switch (update.status) {
        case 'in-preparation':
          updatedOrder.startedAt = now;
          break;
        case 'ready':
          updatedOrder.readyAt = now;
          if (updatedOrder.startedAt) {
            updatedOrder.actualTime = Math.round((now.getTime() - updatedOrder.startedAt.getTime()) / 60000);
          }
          break;
        case 'completed':
          updatedOrder.completedAt = now;
          break;
      }

      mockKDSOrders[orderIndex] = updatedOrder;

      return {
        success: true,
        data: updatedOrder,
        message: `Order status updated to ${update.status}`
      };
    }

    // Real API implementation
    const response = await fetch(`${API_CONFIG.baseUrl}/kds/orders/${update.orderId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_KDS_API_KEY}`
      },
      body: JSON.stringify(update)
    });

    if (!response.ok) {
      throw new Error('Failed to update order status in KDS');
    }

    return await response.json();
  },

  /**
   * Get KDS configuration
   */
  getConfig: async (): Promise<APIResponse<KDSConfig>> => {
    await new Promise(resolve => setTimeout(resolve, 200));

    if (API_CONFIG.mode === 'mock') {
      return {
        success: true,
        data: mockKDSConfig
      };
    }

    // Real API implementation
    const response = await fetch(`${API_CONFIG.baseUrl}/kds/config`, {
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_KDS_API_KEY}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to get KDS configuration');
    }

    return await response.json();
  },

  /**
   * Subscribe to KDS status updates (WebSocket/SSE)
   */
  subscribeToUpdates: (onUpdate: (order: KDSOrder) => void, onError?: (error: Error) => void) => {
    if (API_CONFIG.mode === 'mock') {
      // Mock real-time updates for development
      const interval = setInterval(() => {
        // Randomly update an order status for testing
        const activeOrders = mockKDSOrders.filter(o => o.status !== 'completed');
        if (activeOrders.length > 0) {
          const randomOrder = activeOrders[Math.floor(Math.random() * activeOrders.length)];

          // Progress order status
          if (randomOrder.status === 'received' && Math.random() > 0.7) {
            randomOrder.status = 'in-preparation';
            randomOrder.startedAt = new Date();
            onUpdate(randomOrder);
          } else if (randomOrder.status === 'in-preparation' && Math.random() > 0.8) {
            randomOrder.status = 'ready';
            randomOrder.readyAt = new Date();
            onUpdate(randomOrder);
          }
        }
      }, 10000); // Check every 10 seconds

      return () => clearInterval(interval);
    }

    // Real WebSocket implementation
    const ws = new WebSocket(`${API_CONFIG.baseUrl.replace('http', 'ws')}/kds/updates`);

    ws.onmessage = (event) => {
      try {
        const order: KDSOrder = JSON.parse(event.data);
        onUpdate(order);
      } catch (error) {
        onError?.(new Error('Failed to parse KDS update'));
      }
    };

    ws.onerror = () => {
      onError?.(new Error('KDS WebSocket connection error'));
    };

    return () => {
      ws.close();
    };
  }
};

// Export types for use in other modules
export type {
  KDSOrder as KDSOrderType,
  KDSOrderItem as KDSOrderItemType,
  KDSStatusUpdate as KDSStatusUpdateType,
  KDSConfig as KDSConfigType,
  KDSOrderStatus as KDSOrderStatusType
};