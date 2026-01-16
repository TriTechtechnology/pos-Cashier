 /**
 * Mock Data Service
 * 
 * This service provides a clean interface for mock data that can be easily
 * replaced with real API calls when ready for deployment.
 */

import { MOCK_DATA, getMockData, validateMockData } from '../api/mockDataManager';
import { shouldUseMockData } from '../config/api';
import { generateOrderNumber } from '@/lib/utils/posUtils';

// Re-export mock data for easy access
export { MOCK_DATA, getMockData, validateMockData };

/**
 * Mock Data Service Class
 * 
 * This class provides methods that mirror real API calls but use mock data.
 * When ready for deployment, these methods can be replaced with actual HTTP calls.
 */
export class MockDataService {
  /**
   * Check if mock data should be used
   */
  static shouldUseMock(): boolean {
    return shouldUseMockData();
  }

  /**
   * Simulate API delay
   */
  private static async simulateDelay(ms: number = 200): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, ms));
  }


  /**
   * Categories API
   */
  static async getCategories() {
    await this.simulateDelay();
    return {
      success: true,
      data: MOCK_DATA.categories,
      message: 'Categories fetched successfully'
    };
  }

  static async getCategoryById(id: string) {
    await this.simulateDelay();
    const category = MOCK_DATA.categories.find(cat => cat.id === id);
    return {
      success: true,
      data: category || null,
      message: category ? 'Category fetched successfully' : 'Category not found'
    };
  }

  /**
   * Menu Items API
   */
  static async getMenuItems() {
    await this.simulateDelay();
    const allItems = MOCK_DATA.categories.flatMap(category => 
      category.items.map(item => ({ ...item, category: category.name }))
    );
    return {
      success: true,
      data: allItems,
      message: 'Menu items fetched successfully'
    };
  }

  static async getMenuItemById(id: string) {
    await this.simulateDelay();
    for (const category of MOCK_DATA.categories) {
      const item = category.items.find(item => item.id === id);
      if (item) {
        return {
          success: true,
          data: { ...item, category: category.name },
          message: 'Menu item fetched successfully'
        };
      }
    }
    return {
      success: true,
      data: null,
      message: 'Menu item not found'
    };
  }

  /**
   * Slots API
   */
  static async getSlots() {
    await this.simulateDelay();
    return {
      success: true,
      data: MOCK_DATA.slots,
      message: 'Slots fetched successfully'
    };
  }

  static async getSlotsByType(orderType: string) {
    await this.simulateDelay();
    const filteredSlots = MOCK_DATA.slots.filter(slot => 
      slot.orderType === orderType && slot.status === 'available'
    );
    return {
      success: true,
      data: filteredSlots,
      message: 'Slots fetched successfully'
    };
  }

  /**
   * Loyalty API
   */
  static async getLoyaltyCards() {
    await this.simulateDelay();
    return {
      success: true,
      data: Object.values(MOCK_DATA.loyaltyCards),
      message: 'Loyalty cards fetched successfully'
    };
  }

  static async getLoyaltyCardById(id: string) {
    await this.simulateDelay();
    const card = MOCK_DATA.loyaltyCards[id as keyof typeof MOCK_DATA.loyaltyCards];
    return {
      success: true,
      data: card || null,
      message: card ? 'Loyalty card fetched successfully' : 'Loyalty card not found'
    };
  }

  static async searchLoyaltyByPhone(phone: string) {
    await this.simulateDelay();
    const card = Object.values(MOCK_DATA.loyaltyCards).find(card => 
      card.customerPhone === phone
    );
    return {
      success: true,
      data: card || null,
      message: card ? 'Loyalty card found' : 'No loyalty card found'
    };
  }

  /**
   * Discounts API
   */
  static async getAvailableDiscounts() {
    await this.simulateDelay();
    return {
      success: true,
      data: MOCK_DATA.availableDiscounts,
      message: 'Available discounts fetched successfully'
    };
  }

  static async validateDiscountCode(code: string) {
    await this.simulateDelay();
    const discount = MOCK_DATA.availableDiscounts.find(d => d.code === code);
    return {
      success: true,
      data: discount || null,
      message: discount ? 'Discount code valid' : 'Invalid discount code'
    };
  }

  /**
   * Orders API
   */
  static async createOrder(orderData: any) {
    await this.simulateDelay(500); // Longer delay for order creation
    const orderId = generateOrderNumber();
    return {
      success: true,
      data: { ...orderData, id: orderId, status: 'pending' },
      message: 'Order created successfully'
    };
  }

  static async getOrderHistory(_customerId?: string) {
    await this.simulateDelay();
    // Return empty array for now, can be populated with mock order history
    return {
      success: true,
      data: [],
      message: 'Order history fetched successfully'
    };
  }

  /**
   * Payment API
   */
  static async processPayment(paymentData: any) {
    await this.simulateDelay(1000); // Longer delay for payment processing
    return {
      success: true,
      data: { 
        ...paymentData, 
        transactionId: `TXN${Date.now()}`,
        status: 'completed',
        timestamp: new Date().toISOString()
      },
      message: 'Payment processed successfully'
    };
  }

  /**
   * Customer API
   */
  static async searchCustomers(query: string) {
    await this.simulateDelay();
    const customers = Object.values(MOCK_DATA.loyaltyCards).filter(card =>
      card.customerName.toLowerCase().includes(query.toLowerCase()) ||
      card.customerPhone.includes(query) ||
      (card.customerEmail && card.customerEmail.toLowerCase().includes(query.toLowerCase()))
    );
    return {
      success: true,
      data: customers,
      message: 'Customers found'
    };
  }
}

/**
 * API Service Factory
 * 
 * This factory returns the appropriate service based on configuration.
 * In development, it returns MockDataService. In production, it would return RealApiService.
 */
export class ApiServiceFactory {
  static getService() {
    if (shouldUseMockData()) {
      return MockDataService;
    }
    
    // TODO: Return RealApiService when ready for production
    // return RealApiService;
    
    // For now, always return mock service
    return MockDataService;
  }
}

/**
 * Convenience exports for easy usage
 */
export const apiService = ApiServiceFactory.getService();
export const isUsingMockData = shouldUseMockData();
