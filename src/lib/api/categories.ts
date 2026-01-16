import { APIResponse } from './index';
import { MOCK_DATA } from './mockDataManager';

/**
 * Interface for menu items with modifiers
 * 
 * ADMIN-DRIVEN CONFIGURATION:
 * All modifier rules (required/optional, min/max selections, pricing) are dynamically
 * configured by the client admin module and served through the backend API.
 * 
 * The POS system adapts to any configuration without code changes:
 * - required: boolean - Set by admin (required vs optional add-ons)
 * - price: number - Dynamic pricing per modifier from admin
 * - minSelections/maxSelections - Admin-defined selection rules
 * 
 * Mock data simulates real backend responses for testing.
 */
export interface MenuItemWithModifiers {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  available: boolean;
  image?: string;
  hasRequiredModifiers?: boolean; // Computed from modifier rules
  modifiers?: {
    variations?: Array<{ 
      id: string; 
      name: string; 
      price: number; 
      required?: boolean; // Admin-configured: true = required selection
    }>;
    addOns?: Array<{ 
      id: string; 
      name: string; 
      price: number; 
      required?: boolean; // Admin-configured: true = must select this add-on
    }>;
    // Future admin-configurable properties:
    specialInstructions?: boolean; // Allow custom instructions
    frequentlyBoughtTogether?: string[]; // Admin-curated recommendations
  };
}

// Interface for menu categories
export interface MenuCategory {
  id: string;
  name: string;
  description: string;
  items: MenuItemWithModifiers[];
}

// Categories API using enhanced mock data
export const categoriesAPI = {
  // Get all categories with their menu items
  getAll: async (): Promise<APIResponse<MenuCategory[]>> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Transform the enhanced mock data to match the expected format
    const transformedCategories: MenuCategory[] = MOCK_DATA.categories.map(category => ({
      id: category.id,
      name: category.name,
      description: category.description,
      items: category.items.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        category: item.category,
        available: item.available,
        image: item.image || undefined,
        hasRequiredModifiers: item.modifiers?.variations?.some((v: { required?: boolean }) => v.required) || false,
        modifiers: item.modifiers
      }))
    }));
    
    return {
      success: true,
      data: transformedCategories,
      message: 'Categories fetched successfully'
    };
  },

  // Get a specific category by ID
  getById: async (id: string): Promise<APIResponse<MenuCategory | null>> => {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const category = MOCK_DATA.categories.find(cat => cat.id === id);
    
    if (category) {
      const transformedCategory: MenuCategory = {
        id: category.id,
        name: category.name,
        description: category.description,
        items: category.items.map(item => ({
          id: item.id,
          name: item.name,
          description: item.description,
          price: item.price,
          category: item.category,
          available: item.available,
          image: item.image || undefined,
          hasRequiredModifiers: item.modifiers?.variations?.some((v: { required?: boolean }) => v.required) || false,
          modifiers: item.modifiers
        }))
      };
      
      return {
        success: true,
        data: transformedCategory,
        message: 'Category fetched successfully'
      };
    }
    
    return {
      success: true,
      data: null,
      message: 'Category not found'
    };
  }
};
