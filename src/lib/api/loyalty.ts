/**
 * Loyalty API Service
 * 
 * PURPOSE: Handles all loyalty card operations including scanning, customer lookup,
 * stamp management, and order history for loyalty program integration.
 * 
 * LINKS WITH:
 * - LoyaltyCard interface: Loyalty card data structure
 * - LoyaltyOrder interface: Order data for loyalty tracking
 * - LoyaltyIntegration component: Main loyalty UI
 * - CartOverlay: Customer loyalty integration
 * - Customer store: Customer data management
 * - MockDataManager: Mock loyalty data
 * - All POS components: Access loyalty functionality
 * 
 * WHY: Essential for customer retention and loyalty programs. Provides seamless
 * integration between loyalty cards and the POS system for stamp tracking and rewards.
 */

// Digital Wallet Cards API Service
// Based on https://docs.digitalwallet.cards

import { APIResponse } from './index';
import { MOCK_DATA } from './mockDataManager';

// API configuration
import { API_CONFIG } from '../config/api';

const API_KEY = API_CONFIG.keys.loyalty;
const API_BASE_URL = API_CONFIG.baseUrls.loyalty;

// Interface for loyalty card orders
export interface LoyaltyOrder {
  id: string;
  date: string;
  total: number;
  items: LoyaltyOrderItem[];
  status: 'completed' | 'cancelled' | 'refunded';
  stampsEarned: number;
  stampsRedeemed: number;
}

export interface LoyaltyOrderItem {
  id: string;
  menuItemId: string; // References menu item ID from mock data
  name: string; // Item name for backward compatibility
  price: number; // Item price (base + modifiers)
  quantity: number;
  modifierIds?: {
    variations?: string[]; // Array of modifier IDs
    addOns?: string[]; // Array of modifier IDs
    specialInstructions?: string;
  };
  modifiers?: {
    variations?: Array<{ id: string; name: string; price: number }>;
    addOns?: Array<{ id: string; name: string; price: number }>;
    specialInstructions?: string;
  };
}

// Interface for resolved order items (what gets returned to the UI)
export interface ResolvedLoyaltyOrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  modifiers?: {
    variations?: any[];
    addOns?: any[];
    specialInstructions?: string;
  };
}

// Interface for resolved loyalty card (what gets returned to the UI)
export interface ResolvedLoyaltyCard {
  id: string;
  qrCode: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  currentStamps: number;
  totalStamps: number;
  memberSince: string;
  isActive: boolean;
  lastUsed: string;
  specialInstructions?: string;
  recentOrders: {
    id: string;
    date: string;
    total: number;
    items: ResolvedLoyaltyOrderItem[];
    status: 'completed' | 'cancelled' | 'refunded';
    stampsEarned: number;
    stampsRedeemed: number;
  }[];
}

// Interface for loyalty card (what gets stored in mock data)
export interface LoyaltyCard {
  id: string;
  qrCode: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  currentStamps: number;
  totalStamps: number;
  memberSince: string;
  isActive: boolean;
  lastUsed: string;
  specialInstructions?: string;
  recentOrders: LoyaltyOrder[];
}

export interface StampTransaction {
  id: string;
  cardId: string;
  type: 'earned' | 'redeemed';
  amount: number;
  orderId?: string;
  reason?: string;
  timestamp: string;
}

// Use centralized mock data from mockDataManager
const mockLoyaltyCards: Record<string, LoyaltyCard> = MOCK_DATA.loyaltyCards as Record<string, LoyaltyCard>;
const mockStampTransactions: Record<string, StampTransaction[]> = MOCK_DATA.stampTransactions;

