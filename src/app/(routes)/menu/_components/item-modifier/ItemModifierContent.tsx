import React from 'react';
import { VariationSelector } from './VariationSelector';
import { AddOnSections } from './AddOnSections';
import { ItemInfo } from './ItemInfo';
import { SpecialInstructions } from './SpecialInstructions';
import { FrequentlyBoughtTogether } from './FrequentlyBoughtTogether';
import { CustomItemInputs } from './CustomItemInputs';

// Local interface to match AddOnSection from AddOnSections component
interface AddOnSection {
  id: string;
  title: string;
  type: 'variation' | 'addon' | 'required';
  required: boolean;
  minSelections?: number;
  maxSelections?: number;
  addOns: Array<{ id: string; name: string; price: number }>;
}

// Local interface to match MenuItem from types
interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  image?: string;
  available: boolean;
  isCustomItem?: boolean;
  isCustomTemplate?: boolean;
}

interface ItemModifierContentProps {
  loading: boolean;
  modifierData: {
    variations?: Array<{
      id: string;
      title: string;
      required: boolean;
      minSelections: number;
      maxSelections: number;
      options: Array<{
        id: string;
        name: string;
        price: number;
        required: boolean;
      }>;
    }>;
    addOnSections?: AddOnSection[];
    frequentlyBoughtTogether?: MenuItem[];
  } | null;
  item: MenuItem;
  selectedVariations: Record<string, string>;
  selectedAddOns: Record<string, string[]>;
  selectedFrequentlyBoughtItems: string[];
  specialInstructions: string;
  isEditing: boolean;
  onVariationChange: (variationId: string) => void;
  onAddOnToggle: (sectionId: string, addOnId: string) => void;
  onFrequentlyBoughtItemToggle: (itemId: string) => void;
  onSpecialInstructionsChange: (value: string) => void;
  calculatePricePerItem: () => number;
  // Custom item props
  customItemName?: string;
  customItemPrice?: number;
  onCustomNameChange?: (value: string) => void;
  onCustomPriceChange?: (value: number) => void;
}

export const ItemModifierContent: React.FC<ItemModifierContentProps> = React.memo(({
  loading,
  modifierData,
  item,
  selectedVariations,
  selectedAddOns,
  selectedFrequentlyBoughtItems,
  specialInstructions,
  isEditing,
  onVariationChange,
  onAddOnToggle,
  onFrequentlyBoughtItemToggle,
  onSpecialInstructionsChange,
  calculatePricePerItem,
  customItemName,
  customItemPrice,
  onCustomNameChange,
  onCustomPriceChange
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!modifierData) {
    console.log('⚠️ [ITEM MODIFIER CONTENT] No modifier data available for:', item.name);
    return null;
  }

  console.log('📋 [ITEM MODIFIER CONTENT] Rendering with data:', {
    itemName: item.name,
    hasVariations: !!modifierData.variations?.length,
    variationsCount: modifierData.variations?.length || 0,
    hasAddOnSections: !!modifierData.addOnSections?.length,
    addOnSectionsCount: modifierData.addOnSections?.length || 0,
    totalAddOns: modifierData.addOnSections?.reduce((sum, section) => sum + (section.addOns?.length || 0), 0) || 0,
  });

  // Detect template item (for input fields) vs saved custom item (show like regular item)
  const isCustomTemplate = item.isCustomTemplate;
  const isSavedCustomItem = item.isCustomItem && !item.isCustomTemplate;
  const isRegularItem = !item.isCustomTemplate && !item.isCustomItem;

  return (
    <div className="p-4 space-y-6">
      {/* Custom Item Inputs - ONLY for template (creating new custom item) */}
      {isCustomTemplate && onCustomNameChange && onCustomPriceChange && (
        <CustomItemInputs
          name={customItemName || ''}
          price={customItemPrice || 0}
          onNameChange={onCustomNameChange}
          onPriceChange={onCustomPriceChange}
        />
      )}

      {/* Item Info - Show for regular items AND saved custom items */}
      {(isRegularItem || isSavedCustomItem) && (
        <ItemInfo
          name={item.name}
          description={item.description}
          price={item.price}
          image={item.image}
          totalPrice={calculatePricePerItem()}
          isCustomItem={isSavedCustomItem}
        />
      )}

      {/* Variations - ONLY for regular items */}
      {isRegularItem && modifierData.variations && modifierData.variations.length > 0 && (
        <VariationSelector
          variations={modifierData.variations}
          selectedVariations={selectedVariations}
          onVariationChange={onVariationChange}
        />
      )}

      {/* Add-on Sections - ONLY for regular items */}
      {isRegularItem && modifierData.addOnSections && modifierData.addOnSections.length > 0 && (
        <AddOnSections
          sections={modifierData.addOnSections.sort((a: { required: boolean }, b: { required: boolean }) => {
            // Required sections first, then optional
            if (a.required && !b.required) return -1;
            if (!a.required && b.required) return 1;
            return 0;
          })}
          selectedAddOns={selectedAddOns}
          onAddOnToggle={onAddOnToggle}
        />
      )}

      {/* Frequently Bought Together - ONLY for regular items */}
      {isRegularItem && modifierData.frequentlyBoughtTogether && modifierData.frequentlyBoughtTogether.length > 0 && (
        <FrequentlyBoughtTogether
          items={modifierData.frequentlyBoughtTogether}
          selectedItems={isEditing ? [] : selectedFrequentlyBoughtItems}
          onItemToggle={isEditing ? () => {} : onFrequentlyBoughtItemToggle}
          disabled={isEditing}
        />
      )}

      {/* Special Instructions - Show for ALL items */}
      <SpecialInstructions
        value={specialInstructions}
        onChange={onSpecialInstructionsChange}
      />

      {/* Bottom Spacing for better scroll experience */}
      <div className="h-4" />
    </div>
  );
});

ItemModifierContent.displayName = 'ItemModifierContent';
