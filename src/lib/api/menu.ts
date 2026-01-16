/**
 * POS Menu API Service
 *
 * PURPOSE: Fetch menu items and categories from backend
 * Endpoint: GET /t/pos/menu
 *
 * FEATURES:
 * - Category-wise grouping
 * - Search and filtering
 * - Pagination support
 * - Offline fallback to mock data
 *
 * LINKS WITH:
 * - Menu Store: Loads categories and items
 * - Auth Store: Gets authentication token
 */

import { getAuthToken } from './auth';
import { categoriesAPI } from './categories';

export interface MenuAPIParams {
  branchId: string;
  categoryId?: string;
  q?: string; // search term
  includeUnavailable?: boolean;
  includeHidden?: boolean;
  page?: number;
  limit?: number;
}

// Backend API Types - NEW STRUCTURE (Sections with nested items)
export interface BackendAddonItem {
  id: string;
  name: string;
  price: number;
  unit?: string;
  isRequired: boolean;
  displayOrder: number;
  metadata?: Record<string, any>;
}

export interface BackendAddonSection {
  id: string;
  name: string;
  description: string;
  displayOrder: number;
  items: BackendAddonItem[];
  metadata?: Record<string, any>;
}

// Legacy flat structure (keeping for backwards compatibility)
export interface BackendAddon {
  _id: string;
  id?: string;
  menuItemId: string;
  recipeVariantId?: string;
  name: string;
  type: 'addon' | 'variation';
  priceDelta: number;
  isDefault: boolean;
  isActive: boolean;
  displayOrder: number;
}

// NEW API structure: Direct variation (size, crust, etc.)
export interface BackendVariationDirect {
  id: string;
  recipeId: string;
  name: string;
  description: string;
  type: 'size' | 'crust' | 'base' | string;
  sizeMultiplier?: number;
  baseCostAdjustment: number;
  crustType?: string;
  totalCost: number;
  metadata?: Record<string, any>;
}

// Variation section with nested items (alternative structure)
export interface BackendVariationItem {
  id: string;
  name: string;
  price: number;
  unit?: string;
  isRequired: boolean;
  displayOrder: number;
  metadata?: Record<string, any>;
}

export interface BackendVariationSection {
  id: string;
  name: string;
  description: string;
  displayOrder: number;
  items: BackendVariationItem[];
  metadata?: Record<string, any>;
}

// Legacy flat structure
export interface BackendVariation {
  _id: string;
  id?: string;
  menuItemId: string;
  recipeVariantId?: string;
  name: string;
  type: 'addon' | 'variation';
  priceDelta: number;
  isDefault: boolean;
  isActive: boolean;
  displayOrder: number;
}

export interface BackendMenuItem {
  id: string;
  _id?: string;
  name: string;
  slug: string;
  code: string | null;
  description: string | null;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  price: number;
  priceIncludesTax: boolean;
  isAvailable: boolean;
  isVisibleInPOS: boolean;
  displayOrder: number;
  labels: string[];
  metadata: Record<string, any>;
  // API variations - supports multiple structures
  variations?: BackendVariationDirect[] | BackendVariationSection[];
  // API addons - section-based structure
  addOns?: BackendAddonSection[];
  // LEGACY: Flat modifiers (backwards compatibility)
  addons?: BackendAddon[];
}

export interface BackendCategory {
  id: string;
  name: string;
  slug: string;
  displayOrder: number;
  items: BackendMenuItem[];
}

export interface BackendMenuResponse {
  status: number;
  message: string;
  result: {
    branch: {
      id: string;
      name: string;
      code: string;
      status: string;
      currency: string;
      timezone: string;
      tax?: {
        mode: string;
        rate: number;
        vatNumber: string;
      };
    };
    categories: BackendCategory[];
    items: BackendMenuItem[];
    page: number;
    limit: number;
    total: number;
    count: number;
  };
}

export interface MenuAPIResponse {
  success: boolean;
  categories?: any[]; // Transformed categories
  branch?: any;
  count?: number;
  page?: number;
  limit?: number;
  total?: number;
  error?: string;
  message?: string;
}

/**
 * Fetch menu from backend API
 *
 * @param params - Query parameters for filtering
 * @returns Menu data grouped by categories
 */