export class LoyaltyAPI {
  // Generic request method following Digital Wallet API patterns
  private static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<APIResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'API request failed');
      }

      return { success: true, data };
    } catch (error) {
      console.error('Loyalty API Error:', error);
      return { 
        success: false, 
        data: null as any,
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Search loyalty card by phone number - Digital Wallet API: GET /loyalty/search?phone={phone}
  static async searchByPhone(phone: string): Promise<APIResponse<ResolvedLoyaltyCard | null>> {
    // For testing, search mock data
    if (process.env.NODE_ENV === 'development' || !API_KEY) {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Find card by phone number
      const card = Object.values(mockLoyaltyCards).find(card => card.customerPhone === phone);
      
      if (card) {
        // Return the card with resolved order details
        const resolvedCard: ResolvedLoyaltyCard = {
          ...card,
          recentOrders: card.recentOrders.map(order => ({
            ...order,
            items: order.items.map(item => {
              // Get menu item details from categories
              let menuItem = null;
              for (const category of MOCK_DATA.categories) {
                menuItem = category.items.find(mi => mi.id === item.menuItemId);
                if (menuItem) break;
              }
              if (!menuItem) {
                // Fallback if menu item not found
                return {
                  id: item.menuItemId,
                  name: 'Unknown Item',
                  price: 0,
                  quantity: item.quantity,
                  modifiers: {}
                } as ResolvedLoyaltyOrderItem;
              }
              
              // Get modifier details from the new menuItemOptions structure
              const resolvedModifiers: any = {};
              
              if (item.modifierIds?.variations) {
                // Resolve variations from menuItemOptions by matching actual option values
                const menuOptions = Array.isArray(MOCK_DATA.menuItemOptions) ? MOCK_DATA.menuItemOptions.filter(opt => opt.MenuItemId === item.menuItemId) : [];
                if (menuOptions.length > 0) {
                  resolvedModifiers.variations = item.modifierIds.variations.map(modValue => {
                    // Find the variation in menuItemOptions by matching the actual option value
                    const option = menuOptions.find((opt: any) => 
                      opt.OptionValue.includes(modValue)
                    );
                    if (option) {
                      const valueIndex = option.OptionValue.indexOf(modValue);
                      return {
                        id: modValue,
                        name: modValue, // Use the actual value as the name
                        price: option.OptionPrice[valueIndex] || 0
                      };
                    }
                    return { id: modValue, name: modValue, price: 0 };
                  }).filter(Boolean);
                } else {
                  // Fallback to placeholder
                  resolvedModifiers.variations = item.modifierIds.variations.map(modValue => 
                    ({ id: modValue, name: modValue, price: 0 })
                  ).filter(Boolean);
                }
              }
              
              if (item.modifierIds?.addOns) {
                // Resolve add-ons from menuItemOptions by matching actual option values
                const menuOptions = Array.isArray(MOCK_DATA.menuItemOptions) ? MOCK_DATA.menuItemOptions.filter(opt => opt.MenuItemId === item.menuItemId) : [];
                if (menuOptions.length > 0) {
                  resolvedModifiers.addOns = item.modifierIds.addOns.map(modValue => {
                    // Find the add-on in menuItemOptions by matching the actual option value
                    const option = menuOptions.find((opt: any) => 
                      opt.OptionValue.includes(modValue)
                    );
                    if (option) {
                      const valueIndex = option.OptionValue.indexOf(modValue);
                      return {
                        id: modValue,
                        name: modValue, // Use the actual value as the name
                        price: option.OptionPrice[valueIndex] || 0
                      };
                    }
                    return { id: modValue, name: modValue, price: 0 };
                  }).filter(Boolean);
                } else {
                  // Fallback to placeholder
                  resolvedModifiers.addOns = item.modifierIds.addOns.map(modValue => 
                    ({ id: modValue, name: modValue, price: 0 })
                  ).filter(Boolean);
                }
              }
              
              if (item.modifierIds?.specialInstructions) {
                resolvedModifiers.specialInstructions = item.modifierIds.specialInstructions;
              }
              
              return {
                id: menuItem.id,
                name: menuItem.name,
                price: item.price, // Use the price from the order (includes modifiers)
                quantity: item.quantity,
                modifiers: resolvedModifiers
              } as ResolvedLoyaltyOrderItem;
            })
          }))
        };
        
        return {
          success: true,
          data: resolvedCard,
          message: 'Loyalty card found with resolved order details'
        };
      }
      
      return {
        success: false,
        data: null,
        error: 'Loyalty card not found'
      };
    }

    // Real API call
    try {
      const response = await LoyaltyAPI.request<LoyaltyCard>(`/loyalty/search?phone=${phone}`);
      // For real API, we assume it returns resolved data
      return response as unknown as APIResponse<ResolvedLoyaltyCard>;
    } catch (error) {
      console.error('Failed to search loyalty card:', error);
      return {
        success: false,
        data: null,
        error: 'Failed to search loyalty card'
      };
    }
  }

  // Create new loyalty card - Digital Wallet API: POST /loyalty/cards
  static async createLoyaltyCard(customerData: {
    name: string;
    phone: string;
    email?: string;
    specialInstructions?: string;
  }): Promise<APIResponse<LoyaltyCard>> {
    // For testing, create mock card
    if (process.env.NODE_ENV === 'development' || !API_KEY) {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const newCard: LoyaltyCard = {
        id: `LC${Date.now()}`,
        qrCode: `loyalty:LC${Date.now()}:${customerData.phone}`,
        customerId: `CUST${Date.now()}`,
        customerName: customerData.name,
        customerPhone: customerData.phone,
        customerEmail: customerData.email,
        currentStamps: 0,
        totalStamps: 0,
        memberSince: new Date().toISOString().split('T')[0],
        isActive: true,
        lastUsed: new Date().toISOString().split('T')[0],
        specialInstructions: customerData.specialInstructions,
        recentOrders: []
      };
      
      // Add to mock data
      mockLoyaltyCards[newCard.id] = newCard;
      
      return {
        success: true,
        data: newCard,
        message: 'Loyalty card created successfully'
      };
    }

    // Real API call
    try {
      return await LoyaltyAPI.request<LoyaltyCard>('/loyalty/cards', {
        method: 'POST',
        body: JSON.stringify(customerData)
      });
    } catch (error) {
      console.error('Failed to create loyalty card:', error);
      return {
        success: false,
        data: null as any,
        error: 'Failed to create loyalty card'
      };
    }
  }

  // Add stamps to loyalty card - Digital Wallet API: POST /loyalty/cards/{cardId}/stamps
  static async addStamps(cardId: string, stamps: number, orderId?: string): Promise<APIResponse<LoyaltyCard>> {
    // For testing, update mock data
    if (process.env.NODE_ENV === 'development' || !API_KEY) {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      if (mockLoyaltyCards[cardId]) {
        mockLoyaltyCards[cardId].currentStamps += stamps;
        mockLoyaltyCards[cardId].totalStamps += stamps;
        mockLoyaltyCards[cardId].lastUsed = new Date().toISOString().split('T')[0];
        
        // Add stamp transaction
        if (!mockStampTransactions[cardId]) {
          mockStampTransactions[cardId] = [];
        }
        
        mockStampTransactions[cardId].push({
          id: `ST${Date.now()}`,
          cardId,
          type: 'earned',
          amount: stamps,
          orderId,
          reason: 'Order completion',
          timestamp: new Date().toISOString()
        });
        
        return {
          success: true,
          data: mockLoyaltyCards[cardId],
          message: 'Stamps added successfully'
        };
      }
      
      return {
        success: false,
        data: null as any,
        error: 'Loyalty card not found'
      };
    }

    // Real API call
    try {
      return await LoyaltyAPI.request<LoyaltyCard>(`/loyalty/cards/${cardId}/stamps`, {
        method: 'POST',
        body: JSON.stringify({ stamps, orderId })
      });
    } catch (error) {
      console.error('Failed to add stamps:', error);
      return {
        success: false,
        data: null as any,
        error: 'Failed to add stamps'
      };
    }
  }

  // Redeem stamps from loyalty card - Digital Wallet API: POST /loyalty/cards/{cardId}/redeem
  static async redeemStamps(cardId: string, stamps: number, reason?: string): Promise<APIResponse<LoyaltyCard>> {
    // For testing, update mock data
    if (process.env.NODE_ENV === 'development' || !API_KEY) {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      if (mockLoyaltyCards[cardId] && mockLoyaltyCards[cardId].currentStamps >= stamps) {
        mockLoyaltyCards[cardId].currentStamps -= stamps;
        mockLoyaltyCards[cardId].lastUsed = new Date().toISOString().split('T')[0];
        
        // Add stamp transaction
        if (!mockStampTransactions[cardId]) {
          mockStampTransactions[cardId] = [];
        }
        
        mockStampTransactions[cardId].push({
          id: `ST${Date.now()}`,
          cardId,
          type: 'redeemed',
          amount: stamps,
          reason: reason || 'Stamp redemption',
          timestamp: new Date().toISOString()
        });
        
        return {
          success: true,
          data: mockLoyaltyCards[cardId],
          message: 'Stamps redeemed successfully'
        };
      }
      
      return {
        success: false,
        data: null as any,
        error: 'Insufficient stamps or card not found'
      };
    }

    // Real API call
    try {
      return await LoyaltyAPI.request<LoyaltyCard>(`/loyalty/cards/${cardId}/redeem`, {
        method: 'POST',
        body: JSON.stringify({ stamps, reason })
      });
    } catch (error) {
      console.error('Failed to redeem stamps:', error);
      return {
        success: false,
        data: null as any,
        error: 'Failed to redeem stamps'
      };
    }
  }

  // Get a specific loyalty card by ID
  static async getLoyaltyCard(cardId: string): Promise<APIResponse<LoyaltyCard>> {
    // For testing, return mock data
    if (process.env.NODE_ENV === 'development' || !API_KEY) {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const card = mockLoyaltyCards[cardId];
      if (!card) {
        return {
          success: false,
          data: null,
          message: 'Loyalty card not found'
        };
      }
      
      return {
        success: true,
        data: card,
        message: 'Loyalty card retrieved successfully'
      };
    }

    // Real API call
    try {
      return await LoyaltyAPI.request<LoyaltyCard>(`/loyalty/cards/${cardId}`);
    } catch (error) {
      console.error('Failed to get loyalty card:', error);
      return {
        success: false,
        data: null,
        message: 'Failed to fetch loyalty card'
      };
    }
  }

  // Get all loyalty cards (for admin/testing purposes)
  static async getAllLoyaltyCards(): Promise<APIResponse<LoyaltyCard[]>> {
    // For testing, return mock data
    if (process.env.NODE_ENV === 'development' || !API_KEY) {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      return {
        success: true,
        data: Object.values(mockLoyaltyCards),
        message: 'All loyalty cards retrieved'
      };
    }

    // Real API call
    try {
      return await LoyaltyAPI.request<LoyaltyCard[]>('/loyalty/cards');
    } catch (error) {
      console.error('Failed to get all loyalty cards:', error);
      return {
        success: false,
        data: [],
        error: 'Failed to fetch loyalty cards'
      };
    }
  }

  // Get stamp transaction history - Digital Wallet API: GET /loyalty/cards/{cardId}/transactions
  static async getStampTransactions(cardId: string): Promise<APIResponse<StampTransaction[]>> {
    // For testing, return mock data
    if (process.env.NODE_ENV === 'development' || !API_KEY) {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      return {
        success: true,
        data: mockStampTransactions[cardId] || [],
        message: 'Stamp transactions retrieved'
      };
    }

    // Real API call
    try {
      return await LoyaltyAPI.request<StampTransaction[]>(`/loyalty/cards/${cardId}/transactions`);
    } catch (error) {
      console.error('Failed to get stamp transactions:', error);
      return {
        success: false,
        data: [],
        error: 'Failed to fetch stamp transactions'
      };
    }
  }
}
