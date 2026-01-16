/**
 * MenuItem Component
 * 
 * PURPOSE: Displays individual menu items in a grid layout with images, names, prices, and availability.
 * Handles item selection and opens the ItemModifier when clicked.
 * 
 * LINKS WITH:
 * - MenuItemCard: Individual item display card
 * - MenuItemImage: Optimized image display
 * - MenuItemContent: Item name, price, and description
 * - MenuItemSelectionIndicator: Shows if item is in cart
 * - MenuItemContextMenu: Right-click options (edit, delete, etc.)
 * - useMenuItem hook: Item state management and animations
 * - useCart hook: Add items to cart
 * - useSlideOverlay hook: Open ItemModifier modal
 * - getThemeStyles: Theme-based styling
 * 
 * WHY: Core component for menu display. Provides the main interface for customers
 * to browse and select items, with visual feedback and smooth interactions.
 */

'use client';

import { MenuItem } from '@/types/pos';
import { getThemeStyles } from '@/lib/utils/theme';
import {
  useMenuItem,
  MenuItemImage,
  MenuItemContent,
  MenuItemContextMenu,
  MenuItemSelectionIndicator
} from './menu-item/index';

interface DraggableMenuItemProps {
  item: MenuItem;
  index: number;
  isSelected: boolean;
  selectedIndex: number | null;
  onSelect: (index: number) => void;
  onSwap: (fromIndex: number, toIndex: number) => void;
  onToggleAvailability: (itemId: string) => void;
  onToggleImage: (itemId: string) => void;
  onDeleteCustomItem?: (itemId: string) => void;
  onClick: (item: MenuItem) => void;
}

export const DraggableMenuItem = ({
  item,
  index,
  isSelected,
  selectedIndex,
  onSelect,
  onSwap,
  onToggleAvailability,
  onToggleImage,
  onDeleteCustomItem,
  onClick
}: DraggableMenuItemProps) => {
  const {
    itemPrefs,
    hasItem,
    showContextMenu,
    itemRef,
    sizeClasses,
    handleMouseDown,
    handleMouseUp,
    handleItemClick,
    handleToggleAvailability,
    handleToggleImage,
    handleChangePosition
  } = useMenuItem({
    item,
    index,
    isSelected,
    selectedIndex,
    onSelect,
    onSwap,
    onToggleAvailability,
    onToggleImage,
    onClick
  });

  // Get theme styles
  const themeStyles = getThemeStyles();

  // Default animation settings
  const defaultAnimations = {
    enableTransitions: true,
    enableHoverEffects: false,
    enableTouchFeedback: false
  };

  // Default tile settings
  const defaultTileSettings = {
    showImages: false
  };

  return (
    <div
      ref={itemRef}
      className={`relative group cursor-pointer rounded-[42px] overflow-hidden transition-all duration-200 ${defaultAnimations.enableTransitions ? 'transition-all duration-200' : ''
        } ${defaultAnimations.enableHoverEffects ? 'hover:scale-105 hover:shadow-lg' : ''
        } ${sizeClasses.container}`}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleItemClick}
    >
      {/* Item Image */}
      <MenuItemImage
        item={item}
        itemPrefs={itemPrefs}
        hasItem={hasItem}
        showImages={defaultTileSettings.showImages}
        sizeClasses={sizeClasses}
      />

      {/* Item Content */}
      <MenuItemContent
        item={item}
        sizeClasses={sizeClasses}
      />

      {/* Context Menu */}
      <MenuItemContextMenu
        showContextMenu={showContextMenu}
        itemPrefs={itemPrefs}
        isCustomItem={item.isCustomItem}
        isCustomTemplate={item.isCustomTemplate}
        onToggleAvailability={handleToggleAvailability}
        onToggleImage={handleToggleImage}
        onChangePosition={handleChangePosition}
        onDeleteCustomItem={onDeleteCustomItem ? () => onDeleteCustomItem(item.id) : undefined}
      />

      {/* Selection Indicator */}
      <MenuItemSelectionIndicator
        isSelected={isSelected}
        themeStyles={themeStyles}
      />
    </div>
  );
};
