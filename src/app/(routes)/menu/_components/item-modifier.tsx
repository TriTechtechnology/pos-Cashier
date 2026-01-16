/**
 * ItemModifier Component
 * 
 * PURPOSE: Modal interface for customizing menu items with variations, add-ons, and special instructions.
 * Appears when user clicks on a menu item to add it to cart.
 * 
 * LINKS WITH:
 * - ItemModifierHeader: Shows item name, price, and close button
 * - ItemModifierContent: Main customization interface
 * - ItemInfo: Displays item details and image
 * - VariationSelector: Size/type selection (required)
 * - AddOnSections: Optional add-ons with pricing
 * - SpecialInstructions: Text input for custom requests
 * - FrequentlyBoughtTogether: Suggests related items
 * - QuantityControls: Quantity selection
 * - ItemModifierFooter: Add to cart button and total price
 * - useItemModifier hook: Manages modifier state and calculations
 * - useCart hook: Adds customized item to cart
 * 
 * WHY: Essential for restaurant POS systems where customers need to customize orders
 * with specific sizes, add-ons, and special instructions before adding to cart.
 */

'use client';

import React from 'react';
import { MenuItem, CartItemModifiers } from '@/types/pos';
import { useSlideOverlay } from '@/lib/hooks/useSlideOverlay';
import { ItemModifierHeader } from './item-modifier/ItemModifierHeader';
import { ItemModifierContent } from './item-modifier/ItemModifierContent';
import { ItemModifierFooter } from './item-modifier/ItemModifierFooter';
import { useItemModifier } from './item-modifier/hooks/useItemModifier';

interface ItemModifierProps {
  item: MenuItem & { modifiers?: CartItemModifiers };
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (modifiedItem: MenuItem & {
    modifiers?: CartItemModifiers;
    calculatedPrice: number;
    originalPrice: number;
    id: string;
    isEditing?: boolean;
    quantity?: number;
  }) => void;
  isCartOpen?: boolean;
  isEditing?: boolean;
  editingItemId?: string;
  savedSelections?: {
    variations?: Array<{ id: string }>;
    addOns?: Array<{ id: string }>;
    specialInstructions?: string;
    quantity?: number;
  };
}

export const ItemModifier: React.FC<ItemModifierProps> = ({
  item,
  isOpen,
  onClose,
  onAddToCart,
  isCartOpen = false,
  isEditing = false,
  editingItemId = '',
  savedSelections = null
}) => {
  // Use the custom hook for all business logic
  const {
    modifierData,
    loading,
    selectedVariations,
    selectedAddOns,
    selectedFrequentlyBoughtItems,
    specialInstructions,
    quantity,
    setSpecialInstructions,
    setQuantity,
    handleVariationChange,
    handleAddOnToggle,
    handleFrequentlyBoughtItemToggle,
    customItemName,
    customItemPrice,
    setCustomItemName,
    setCustomItemPrice,
    isFormValid,
    calculatePricePerItem,
    prepareCartItem
  } = useItemModifier({
    item,
    isOpen,
    isEditing,
    savedSelections: savedSelections || undefined
  });

  // Professional slide overlay hook
  const {
    isMounted,
    handleClose,
    overlayProps,
    contentProps
  } = useSlideOverlay({
    isOpen,
    animationDuration: 500,
    onClose,
    isCartOpen
  });

  const handleAddToCart = () => {
    console.log('🎯 [ITEM MODIFIER] handleAddToCart called', { isEditing, editingItemId, quantity });
    const cartItem = prepareCartItem();
    console.log('🎯 [ITEM MODIFIER] prepareCartItem result:', cartItem ? 'valid' : 'null');
    if (!cartItem) return;

    // 🎨 CUSTOM ITEM: Save to localStorage when adding custom template
    if (item.isCustomTemplate) {
      // Import and use customItemsService dynamically
      Promise.resolve().then(async () => {
        const { customItemsService } = await import('@/lib/services/customItemsService');
        const { useMenuStore } = await import('@/lib/store/menu');

        // Save custom item to localStorage
        const savedItem = customItemsService.addCustomItem({
          name: customItemName,
          price: customItemPrice,
          specialInstructions: cartItem.modifiers?.specialInstructions || ''
        });

        console.log('✅ [ITEM MODIFIER] Saved custom item to localStorage:', savedItem);

        // Refresh menu store to show new custom item
        useMenuStore.getState().refreshCustomItems();
      });

      // Add to cart with the custom data (using prepared cart item)
      for (let i = 0; i < quantity; i++) {
        onAddToCart({ ...cartItem, id: `custom-${Date.now()}-${i}` });
      }
    } else if (isEditing && editingItemId) {
      // 🔥 CRITICAL: Pass quantity to enable duplication logic in handleModifierAddToCart
      console.log('🎯 [ITEM MODIFIER] Calling onAddToCart for editing:', { editingItemId, isEditing: true, quantity });
      onAddToCart({ ...cartItem, id: editingItemId, isEditing: true, quantity });
    } else {
      // Add main item multiple times for quantity (as separate lines), preserve original menu id
      for (let i = 0; i < quantity; i++) {
        onAddToCart({ ...cartItem, id: item.id });
      }

      // Add frequently bought items as separate cart items, preserve their original menu ids
      if (modifierData?.frequentlyBoughtTogether) {
        selectedFrequentlyBoughtItems.forEach(itemId => {
          const frequentlyBoughtItem = modifierData.frequentlyBoughtTogether?.find(item => item.id === itemId);
          if (frequentlyBoughtItem) {
            onAddToCart({
              id: frequentlyBoughtItem.id,
              name: frequentlyBoughtItem.name,
              description: frequentlyBoughtItem.description,
              price: frequentlyBoughtItem.price,
              image: frequentlyBoughtItem.image,
              category: 'add-ons', // Default category for frequently bought items
              available: true, // Assume available
              modifiers: {},
              calculatedPrice: frequentlyBoughtItem.price,
              originalPrice: frequentlyBoughtItem.price
            });
          }
        });
      }
    }

    handleClose();
  };

  if (!isMounted) return null;

  return (
    <div {...overlayProps}>
      <div {...contentProps}>
        {/* Header */}
        <ItemModifierHeader
          itemName={item.isCustomTemplate ? (customItemName || 'Add Custom Item') : item.name}
          pricePerItem={calculatePricePerItem()}
        />

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto overscroll-contain scrollbar-hide">
          <ItemModifierContent
            loading={loading}
            modifierData={modifierData as any}
            item={item}
            selectedVariations={selectedVariations}
            selectedAddOns={selectedAddOns}
            selectedFrequentlyBoughtItems={selectedFrequentlyBoughtItems}
            specialInstructions={specialInstructions}
            isEditing={isEditing}
            onVariationChange={handleVariationChange}
            onAddOnToggle={handleAddOnToggle}
            onFrequentlyBoughtItemToggle={handleFrequentlyBoughtItemToggle}
            onSpecialInstructionsChange={setSpecialInstructions}
            calculatePricePerItem={calculatePricePerItem}
            customItemName={customItemName}
            customItemPrice={customItemPrice}
            onCustomNameChange={setCustomItemName}
            onCustomPriceChange={setCustomItemPrice}
          />
        </div>

        {/* Footer */}
        <ItemModifierFooter
          quantity={quantity}
          isFormValid={isFormValid()}
          isEditing={isEditing}
          onQuantityChange={setQuantity}
          onAddToCart={handleAddToCart}
        />
      </div>
    </div>
  );
};


