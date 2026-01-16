/**
 * CategoryButton Component
 * 
 * PURPOSE: Displays individual category buttons in the menu page with selection state,
 * hover effects, and auto-scroll functionality when selected. Memoized for performance.
 * 
 * LINKS WITH:
 * - MenuPageContent: Uses this component to display category navigation
 * - useMenuManagement: Provides category data and selection handlers
 * - MenuCategory type: Defines the category data structure
 * - CSS variables: Uses theme colors for consistent styling
 * 
 * WHY: Menu-specific component moved to _components directory following the inventory
 * page pattern. Keeps all menu-related UI components organized in one place.
 */

import React from 'react';
import { MenuCategory } from '@/types/pos';

interface CategoryButtonProps {
  category: MenuCategory;
  isSelected: boolean;
  onClick: (categoryName: string) => void;
}

export const CategoryButton = React.memo(({ category, isSelected, onClick }: CategoryButtonProps) => {
  const handleClick = React.useCallback(() => {
    onClick(category.name);

    // Auto-scroll to center the selected category
    setTimeout(() => {
      const button = document.querySelector(`[data-category="${category.name}"]`) as HTMLElement;
      const container = document.querySelector('.categories-container') as HTMLElement;

      if (button && container) {
        const buttonRect = button.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        // Calculate the center position
        const buttonCenter = buttonRect.left + buttonRect.width / 2;
        const containerCenter = containerRect.left + containerRect.width / 2;
        const scrollOffset = buttonCenter - containerCenter;

        // Smooth scroll to center the button
        container.scrollBy({
          left: scrollOffset,
          behavior: 'smooth'
        });
      }
    }, 100); // Small delay to ensure state update
  }, [category.name, onClick]);

  // Memoize style to prevent hydration mismatch
  const buttonStyle = React.useMemo(() => ({
    minWidth: 'fit-content' as const,
    fontSize: '14px',
    fontWeight: 800 as const,
    lineHeight: '1.4em',
    ...(isSelected && {
      backgroundColor: 'bg-card',
      borderColor: 'border-border'
    })
  }), [isSelected]);

  return (
    <button
      onClick={handleClick}
      data-category={category.name}
      className={`relative px-6 py-2 rounded-xl text-sm font-medium whitespace-nowrap flex items-center justify-center flex-shrink-0 transition-all duration-400 ease-in-out ${
        isSelected
          ? 'text-text-primary bg-card border-border'
          : 'text-text-secondary hover:text-text-primary bg-transparent border border-transparent'
      }`}
      style={buttonStyle}
    >
      <span className="text-center transition-colors duration-500 ease-in-out">
        {category.name}
      </span>
    </button>
  );
});

CategoryButton.displayName = 'CategoryButton';
