'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { MenuItem } from '@/types/pos';
import { useCartActions } from '@/lib/store/cart-new';
import { Button } from '@/components/ui/button';
import { Plus, Eye, EyeOff, Move, Trash2 } from 'lucide-react';
import { OptimizedImage } from '@/components/ui/OptimizedImage';

// Card size settings - easily configurable
const CARD_SETTINGS = {
  width: 280,
  imageHeight: 180,
  get aspectRatio() { return `${this.width}/${this.imageHeight}`; }
};

interface MenuItemCardProps {
  item: MenuItem;
  onItemClick: (item: MenuItem) => void;
  onToggleAvailability: (itemId: string) => void;
  onToggleImage: (itemId: string) => void;
  onDeleteCustomItem?: (itemId: string) => void;
  showImage?: boolean;
  isDraggable?: boolean;
}

export const MenuItemCard: React.FC<MenuItemCardProps> = React.memo(({
  item,
  onItemClick,
  onToggleAvailability,
  onToggleImage,
  onDeleteCustomItem,
  showImage = false,
  isDraggable = false
}) => {
  const { addItem } = useCartActions();
  const [isHovered, setIsHovered] = useState(false);

  const handleAddToCart = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    addItem(item, 1, { variations: [], addOns: [] }, { keepSeparate: true });
  }, [addItem, item]);

  const handleToggleAvailability = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleAvailability(item.id);
  }, [onToggleAvailability, item.id]);

  const handleToggleImage = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleImage(item.id);
  }, [onToggleImage, item.id]);

  const handleDeleteCustomItem = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDeleteCustomItem && confirm(`Delete "${item.name}"?`)) {
      onDeleteCustomItem(item.id);
    }
  }, [onDeleteCustomItem, item.id, item.name]);

  // const isInCart = hasItem(item.id); // Will be implemented in new architecture
  const isInCart = false; // Temporary until implementation

  // Detect item type
  const isCustomTemplate = item.isCustomTemplate;
  const isSavedCustomItem = item.isCustomItem && !item.isCustomTemplate;

  // Memoize expensive className calculation
  const cardClassName = useMemo(() => `
    relative bg-card border border-border rounded-lg overflow-hidden cursor-pointer
    transition-all duration-200 ease-out group
    ${isHovered ? 'shadow-lg scale-[1.02]' : 'shadow-sm'}
    ${!item.available ? 'opacity-60' : ''}
    ${isInCart ? 'ring-2 ring-primary' : ''}
    ${isCustomTemplate ? 'border-dashed border-2 border-primary/40' : ''}
  `, [isHovered, item.available, isInCart, isCustomTemplate]);

  return (
    <div
      className={cardClassName}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onItemClick(item)}
      style={{
        width: `${CARD_SETTINGS.width}px`,
        maxWidth: `${CARD_SETTINGS.width}px`,
        minWidth: `${CARD_SETTINGS.width}px`
      }}
    >
      {/* Image Section */}
      <div
        className="relative bg-muted overflow-hidden"
        style={{
          height: `${CARD_SETTINGS.imageHeight}px`,
          width: `${CARD_SETTINGS.width}px`
        }}
      >
        {isCustomTemplate ? (
          <div
            className="w-full h-full flex items-center justify-center bg-primary/5"
            style={{ aspectRatio: CARD_SETTINGS.aspectRatio }}
          >
            <Plus className="w-16 h-16 text-primary" />
          </div>
        ) : showImage && item.image && !isSavedCustomItem ? (
          <OptimizedImage
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover"
            width={CARD_SETTINGS.width}
            height={CARD_SETTINGS.imageHeight}
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ aspectRatio: CARD_SETTINGS.aspectRatio }}
          >
            <span className="text-4xl">{isSavedCustomItem ? '✨' : '🍽️'}</span>
          </div>
        )}

        {/* Overlay Actions */}
        {!isCustomTemplate && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200">
            <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              {/* Delete button for saved custom items */}
              {isSavedCustomItem && onDeleteCustomItem && (
                <Button
                  variant="icon-line"
                  size="sm"
                  onClick={handleDeleteCustomItem}
                  className="w-8 h-8 bg-destructive/90 hover:bg-destructive text-destructive-foreground"
                  title="Delete Custom Item"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}

              {/* Standard controls for regular items */}
              {!isSavedCustomItem && (
                <>
                  <Button
                    variant="icon-line"
                    size="sm"
                    onClick={handleToggleImage}
                    className="w-8 h-8 bg-card/90 hover:bg-card"
                    title={showImage ? 'Hide Image' : 'Show Image'}
                  >
                    {showImage ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </Button>

                  <Button
                    variant="icon-line"
                    size="sm"
                    onClick={handleToggleAvailability}
                    className={`w-8 h-8 bg-card/90 hover:bg-card ${item.available ? 'text-success' : 'text-destructive'
                      }`}
                    title={item.available ? 'Mark Unavailable' : 'Mark Available'}
                  >
                    <div className={`w-2 h-2 rounded-full ${item.available ? 'bg-success' : 'bg-destructive'}`} />
                  </Button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Drag Handle */}
        {isDraggable && (
          <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Button
              variant="icon-line"
              size="sm"
              className="w-8 h-8 bg-card/90 hover:bg-card cursor-move"
              title="Drag to reorder"
            >
              <Move className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4">
        {isCustomTemplate ? (
          /* Template Item - Simple centered message */
          <div className="flex flex-col items-center justify-center h-full py-4">
            <h3 className="font-semibold text-primary text-base text-center">
              Add Custom Item
            </h3>
            <p className="text-xs text-text-secondary mt-2 text-center">
              {item.description || 'Create a custom menu item'}
            </p>
          </div>
        ) : (
          /* Regular and Custom Items - Standard display */
          <>
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-text-primary text-sm leading-tight flex-1">
                {item.name}
              </h3>
            </div>

            {item.description && (
              <p className="text-xs text-text-secondary mb-3 line-clamp-2">
                {item.description}
              </p>
            )}

            {/* Addons Display */}
            {item.modifiers?.addOns && item.modifiers.addOns.length > 0 && (
              <div className="mb-3 pb-3 border-b border-border/50">
                <p className="text-xs font-medium text-text-secondary mb-2">Available Add-ons:</p>
                <div className="flex flex-wrap gap-1">
                  {item.modifiers.addOns.slice(0, 3).map((addon) => (
                    <span
                      key={addon.id}
                      className="inline-flex items-center px-2 py-1 bg-primary/10 text-primary rounded text-xs"
                    >
                      {addon.name} {addon.price > 0 && `+Rs.${addon.price}`}
                    </span>
                  ))}
                  {item.modifiers.addOns.length > 3 && (
                    <span className="inline-flex items-center px-2 py-1 bg-muted text-text-secondary rounded text-xs">
                      +{item.modifiers.addOns.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-primary">
                Rs. {item.price}
              </span>

              <Button
                variant="fill"
                size="sm"
                onClick={handleAddToCart}
                disabled={!item.available}
                className={`
                  w-8 h-8 p-0 transition-all duration-200
                  ${isInCart ? 'bg-success hover:bg-success/90' : ''}
                `}
                title={isInCart ? 'Already in cart' : 'Add to cart'}
              >
                {isInCart ? (
                  <span className="text-xs">✓</span>
                ) : (
                  <Plus className="w-4 h-4" />
                )}
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Availability Badge */}
      {!item.available && (
        <div className="absolute top-2 left-2 bg-destructive text-destructive-foreground px-2 py-1 rounded text-xs font-medium">
          Unavailable
        </div>
      )}
    </div>
  );
});

MenuItemCard.displayName = 'MenuItemCard';
