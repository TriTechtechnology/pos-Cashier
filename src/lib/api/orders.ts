/**
 * POS Orders API Service
 *
 * PURPOSE: Place POS orders to backend
 * Endpoint: POST /t/pos/orders
 *
 * FEATURES:
 * - Offline-first order placement
 * - Backend sync when online
 * - Order tracking with till sessions
 *
 * LINKS WITH:
 * - Cart Store: Gets order items and customer info
 * - Auth Store: Gets branchId, posId, and authentication token
 * - Till Store: Gets active tillSessionId
 * - Order Overlay Store: Persists orders in IndexedDB
 */

import { APIResponse } from './index';
import { CartItem } from '@/lib/store/cart-new';
import { generateOrderNumber } from '@/lib/utils/posUtils';
import { getAuthToken } from './auth';

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  totalPrice: number;
  modifiers?: {
    variations?: Array<{ id: string; name: string; price: number }>;
    addOns?: Array<{ id: string; name: string; price: number }>;
    specialInstructions?: string;
    notes?: string;
  };
}

export interface Order {
  id: string;
  slotId: string;
  orderType: 'dine-in' | 'take-away' | 'delivery';
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  customer?: {
    name?: string;
    phone?: string;
    email?: string;
    specialInstructions?: string;
  };
  paymentStatus: 'pending' | 'paid' | 'refunded';
  paymentMethod?: string;
  transactionId?: string;
  createdAt: Date;
  updatedAt: Date;
  estimatedCompletionTime?: Date;
  kitchenNotes?: string;
  priority: 'normal' | 'high' | 'urgent';
}

export interface CreateOrderRequest {
  slotId: string;
  orderType: 'dine-in' | 'take-away' | 'delivery';
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  customer?: {
    name?: string;
    phone?: string;
    email?: string;
    specialInstructions?: string;
  };
  paymentStatus: 'paid';
  paymentMethod: string;
  transactionId: string;
}

export interface UpdateOrderRequest {
  status?: Order['status'];
  kitchenNotes?: string;
  priority?: Order['priority'];
  estimatedCompletionTime?: Date;
}

// Backend API Types
export interface PlaceOrderAPIRequest {
  branchId: string;
  posId: string;
  tillSessionId: string;
  customerName?: string;
  notes?: string;
  items: Array<{
    menuItemId: string;
    quantity: number;
    notes?: string;
  }>;
  paymentMethod: 'cash' | 'card' | 'online';  // NEW: Payment method (affects tax: cash=5%, card=16%)
  amountPaid: number;                          // NEW: Total amount paid by customer
}

export interface PlaceOrderAPIResponse {
  success: boolean;
  orderId?: string;
  order?: any; // Backend order object
  error?: string;
  message?: string;
}

/**
 * Place a POS order to the backend
 *
 * @param request - Order data with items and customer info
 * @returns Order confirmation from backend
 */
