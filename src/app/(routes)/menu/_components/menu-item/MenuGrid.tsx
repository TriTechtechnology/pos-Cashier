'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { MenuItem } from '@/types/pos';
import { MenuItemCard } from './MenuItemCard';
import { CashierMenuItemCard } from './CashierMenuItemCard';
import { Percent, Gift, Award, Grid3X3 } from 'lucide-react';

interface MenuGridProps {
  items: MenuItem[];
  onItemClick: (item: MenuItem) => void;
  onToggleAvailability: (itemId: string) => void;
  onToggleImage: (itemId: string) => void;
  onDeleteCustomItem?: (itemId: string) => void;
  showImages?: boolean;
  isDraggable?: boolean;
  isCashierMode?: boolean;
  onSwap?: (fromIndex: number, toIndex: number) => void;
  isCartOpen?: boolean;
  searchQuery?: string; // Add search query prop to control special tiles visibility
}

const SPECIAL_TILES = [
  { id: 'discount', label: 'Discount', icon: Percent, color: 'bg-blue-600 text-white' },
  { id: 'reward', label: 'Reward', icon: Award, color: 'bg-blue-600 text-white' },
  { id: 'gift-card', label: 'Gift Card', icon: Gift, color: 'bg-blue-600 text-white' },
];

export const MenuGrid: React.FC<MenuGridProps> = React.memo(({
  items,
  onItemClick,
  onToggleAvailability,
  onToggleImage,
  onDeleteCustomItem,
  showImages = false,
  isDraggable = false,
  isCashierMode = false,
  onSwap: _onSwap,
  isCartOpen = false,
  searchQuery = ''
}) => {
  const [showDiscounts, setShowDiscounts] = useState(false);

  // DnD State
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isRearrangeMode, setIsRearrangeMode] = useState(false);
  const [localItems, setLocalItems] = useState<MenuItem[]>([]);

  // Merge items with special tiles for Cashier Mode
  // Only show special tiles when there's no active search query
  const gridItems = useMemo(() => {
    if (!isCashierMode) return items;

    // If user is searching, don't show special tiles - only show filtered menu items
    if (searchQuery && searchQuery.trim().length > 0) {
      return items;
    }

    // Create pseudo-items for special tiles (only when not searching)
    const specialItems: MenuItem[] = SPECIAL_TILES.map(tile => ({
      id: tile.id,
      name: tile.label,
      price: 0,
      category: 'special',
      image: '',
      available: true,
      // We can add other required fields as needed, or cast if loose
    } as unknown as MenuItem));

    return [...specialItems, ...items];
  }, [isCashierMode, items, searchQuery]);

  // Sync local items with gridItems when gridItems changes
  useEffect(() => {
    setLocalItems(gridItems);
  }, [gridItems]);

  // DnD Handlers
  const handleDragStart = (_e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, _index: number) => {
    e.preventDefault(); // allow drop
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    // Reorder local items
    const newItems = [...localItems];
    const [draggedItem] = newItems.splice(draggedIndex, 1);
    newItems.splice(targetIndex, 0, draggedItem);

    setLocalItems(newItems);
    setDraggedIndex(null);

    // Note: We are NOT calling onSwap logic for generating backend updates here 
    // because special tiles are mixed in and don't persist to backend in this simplified implementation.
    // This allows session-based rearranging as requested.
  };

  const handleSpecialTileClick = (id: string) => {
    if (id === 'discount') {
      setShowDiscounts(!showDiscounts);
    } else {
      console.log(`Clicked special tile: ${id}`);
    }
  };

  // Group items by category (for non-cashier mode)
  const groupedItems = useMemo(() => {
    const groups: Record<string, MenuItem[]> = {};
    items.forEach(item => {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
    });
    return groups;
  }, [items]);

  if (!items || items.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-muted-foreground">
        No items found
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto scrollbar-hide p-4">
      {/* Discount Stub View */}
      {showDiscounts ? (
        <div className="p-4 bg-muted/30 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Discounts</h2>
            <button onClick={() => setShowDiscounts(false)} className="text-blue-500 font-medium">Back to items</button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {['10% Off', '20% Off', '50% Off', 'Employee', 'Manager', 'Comp'].map((discount) => (
              <div key={discount} className="aspect-square bg-card rounded-xl border flex items-center justify-center shadow-sm cursor-pointer hover:bg-accent">
                <span className="font-semibold">{discount}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        isCashierMode ? (
          <div>
            {isRearrangeMode && (
              <div className="mb-4 p-3 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-2 text-primary font-medium">
                  <Grid3X3 className="w-5 h-5" />
                  <span>Rearrange Mode Active</span>
                </div>
                <button
                  onClick={() => setIsRearrangeMode(false)}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm"
                >
                  Done
                </button>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {/* items and special tiles mixed from localItems */}
              {localItems.map((item, index) => {
                // Check if it's a special tile
                const specialTile = SPECIAL_TILES.find(t => t.id === item.id);

                return (
                  <CashierMenuItemCard
                    key={item.id}
                    item={item}
                    index={index}
                    onClick={(clickedItem) => {
                      if (specialTile) {
                        handleSpecialTileClick(specialTile.id);
                      } else {
                        onItemClick(clickedItem);
                      }
                    }}
                    draggable={isRearrangeMode}
                    isRearrangeMode={isRearrangeMode}
                    onLongPress={() => setIsRearrangeMode(true)}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    isCartOpen={isCartOpen}
                  />
                );
              })}
            </div>
          </div>
        ) : (
          Object.entries(groupedItems).map(([category, categoryItems]) => (
            <div key={category} className="space-y-4">
              <h2 className="text-lg font-semibold text-text-primary border-b border-border pb-2">
                {category} ({categoryItems.length})
              </h2>

              <div className={`
                  ${'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'}
                `}>
                {categoryItems.map((item) => (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    onItemClick={onItemClick}
                    onToggleAvailability={onToggleAvailability}
                    onToggleImage={onToggleImage}
                    onDeleteCustomItem={onDeleteCustomItem}
                    showImage={showImages}
                    isDraggable={isDraggable}
                  />
                ))}
              </div>
            </div>
          ))
        )
      )}

      {/* No Results */}
      {items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl">🔍</span>
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">No items found</h3>
          <p className="text-sm text-text-secondary">
            Browse all categories
          </p>
        </div>
      )}
    </div>
  );
});

MenuGrid.displayName = 'MenuGrid';
