import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MenuItem, MenuCategory } from '@/types/pos';
import { fetchMenu } from '@/lib/api/menu';
import { customItemsService } from '@/lib/services/customItemsService';

export interface MenuState {
  categories: MenuCategory[];
  selectedCategory: string;
  isLoading: boolean;
  error: string | null;
  
  // Item management
  reorderedItems: Record<string, MenuItem[]>; // categoryName -> reordered items
  itemPreferences: Record<string, {
    showImage: boolean;
    available: boolean;
  }>; // itemId -> preferences
  
  // Actions
  setCategories: (categories: MenuCategory[]) => void;
  setSelectedCategory: (category: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Item reordering
  reorderItems: (categoryName: string, fromIndex: number, toIndex: number) => void;
  resetReorder: (categoryName: string) => void;
  
  // Item preferences
  toggleItemAvailability: (itemId: string) => void;
  toggleItemImage: (itemId: string) => void;
  
  // Backend integration
  fetchCategories: () => Promise<void>;
  saveItemOrder: (categoryName: string, items: MenuItem[]) => Promise<void>;
  saveItemPreferences: (itemId: string, preferences: { showImage?: boolean; available?: boolean }) => Promise<void>;

  // Custom items management
  getCustomCategory: () => MenuCategory;
  getAllCategories: () => MenuCategory[]; // Returns API categories + Custom category
  refreshCustomItems: () => void; // Reload custom items from localStorage
  addCustomItem: (item: MenuItem) => void; // Add to custom category
  removeCustomItem: (itemId: string) => void; // Remove from custom category
}

// Empty initial state - data will be loaded from API
const initialCategories: MenuCategory[] = [];

export const useMenuStore = create<MenuState>()(
  persist(
    (set, get) => ({
      categories: initialCategories,
      selectedCategory: 'Custom', // 🎨 Default to Custom category first
      isLoading: false,
      error: null,
      reorderedItems: {},
      itemPreferences: {},
      
      setCategories: (categories) => set({ categories }),
      setSelectedCategory: (category) => set({ selectedCategory: category }),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      
      reorderItems: (categoryName, fromIndex, toIndex) => {
        const { categories, reorderedItems } = get();
        const category = categories.find(cat => cat.name === categoryName);
        
        if (!category) return;
        
        const items = reorderedItems[categoryName] || [...category.items];
        const [draggedItem] = items.splice(fromIndex, 1);
        items.splice(toIndex, 0, draggedItem);
        
        set({
          reorderedItems: {
            ...reorderedItems,
            [categoryName]: items
          }
        });
      },
      
      resetReorder: (categoryName) => {
        const { reorderedItems } = get();
        const newReorderedItems = { ...reorderedItems };
        delete newReorderedItems[categoryName];
        set({ reorderedItems: newReorderedItems });
      },
      
      toggleItemAvailability: (itemId) => {
        const { itemPreferences } = get();
        const currentPrefs = itemPreferences[itemId] || { showImage: false, available: true };
        
        set({
          itemPreferences: {
            ...itemPreferences,
            [itemId]: {
              ...currentPrefs,
              available: !currentPrefs.available
            }
          }
        });
      },
      
      toggleItemImage: (itemId) => {
        const { itemPreferences } = get();
        const currentPrefs = itemPreferences[itemId] || { showImage: false, available: true };
        
        set({
          itemPreferences: {
            ...itemPreferences,
            [itemId]: {
              ...currentPrefs,
              showImage: !currentPrefs.showImage
            }
          }
        });
      },
      
      fetchCategories: async () => {
        set({ isLoading: true, error: null });
        try {
          // Get branch ID from cookies (set during login)
          const { getBranchIdFromCookie } = await import('@/lib/utils/cookies');
          const branchId = getBranchIdFromCookie();

          console.log('🍽️ [MENU STORE] Fetching menu from backend...', { branchId: branchId || 'not provided' });

          // Fetch from backend API (auto falls back to mock if offline/error)
          const response = await fetchMenu({
            branchId: branchId || '', // Send empty string if not provided
            includeUnavailable: false,
            includeHidden: false,
            page: 1,
            limit: 500, // Get all items
          });

          if (response.success && response.categories) {
            console.log('✅ [MENU STORE] Loaded categories:', response.categories.length);
            set({ categories: response.categories, isLoading: false });
          } else {
            console.error('❌ [MENU STORE] Failed to fetch menu:', response.error);
            set({ error: response.message || 'Failed to fetch categories', isLoading: false });
          }
        } catch (error) {
          console.error('❌ [MENU STORE] Error fetching menu:', error);
          set({ error: 'Failed to fetch categories', isLoading: false });
        }
      },
      
      saveItemOrder: async (categoryName, items) => {
        try {
          // TODO: Replace with actual API call
          // await fetch('/api/menu/reorder', {
          //   method: 'POST',
          //   headers: { 'Content-Type': 'application/json' },
          //   body: JSON.stringify({ categoryName, items })
          // });
          
          console.log('Saving item order:', { categoryName, items });
        } catch (error) {
          console.error('Failed to save item order:', error);
        }
      },
      
      saveItemPreferences: async (itemId, preferences) => {
        try {
          // TODO: Replace with actual API call
          // await fetch('/api/menu/preferences', {
          //   method: 'POST',
          //   headers: { 'Content-Type': 'application/json' },
          //   body: JSON.stringify({ itemId, preferences })
          // });

          console.log('Saving item preferences:', { itemId, preferences });
        } catch (error) {
          console.error('Failed to save item preferences:', error);
        }
      },

      // 🎨 CUSTOM ITEMS MANAGEMENT
      getCustomCategory: () => {
        const customItems = customItemsService.getCustomItems();
        const template = customItemsService.getCustomTemplate();

        return {
          id: 'custom',
          name: 'Custom',
          items: [template, ...customItems] // Template first, then custom items
        };
      },

      getAllCategories: () => {
        const { categories } = get();
        const customCategory = get().getCustomCategory();

        // Return Custom category + API categories
        return [customCategory, ...categories];
      },

      refreshCustomItems: () => {
        // Force a re-render by updating a dummy state
        // This triggers components using getAllCategories() to refresh
        const { categories } = get();
        set({ categories: [...categories] }); // Shallow copy triggers update
        console.log('🔄 [MENU STORE] Refreshed custom items');
      },

      addCustomItem: (item: MenuItem) => {
        // Item is already saved to localStorage by customItemsService
        // Just trigger a refresh
        get().refreshCustomItems();
        console.log('✅ [MENU STORE] Added custom item:', item.name);
      },

      removeCustomItem: (itemId: string) => {
        customItemsService.removeCustomItem(itemId);
        get().refreshCustomItems();
        console.log('🗑️ [MENU STORE] Removed custom item:', itemId);
      }
    }),
    {
      name: 'pos-menu',
      // 🚀 OPTIMIZED: Only persist user preferences, NOT API data
      partialize: (state) => ({
        // ❌ categories: state.categories,  // REMOVED: API data should always be fresh from backend
        selectedCategory: state.selectedCategory,
        reorderedItems: state.reorderedItems,
        itemPreferences: state.itemPreferences
      }),
    }
  )
);