export async function placeOrder(request: PlaceOrderAPIRequest): Promise<PlaceOrderAPIResponse> {
  try {
    const tenantId = process.env.NEXT_PUBLIC_TENANT_ID || 'extraction';
    const token = getAuthToken();

    console.log('🛍️ [ORDERS API] ===== ORDER PLACEMENT START =====');
    console.log('🔍 [ORDERS API] Token retrieved:', token ? `${token.substring(0, 30)}... (length: ${token.length})` : 'NULL');

    // 🎯 VALIDATION: Check all required fields
    if (!token) {
      console.error('❌ [ORDERS API] Missing authentication token');
      console.error('❌ [ORDERS API] Check localStorage for auth-token or pos-auth-storage');
      return {
        success: false,
        error: 'No authentication token',
        message: 'Please log in first',
      };
    }

    if (!request.branchId) {
      console.error('❌ [ORDERS API] Missing branchId in request');
      return {
        success: false,
        error: 'Missing branchId',
        message: 'Branch ID is required',
      };
    }

    if (!request.posId) {
      console.error('❌ [ORDERS API] Missing posId in request');
      return {
        success: false,
        error: 'Missing posId',
        message: 'POS terminal ID is required. Please ensure POS terminal is selected during login.',
      };
    }

    if (!request.tillSessionId) {
      console.error('❌ [ORDERS API] Missing tillSessionId in request');
      return {
        success: false,
        error: 'Missing tillSessionId',
        message: 'Till session ID is required. Please ensure till is open.',
      };
    }

    if (!request.items || request.items.length === 0) {
      console.error('❌ [ORDERS API] No items in order');
      return {
        success: false,
        error: 'No items in order',
        message: 'Order must have at least one item',
      };
    }

    // 🔄 Use Next.js API route proxy to avoid CORS issues
    const endpoint = '/api/pos/orders';

    console.log('🛍️ [ORDERS API] Placing order...', {
      endpoint,
      branchId: request.branchId,
      posId: request.posId,
      tillSessionId: request.tillSessionId,
      itemCount: request.items.length,
      customerName: request.customerName,
      hasNotes: !!request.notes
    });

    // 🔍 DEBUG: Log complete request payload
    console.log('📤 [ORDERS API] Request payload:', JSON.stringify(request, null, 2));

    // Prepare headers
    const headers = {
      'Content-Type': 'application/json',
      'x-tenant-id': tenantId,
      'Authorization': `Bearer ${token}`,
    };

    console.log('📋 [ORDERS API] Request headers:', {
      'Content-Type': headers['Content-Type'],
      'x-tenant-id': headers['x-tenant-id'],
      'Authorization': headers['Authorization'] ? `${headers['Authorization'].substring(0, 20)}...` : 'MISSING'
    });

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    });

    console.log('📡 [ORDERS API] Response status:', response.status, response.statusText);

    const data = await response.json();

    // 🔍 DEBUG: Log complete response
    console.log('📥 [ORDERS API] Response data:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error('❌ [ORDERS API] Failed to place order:', {
        status: response.status,
        statusText: response.statusText,
        error: data.message || data.error,
        data
      });
      return {
        success: false,
        error: data.message || data.error || 'Failed to place order',
        message: data.message || 'Unable to place order',
      };
    }

    console.log('✅ [ORDERS API] Order placed successfully');

    // Extract order ID from backend response
    const orderId = data.result?.orderId || data.orderId || data.result?.id || data.id;

    console.log('🆔 [ORDERS API] Extracted order ID:', orderId);
    console.log('🛍️ [ORDERS API] ===== ORDER PLACEMENT END =====');

    return {
      success: true,
      orderId,
      order: data.result || data,
    };
  } catch (error) {
    console.error('❌ [ORDERS API] Network error:', error);
    console.error('❌ [ORDERS API] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error occurred',
      message: 'Unable to connect to server. Please check your internet connection.',
    };
  }
}

/**
 * Mock order placement for development/testing
 *
 * ⚠️ WARNING: ONLY USE IN DEVELOPMENT!
 */
export async function placeOrderMock(request: PlaceOrderAPIRequest): Promise<PlaceOrderAPIResponse> {
  console.warn('🧪 [ORDERS API] ⚠️ USING MOCK ORDER PLACEMENT - NOT FOR PRODUCTION!');

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  return {
    success: true,
    orderId: `mock-order-${Date.now()}`,
    order: {
      id: `mock-order-${Date.now()}`,
      branchId: request.branchId,
      posId: request.posId,
      tillSessionId: request.tillSessionId,
      customerName: request.customerName || 'Walk-in',
      items: request.items,
      status: 'pending',
      createdAt: new Date().toISOString(),
    },
  };
}

// Mock orders data
const mockOrders: Order[] = [
  {
    id: 'ORD001',
    slotId: '1',
    orderType: 'dine-in',
    status: 'processing',
    items: [
      {
        id: 'ITEM001',
        name: 'Chicken Biryani',
        quantity: 2,
        price: 500,
        totalPrice: 1000,
        modifiers: {
          specialInstructions: 'Extra spicy'
        }
      },
      {
        id: 'ITEM002',
        name: 'Raita',
        quantity: 1,
        price: 100,
        totalPrice: 100
      }
    ],
    subtotal: 1100,
    tax: 165,
    total: 1265,
    customer: {
      name: 'John Doe',
      phone: '03001234567',
      specialInstructions: 'Extra spicy biryani'
    },
    paymentStatus: 'paid',
    paymentMethod: 'cash',
    transactionId: 'TXN001',
    createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    updatedAt: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
    estimatedCompletionTime: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes from now
    priority: 'normal'
  }
];

