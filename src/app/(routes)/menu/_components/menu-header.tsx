/**
 * MenuHeader Component
 * 
 * PURPOSE: Displays the top header section of the menu page including categories,
 * search input, slot selector, and cart button. Handles all header interactions.
 * 
 * LINKS WITH:
 * - MenuPageContent: Main component that uses this header
 * - CategoryButton: Individual category buttons
 * - useMenuManagement: Provides state and handlers for header interactions
 * - Slot type: Defines slot data structure
 * 
 * WHY: Menu-specific component that consolidates all header functionality.
 * Follows the inventory page pattern of keeping page-specific UI components
 * organized in the _components directory.
 */

import React, { useState, useRef, useEffect } from 'react';
import { Search, ShoppingCart, User } from 'lucide-react';
import { MenuCategory, Slot } from '@/types/pos';
import { CartItem } from '@/lib/store/cart-new';
import { CategoryButton } from './category-button';

interface MenuHeaderProps {
  // Categories
  categories: MenuCategory[];
  selectedCategory: string;
  onCategoryChange: (categoryName: string) => void;

  // Search
  searchQuery: string;
  onSearchChange: (query: string) => void;

  // Slot
  slotId: string;
  currentSlotInfo: Slot | null;
  isCartOpen: boolean;
  onSlotSelectorOpen: () => void;
  isPaidOrderEditMode?: boolean;

  // Cart
  cartItems: CartItem[];
  onCartClick: () => void;

  // Mode
  isCashierMode?: boolean;
  onToggleMode?: () => void;
}

export const MenuHeader = React.memo(({
  categories,
  selectedCategory,
  onCategoryChange,
  searchQuery,
  onSearchChange,
  slotId,
  currentSlotInfo,
  isCartOpen,
  onSlotSelectorOpen,
  isPaidOrderEditMode,
  cartItems,
  onCartClick,
  isCashierMode = false,
  onToggleMode
}: MenuHeaderProps) => {
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Collapse search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchExpanded(false);
      }
    };

    if (isSearchExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSearchExpanded]);

  // Focus input when expanded
  useEffect(() => {
    if (isSearchExpanded && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchExpanded]);

  return (
    <div className="flex-shrink-0 w-full z-20 border-b border-border/20">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 px-5 py-3">
        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide flex-1 min-w-0 categories-container w-full sm:w-auto" onClick={(e) => e.stopPropagation()}>
          {categories.map((category) => (
            <CategoryButton
              key={category.id}
              category={category}
              isSelected={selectedCategory === category.name}
              onClick={onCategoryChange}
            />
          ))}
        </div>

        {/* Search and Cart */}
        <div className="flex items-center gap-3 w-full sm:w-auto flex-shrink-0">
          {/* Search Input */}
          <div
            ref={searchContainerRef}
            onClick={() => !isSearchExpanded && setIsSearchExpanded(true)}
            className={`relative flex items-center bg-secondary border border-border rounded-xl transition-all duration-300 ease-in-out cursor-pointer h-[46px] select-none outline-none ring-0 focus:ring-0 shadow-none [WebkitTapHighlightColor:transparent] ${isSearchExpanded ? 'flex-1 sm:w-64 sm:flex-none' : 'w-[46px]'
              }`}
          >
            <div className={`absolute flex items-center justify-center transition-all duration-300 ${isSearchExpanded ? 'left-3' : 'inset-0'
              }`}>
              <Search className={`text-text-secondary transition-all ${isSearchExpanded ? 'w-4 h-4' : 'w-5 h-5'}`} />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              placeholder={isSearchExpanded ? "Search for food, etc.." : ""}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className={`w-full bg-transparent border-none appearance-none text-text-primary placeholder-text-secondary focus:outline-none focus:ring-0 focus:ring-transparent focus-visible:ring-0 focus-visible:ring-transparent focus-visible:ring-offset-0 shadow-none transition-all duration-300 h-full ${isSearchExpanded
                ? 'pl-10 pr-4 opacity-100 cursor-text'
                : 'pl-0 pr-0 opacity-0 cursor-pointer pointer-events-none'
                }`}
            />
          </div>

          {/* Cashier Mode Toggle */}
          {onToggleMode && (
            <button
              onClick={onToggleMode}
              className={`relative w-[46px] h-[46px] flex items-center justify-center bg-secondary border border-border rounded-xl text-text-primary transition-colors flex-shrink-0 ${isCashierMode
                  ? 'bg-secondary text-primary-foreground border-border'
                  : 'hover:bg-accent/50'
                }`}
              title={isCashierMode ? "Switch to Customer Mode" : "Switch to Cashier Mode"}
            >
              <User className="w-5 h-5" />
            </button>
          )}

          {/* Slot Button */}
          <button
            onClick={() => !isCartOpen && !isPaidOrderEditMode && onSlotSelectorOpen()}
            disabled={isCartOpen || isPaidOrderEditMode}
            className={`relative h-[46px] px-3 bg-secondary border border-border rounded-xl text-text-primary transition-colors flex-shrink-0 ${isCartOpen || isPaidOrderEditMode
              ? 'opacity-50 cursor-not-allowed'
              : 'active:bg-accent/50'
              }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-secondary uppercase">SLOT</span>
              <span className="text-sm font-medium">
                {currentSlotInfo?.id || slotId || 'Select'}
              </span>
            </div>
          </button>

          {/* Cart Button */}
          <button
            onClick={onCartClick}
            className="relative w-[46px] h-[46px] flex items-center justify-center bg-secondary border border-border rounded-xl text-text-primary hover:bg-accent/50 transition-colors flex-shrink-0"
          >
            <ShoppingCart className="w-5 h-5" />
            {(() => {
              const shouldShow = cartItems.length > 0 && !isCartOpen;
              return shouldShow && (
                <span className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cartItems.length}
                </span>
              );
            })()}
          </button>
        </div>
      </div>
    </div>
  );
});

MenuHeader.displayName = 'MenuHeader';
