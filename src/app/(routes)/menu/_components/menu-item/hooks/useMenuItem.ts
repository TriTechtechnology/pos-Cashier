import { useState, useRef, useEffect } from 'react';
import { MenuItem } from '@/types/pos';
import { useMenuStore } from '@/lib/store/menu';

interface UseMenuItemProps {
  item: MenuItem;
  index: number;
  isSelected: boolean;
  selectedIndex: number | null;
  onSelect: (index: number) => void;
  onSwap: (fromIndex: number, toIndex: number) => void;
  onToggleAvailability: (itemId: string) => void;
  onToggleImage: (itemId: string) => void;
  onClick: (item: MenuItem) => void;
}

export const useMenuItem = ({
  item,
  index,
  isSelected,
  selectedIndex,
  onSelect,
  onSwap,
  onToggleAvailability,
  onToggleImage,
  onClick
}: UseMenuItemProps) => {
  const { itemPreferences } = useMenuStore();
  
  // Get item preferences
  const itemPrefs = itemPreferences[item.id] || { showImage: false, available: item.available };
  const [showContextMenu, setShowContextMenu] = useState(false);
  const itemRef = useRef<HTMLDivElement>(null);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Default tile settings since we removed them from settings store
  const defaultTileSettings = {
    size: 'medium' as 'small' | 'medium' | 'large',
    dragMode: 'enabled' as 'enabled' | 'disabled',
    showImages: false,
    holdDuration: 1000
  };

  // Get tile size classes based on settings
  const getTileSizeClasses = () => {
    const tileSize = defaultTileSettings.size;
    switch (tileSize) {
      case 'small':
        return {
          container: 'h-56', // 224px total height
          image: 'h-36', // 144px (64% of total)
          content: 'h-20', // 80px (36% of total)
          text: 'text-xs',
          price: 'text-sm'
        };
      case 'large':
        return {
          container: 'h-80', // 320px total height
          image: 'h-56', // 224px (70% of total)
          content: 'h-24', // 96px (30% of total)
          text: 'text-base',
          price: 'text-lg'
        };
      default: // medium
        return {
          container: 'h-68', // 272px total height
          image: 'h-48', // 192px (70% of total)
          content: 'h-20', // 80px (30% of total)
          text: 'text-sm',
          price: 'text-base'
        };
    }
  };

  const sizeClasses = getTileSizeClasses();

  const handleMouseDown = () => {
    if (defaultTileSettings.dragMode === 'disabled') return;
    
    holdTimerRef.current = setTimeout(() => {
      setShowContextMenu(true);
    }, defaultTileSettings.holdDuration); // Use default hold duration
  };

  const handleMouseUp = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  };

  const handleClick = () => {
    if (isSelected) {
      // If this item is selected, clicking another item will swap them
      return;
    }
    
    // Check if another item is selected for swapping
    if (selectedIndex !== null && selectedIndex !== index) {
      onSwap(selectedIndex, index);
    } else {
      onClick(item);
    }
  };

  const handleItemClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent bubbling to parent
    
    // Don't handle clicks when context menu is open
    if (showContextMenu) {
      return;
    }
    
    if (isSelected) {
      // If clicking the same selected item, deselect it
      onSelect(-1); // -1 means deselect
      return;
    }
    
    // Check if another item is selected for swapping
    if (selectedIndex !== null && selectedIndex !== index) {
      onSwap(selectedIndex, index);
    } else {
      onClick(item);
    }
  };

  // Cleanup timer on unmount and handle global clicks
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      if (showContextMenu && itemRef.current && !itemRef.current.contains(e.target as Node)) {
        setShowContextMenu(false);
      }
    };

    if (showContextMenu) {
      // Add a small delay before adding the event listener to prevent immediate closing
      const timeoutId = setTimeout(() => {
        document.addEventListener('mousedown', handleGlobalClick);
      }, 100);

      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('mousedown', handleGlobalClick);
      };
    }

    return () => {
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current);
      }
    };
  }, [showContextMenu]);

  const handleToggleAvailability = () => {
    onToggleAvailability(item.id);
    setShowContextMenu(false);
  };

  const handleToggleImage = () => {
    onToggleImage(item.id);
    setShowContextMenu(false);
  };

  const handleChangePosition = () => {
    onSelect(index);
    setShowContextMenu(false);
  };

  return {
    itemPrefs,
    hasItem: false, // Default to false for now - can be connected to cart later
    showContextMenu,
    itemRef,
    sizeClasses,
    handleMouseDown,
    handleMouseUp,
    handleClick,
    handleItemClick,
    handleToggleAvailability,
    handleToggleImage,
    handleChangePosition
  };
};