export const ordersAPI = {
  // Create new order
  createOrder: async (orderData: CreateOrderRequest): Promise<APIResponse<Order>> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newOrder: Order = {
      id: generateOrderNumber(),
      slotId: orderData.slotId,
      orderType: orderData.orderType,
      status: 'pending',
      items: orderData.items.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        totalPrice: item.totalPrice,
        modifiers: item.modifiers
      })),
      subtotal: orderData.subtotal,
      tax: orderData.tax,
      total: orderData.total,
      customer: orderData.customer,
      paymentStatus: orderData.paymentStatus,
      paymentMethod: orderData.paymentMethod,
      transactionId: orderData.transactionId,
      createdAt: new Date(),
      updatedAt: new Date(),
      priority: 'normal'
    };
    
    mockOrders.push(newOrder);
    
    return {
      success: true,
      data: newOrder,
      message: 'Order created successfully'
    };
  },

  // Get order by ID
  getOrder: async (orderId: string): Promise<APIResponse<Order>> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const order = mockOrders.find(o => o.id === orderId);
    
    if (!order) {
      return {
        success: false,
        data: null,
        message: 'Order not found',
        error: 'Order not found'
      };
    }
    
    return {
      success: true,
      data: order,
      message: 'Order retrieved successfully'
    };
  },

  // Get orders by slot ID
  getOrdersBySlot: async (slotId: string): Promise<APIResponse<Order[]>> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const orders = mockOrders.filter(o => o.slotId === slotId);
    
    return {
      success: true,
      data: orders,
      message: 'Orders retrieved successfully'
    };
  },

  // Get all orders
  getAllOrders: async (): Promise<APIResponse<Order[]>> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    return {
      success: true,
      data: [...mockOrders],
      message: 'All orders retrieved successfully'
    };
  },

  // Update order
  updateOrder: async (orderId: string, updates: UpdateOrderRequest): Promise<APIResponse<Order>> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const orderIndex = mockOrders.findIndex(o => o.id === orderId);
    
    if (orderIndex === -1) {
      return {
        success: false,
        data: null,
        message: 'Order not found',
        error: 'Order not found'
      };
    }
    
    const updatedOrder: Order = {
      ...mockOrders[orderIndex],
      ...updates,
      updatedAt: new Date()
    };
    
    mockOrders[orderIndex] = updatedOrder;
    
    return {
      success: true,
      data: updatedOrder,
      message: 'Order updated successfully'
    };
  },

  // Update order status
  updateOrderStatus: async (orderId: string, status: Order['status']): Promise<APIResponse<Order>> => {
    return ordersAPI.updateOrder(orderId, { status });
  },

  // Add kitchen notes
  addKitchenNotes: async (orderId: string, notes: string): Promise<APIResponse<Order>> => {
    return ordersAPI.updateOrder(orderId, { kitchenNotes: notes });
  },

  // Set order priority
  setOrderPriority: async (orderId: string, priority: Order['priority']): Promise<APIResponse<Order>> => {
    return ordersAPI.updateOrder(orderId, { priority });
  },

  // Set estimated completion time
  setEstimatedCompletionTime: async (orderId: string, time: Date): Promise<APIResponse<Order>> => {
    return ordersAPI.updateOrder(orderId, { estimatedCompletionTime: time });
  },

  // Cancel order
  cancelOrder: async (orderId: string): Promise<APIResponse<Order>> => {
    return ordersAPI.updateOrder(orderId, { status: 'cancelled' });
  },

  // Complete order
  completeOrder: async (orderId: string): Promise<APIResponse<Order>> => {
    return ordersAPI.updateOrder(orderId, { status: 'completed' });
  },

  // Get orders by status
  getOrdersByStatus: async (status: Order['status']): Promise<APIResponse<Order[]>> => {
    await new Promise(resolve => setTimeout(resolve, 250));
    
    const orders = mockOrders.filter(o => o.status === status);
    
    return {
      success: true,
      data: orders,
      message: `Orders with status '${status}' retrieved successfully`
    };
  },

  // Get orders by priority
  getOrdersByPriority: async (priority: Order['priority']): Promise<APIResponse<Order[]>> => {
    await new Promise(resolve => setTimeout(resolve, 250));
    
    const orders = mockOrders.filter(o => o.priority === priority);
    
    return {
      success: true,
      data: orders,
      message: `Orders with priority '${priority}' retrieved successfully`
    };
  },

  // Delete order (for cleanup)
  deleteOrder: async (orderId: string): Promise<APIResponse<boolean>> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const orderIndex = mockOrders.findIndex(o => o.id === orderId);
    
    if (orderIndex === -1) {
      return {
        success: false,
        data: false,
        message: 'Order not found',
        error: 'Order not found'
      };
    }
    
    mockOrders.splice(orderIndex, 1);
    
    return {
      success: true,
      data: true,
      message: 'Order deleted successfully'
    };
  }
};