export async function fetchMenu(params: MenuAPIParams): Promise<MenuAPIResponse> {
  try {
    const token = getAuthToken();

    if (!token) {
      console.warn('⚠️ [MENU API] No token, falling back to mock data');
      return fetchMenuMock(params);
    }

    // 🔄 Use Next.js API route proxy to avoid CORS issues
    const endpoint = '/api/pos/menu';

    console.log('🍽️ [MENU API] Fetching menu...', {
      endpoint,
      branchId: params.branchId,
      categoryId: params.categoryId,
    });

    // Build query string
    const queryParams = new URLSearchParams({
      branchId: params.branchId,
      ...(params.categoryId && { categoryId: params.categoryId }),
      ...(params.q && { q: params.q }),
      includeUnavailable: (params.includeUnavailable ?? false).toString(),
      includeHidden: (params.includeHidden ?? false).toString(),
      page: (params.page ?? 1).toString(),
      limit: (params.limit ?? 50).toString(),
    });

    const url = `${endpoint}?${queryParams}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data: BackendMenuResponse = await response.json();

    if (!response.ok) {
      console.error('❌ [MENU API] Failed to fetch menu:', data);

      // Fall back to mock data on error
      if (response.status === 401 || response.status === 403 || response.status === 500) {
        console.warn('⚠️ [MENU API] API error, falling back to mock data');
        return fetchMenuMock(params);
      }

      return {
        success: false,
        error: data.message || 'Failed to fetch menu',
        message: data.message || 'Unable to fetch menu',
      };
    }

    console.log('✅ [MENU API] Fetched menu successfully:', {
      categories: data.result.categories.length,
      items: data.result.count,
    });

    // Transform backend response to our internal format
    const transformedCategories = transformBackendMenu(data.result);

    return {
      success: true,
      categories: transformedCategories,
      branch: data.result.branch,
      count: data.result.count,
      page: data.result.page,
      limit: data.result.limit,
      total: data.result.total,
    };
  } catch (error) {
    console.error('❌ [MENU API] Network error, falling back to mock:', error);
    // Fall back to mock data on network error
    return fetchMenuMock(params);
  }
}

/**
 * Transform backend menu response to internal format
 * Converts backend category/item structure to MenuCategory format
 */
function transformBackendMenu(result: BackendMenuResponse['result']): any[] {
  console.log('🔄 [TRANSFORM] Transforming backend menu data...');

  return result.categories.map(category => ({
    id: category.id,
    name: category.name,
    description: `${category.items.length} items`, // Generate description
    items: category.items.map(item => {
      // Handle variations - Direct array from backend (e.g., size variations)
      let variations: any[] = [];
      if (item.variations && item.variations.length > 0) {
        const firstVar = item.variations[0] as any;

        // Check structure: section-based (items) vs direct array (type, sizeMultiplier, etc.)
        if ('items' in firstVar && Array.isArray(firstVar.items)) {
          // Section-based structure: Flatten all variation items from all sections
          const sections = item.variations as BackendVariationSection[];
          variations = sections.flatMap(section =>
            section.items.map(varItem => ({
              id: varItem.id,
              name: varItem.name,
              price: varItem.price,
              required: varItem.isRequired
            }))
          );
        } else if ('type' in firstVar) {
          // NEW API structure: Direct variations array (size, crust, etc.)
          const directVars = item.variations as BackendVariationDirect[];
          variations = directVars.map((v) => ({
            id: v.id,
            name: v.name,
            price: v.baseCostAdjustment || 0, // Use baseCostAdjustment as price modifier
            required: false, // Variations are typically required to select one, but individual options aren't "required"
            type: v.type, // size, crust, etc.
            sizeMultiplier: v.sizeMultiplier,
            description: v.description
          }));
        } else if ('isActive' in firstVar) {
          // LEGACY structure: Direct variations array with isActive flag
          const legacyVars = item.variations as any as BackendVariation[];
          variations = legacyVars
            .filter(v => v.isActive)
            .map(v => ({
              id: v._id || v.id || '',
              name: v.name,
              price: v.priceDelta,
              required: v.isDefault
            }));
        }
      }

      // Handle addOns - Section-based structure with nested items
      let addOns: any[] = [];
      if (item.addOns && item.addOns.length > 0) {
        // Check if it's section-based structure
        const firstAddOn = item.addOns[0];
        if ('items' in firstAddOn && Array.isArray(firstAddOn.items)) {
          // Section-based structure: Flatten all addon items from all sections
          addOns = item.addOns.flatMap(section =>
            section.items.map(addonItem => ({
              id: addonItem.id,
              name: addonItem.name,
              price: addonItem.price,
              required: addonItem.isRequired
            }))
          );
        }
      } else if (item.addons && item.addons.length > 0) {
        // LEGACY structure: Direct addons array
        addOns = item.addons
          .filter(a => a.isActive)
          .map(a => ({
            id: a._id || a.id || '',
            name: a.name,
            price: a.priceDelta,
            required: a.isDefault
          }));
      }

      const hasModifiers = variations.length > 0 || addOns.length > 0;

      if (hasModifiers) {
        console.log(`📋 [ITEM: ${item.name}] Variations: ${variations.length}, Addons: ${addOns.length}`);
      }

      return {
        id: item.id || item._id,
        name: item.name,
        description: item.description || '',
        price: item.price,
        category: item.categoryName,
        available: item.isAvailable,
        image: undefined, // No image in current API response
        code: item.code,
        priceIncludesTax: item.priceIncludesTax,
        displayOrder: item.displayOrder,
        labels: item.labels,
        metadata: item.metadata,
        // Include modifiers (variations and addons) if they exist
        modifiers: hasModifiers ? {
          variations: variations.length > 0 ? variations : undefined,
          addOns: addOns.length > 0 ? addOns : undefined,
        } : undefined,
      };
    }),
  }));
}

/**
 * Mock menu data for development/testing
 * Falls back to existing mock categories API
 */
export async function fetchMenuMock(params: MenuAPIParams): Promise<MenuAPIResponse> {
  console.warn('🧪 [MENU API] ⚠️ USING MOCK DATA - NOT FOR PRODUCTION!');

  // Use existing mock categories
  const result = await categoriesAPI.getAll();

  if (result.success && result.data) {
    let categories = result.data;

    // Filter by category if specified
    if (params.categoryId) {
      categories = categories.filter(cat => cat.id === params.categoryId);
    }

    // Filter by search term if specified
    if (params.q) {
      const searchTerm = params.q.toLowerCase();
      categories = categories.map(cat => ({
        ...cat,
        items: cat.items.filter(item =>
          item.name.toLowerCase().includes(searchTerm) ||
          item.description?.toLowerCase().includes(searchTerm)
        ),
      })).filter(cat => cat.items.length > 0);
    }

    // Filter unavailable items if not included
    if (!params.includeUnavailable) {
      categories = categories.map(cat => ({
        ...cat,
        items: cat.items.filter(item => item.available),
      })).filter(cat => cat.items.length > 0);
    }

    return {
      success: true,
      categories,
      count: categories.reduce((sum, cat) => sum + cat.items.length, 0),
      page: params.page ?? 1,
      limit: params.limit ?? 50,
    };
  }

  return {
    success: false,
    error: 'Failed to load mock menu data',
  };
}
