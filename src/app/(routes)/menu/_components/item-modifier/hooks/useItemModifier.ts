import { useState, useEffect } from 'react';
import { MenuItem, CartItemModifiers } from '@/types/pos';
import { getItemById } from '@/lib/api/mockDataManager';

interface UseItemModifierProps {
  item: MenuItem & { modifiers?: CartItemModifiers };
  isOpen: boolean;
  isEditing?: boolean;
  savedSelections?: {
    variations?: Array<{ id: string }>;
    addOns?: Array<{ id: string }>;
    specialInstructions?: string;
    quantity?: number;
  } | null;
}

export const useItemModifier = ({
  item,
  isOpen,
  isEditing = false,
  savedSelections = null
}: UseItemModifierProps) => {
  // State for modifiers
  const [modifierData, setModifierData] = useState<{
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
    addOnSections?: Array<{
      id: string;
      title: string;
      type: string;
      required: boolean;
      minSelections: number;
      maxSelections: number;
      addOns: Array<{
        id: string;
        name: string;
        price: number;
        required: boolean;
      }>;
    }>;
    frequentlyBoughtTogether?: Array<{
      id: string;
      name: string;
      price: number;
      description?: string;
      image?: string;
    }>;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedVariations, setSelectedVariations] = useState<Record<string, string>>({});
  const [selectedAddOns, setSelectedAddOns] = useState<Record<string, string[]>>({});
  const [selectedFrequentlyBoughtItems, setSelectedFrequentlyBoughtItems] = useState<string[]>([]);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [quantity, setQuantity] = useState(1);

  // Custom item state
  const [customItemName, setCustomItemName] = useState('');
  const [customItemPrice, setCustomItemPrice] = useState(0);

  // Load item modifier data when component opens
  useEffect(() => {
    if (isOpen && item.id) {
      loadModifierData();
      // Reset state when opening
      setSelectedVariations({});
      setSelectedAddOns({});
      setSelectedFrequentlyBoughtItems([]);
      setSpecialInstructions('');
      setQuantity(1);
    }
  }, [isOpen, item.id]);

  // Single effect to restore selections when modifierData is loaded (for editing)
  useEffect(() => {
    if (modifierData && isEditing && savedSelections) {
      // Restore variations
      if ((savedSelections.variations?.length ?? 0) > 0 && (modifierData.variations?.length ?? 0) > 0) {
        const newSelectedVariations: Record<string, string> = {};
        
        savedSelections.variations!.forEach((savedVariation: { id: string }) => {
          for (let sectionIndex = 0; sectionIndex < modifierData.variations!.length; sectionIndex++) {
            const section = modifierData.variations![sectionIndex];
            const option = section.options.find((opt: { id: string }) => opt.id === savedVariation.id);
            
            if (option) {
              newSelectedVariations[section.id] = option.id;
              break;
            }
          }
        });
        
        setSelectedVariations(newSelectedVariations);
      }
      
      // Restore add-ons
      if ((savedSelections.addOns?.length ?? 0) > 0 && (modifierData.addOnSections?.length ?? 0) > 0) {
        const newSelectedAddOns: Record<string, string[]> = {};
        
        savedSelections.addOns!.forEach((savedAddOn: { id: string }) => {
          for (let sectionIndex = 0; sectionIndex < modifierData.addOnSections!.length; sectionIndex++) {
            const section = modifierData.addOnSections![sectionIndex];
            const option = section.addOns.find((opt: { id: string }) => opt.id === savedAddOn.id);
            
            if (option) {
              if (!newSelectedAddOns[section.id]) {
                newSelectedAddOns[section.id] = [];
              }
              newSelectedAddOns[section.id].push(option.id);
              break;
            }
          }
        });
        
        setSelectedAddOns(newSelectedAddOns);
      }
      
      // Restore other selections
      if (savedSelections.specialInstructions) {
        setSpecialInstructions(savedSelections.specialInstructions);
      }
      
      if (savedSelections.quantity) {
        setQuantity(savedSelections.quantity);
      }
    }
  }, [modifierData, isEditing, savedSelections]);

  const loadModifierData = async () => {
    setLoading(true);
    try {
      // 🎨 CUSTOM ITEM: No variations/addons needed
      if (item.isCustomTemplate || item.isCustomItem) {
        setModifierData({
          variations: [],
          addOnSections: [],
          frequentlyBoughtTogether: []
        });
        setLoading(false);
        return;
      }

      // 🎯 PRIMARY SOURCE: Use modifiers from MenuItem (from backend API)
      if (item.modifiers && (item.modifiers.variations?.length || item.modifiers.addOns?.length)) {
        console.log('✅ [ITEM MODIFIER] Loading modifiers from MenuItem:', {
          itemName: item.name,
          hasVariations: !!item.modifiers.variations?.length,
          variationsCount: item.modifiers.variations?.length || 0,
          hasAddons: !!item.modifiers.addOns?.length,
          addonsCount: item.modifiers.addOns?.length || 0,
        });

        const transformedData = {
          variations: item.modifiers.variations ? [{
            id: 'variations',
            title: 'Variations',
            required: true,
            minSelections: 1,
            maxSelections: 1,
            options: item.modifiers.variations.map((v) => ({
              id: v.id,
              name: v.name,
              price: v.price,
              required: v.required ?? false
            }))
          }] : [],
          addOnSections: item.modifiers.addOns ? [{
            id: 'addOns',
            title: 'Add-ons',
            type: 'addon' as const,
            required: false,
            minSelections: 0,
            maxSelections: 10,
            addOns: item.modifiers.addOns.map((a) => ({
              id: a.id,
              name: a.name,
              price: a.price,
              required: a.required ?? false
            }))
          }] : [],
          frequentlyBoughtTogether: [] // TODO: Add support if backend provides this
        };

        console.log('✅ [ITEM MODIFIER] Transformed modifier data:', {
          variationSections: transformedData.variations?.length || 0,
          addOnSections: transformedData.addOnSections?.length || 0,
          addOns: transformedData.addOnSections?.[0]?.addOns?.length || 0
        });

        setModifierData(transformedData);
        setLoading(false);
        return;
      }

      console.log('⚠️ [ITEM MODIFIER] No modifiers found in MenuItem, falling back to mock data for:', item.name);

      // 🔄 FALLBACK: Load from mock data for backward compatibility
      let fullItem = getItemById(item.id);
      // Fallback: handle ids that may contain runtime suffixes
      if (!fullItem && item.id.includes('-')) {
        const parts = item.id.split('-');
        if (parts.length > 2) {
          const baseId = `${parts[0]}-${parts[1]}`;
          fullItem = getItemById(baseId);
        }
      }
      if (fullItem && fullItem.modifiers) {
        const transformedData = {
          variations: fullItem.modifiers.variations ? [{
            id: 'variations',
            title: 'Variations',
            required: true,
            minSelections: 1,
            maxSelections: 1,
            options: fullItem.modifiers.variations.map((v: { id: string; name: string; price: number; required?: boolean }) => ({
              id: v.id,
              name: v.name,
              price: v.price,
              required: v.required ?? false
            }))
          }] : [],
          addOnSections: fullItem.modifiers.addOns ? [{
            id: 'addOns',
            title: 'Add-ons',
            type: 'addon',
            required: false,
            minSelections: 0,
            maxSelections: 10,
            addOns: fullItem.modifiers.addOns.map((a: { id: string; name: string; price: number; required?: boolean }) => ({
              id: a.id,
              name: a.name,
              price: a.price,
              required: a.required ?? false
            }))
          }] : [],
          frequentlyBoughtTogether: fullItem.modifiers.frequentlyBoughtTogether ? 
            fullItem.modifiers.frequentlyBoughtTogether.map((relatedItemId: string) => {
              const relatedItem = getItemById(relatedItemId);
              return relatedItem ? {
                id: relatedItem.id,
                name: relatedItem.name,
                price: relatedItem.price,
                description: relatedItem.description,
                image: relatedItem.image || undefined
              } : null;
            }).filter((item): item is NonNullable<typeof item> => item !== null) : []
        };
        setModifierData(transformedData);

        // Preselect previously chosen modifiers (editing scenario)
        if (isEditing && item.modifiers) {
          // Restore variations
          if (item.modifiers.variations?.length && transformedData.variations?.length) {
            const newSelectedVariations: Record<string, string> = {};
            item.modifiers.variations.forEach((savedVar) => {
              const section = transformedData.variations![0];
              const match = section.options.find(opt => opt.id === savedVar.id);
              if (match) newSelectedVariations[section.id] = match.id;
            });
            setSelectedVariations(newSelectedVariations);
          }
          // Restore add-ons
          if (item.modifiers.addOns?.length && transformedData.addOnSections?.length) {
            const section = transformedData.addOnSections![0];
            const selectedIds: string[] = [];
            item.modifiers.addOns.forEach(savedAddOn => {
              const match = section.addOns.find(opt => opt.id === savedAddOn.id);
              if (match) selectedIds.push(match.id);
            });
            setSelectedAddOns({ [section.id]: selectedIds });
          }
          // Restore special instructions
          if (item.modifiers.specialInstructions) setSpecialInstructions(item.modifiers.specialInstructions);
        }
      } else {
        // Robust fallback: synthesize options from current item's modifiers so UI still renders
        if (item.modifiers && (item.modifiers.variations?.length || item.modifiers.addOns?.length)) {
          const synthesized = {
            variations: item.modifiers.variations?.length ? [{
              id: 'variations',
              title: 'Variations',
              required: true,
              minSelections: 1,
              maxSelections: 1,
              options: item.modifiers.variations.map(v => ({
                id: v.id,
                name: v.name,
                price: v.price,
                required: true
              }))
            }] : [],
            addOnSections: item.modifiers.addOns?.length ? [{
              id: 'addOns',
              title: 'Add-ons',
              type: 'addon',
              required: false,
              minSelections: 0,
              maxSelections: 10,
              addOns: item.modifiers.addOns.map(a => ({
                id: a.id,
                name: a.name,
                price: a.price,
                required: false
              }))
            }] : [],
            frequentlyBoughtTogether: []
          };
          setModifierData(synthesized);
          // Preselect from the same current modifiers
          if (isEditing) {
            if (item.modifiers.variations?.length && synthesized.variations?.length) {
              const newSelectedVariations: Record<string, string> = {};
              item.modifiers.variations.forEach(savedVar => {
                const section = synthesized.variations![0];
                const match = section.options.find(opt => opt.id === savedVar.id);
                if (match) newSelectedVariations[section.id] = match.id;
              });
              setSelectedVariations(newSelectedVariations);
            }
            if (item.modifiers.addOns?.length && synthesized.addOnSections?.length) {
              const section = synthesized.addOnSections![0];
              const selectedIds: string[] = [];
              item.modifiers.addOns.forEach(savedAddOn => {
                const match = section.addOns.find(opt => opt.id === savedAddOn.id);
                if (match) selectedIds.push(match.id);
              });
              setSelectedAddOns({ [section.id]: selectedIds });
            }
            if (item.modifiers.specialInstructions) setSpecialInstructions(item.modifiers.specialInstructions);
          }
        } else {
          setModifierData({
            variations: [],
            addOnSections: [],
            frequentlyBoughtTogether: []
          });
        }
      }
    } catch (error) {
      console.error('Error loading modifier data:', error);
      setModifierData({
        variations: [],
        addOnSections: [],
        frequentlyBoughtTogether: []
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVariationChange = (variationId: string) => {
    setSelectedVariations(prev => {
      // Find which section this variation belongs to
      const section = modifierData?.variations?.find((section: { id: string; options?: Array<{ id: string }> }) => 
        section.options?.some((opt: { id: string }) => opt.id === variationId)
      );
      
      if (section) {
        return { ...prev, [section.id]: variationId };
      }
      return prev;
    });
  };

  const handleAddOnToggle = (sectionId: string, addOnId: string) => {
    setSelectedAddOns(prev => {
      const currentSection = prev[sectionId] || [];
      const isSelected = currentSection.includes(addOnId);
      
      // Find the section to check selection rules
      const section = modifierData?.addOnSections?.find(s => s.id === sectionId);
      const isSingleSelection = section?.minSelections === 1 && section?.maxSelections === 1;
      const maxAllowed = section?.maxSelections || 50; // Default max of 50 as reasonable limit
      
      if (isSelected) {
        // Remove from selection
        return {
          ...prev,
          [sectionId]: currentSection.filter(id => id !== addOnId)
        };
      } else {
        // Add to selection
        if (isSingleSelection) {
          // For single selection, replace the entire selection
          return {
            ...prev,
            [sectionId]: [addOnId]
          };
        } else {
          // For multiple selection, check max limit before adding
          if (currentSection.length >= maxAllowed) {
            console.warn(`Maximum ${maxAllowed} add-ons allowed for section ${sectionId}`);
            return prev; // Don't add if at max limit
          }
          
          // Add to existing selection
          return {
            ...prev,
            [sectionId]: [...currentSection, addOnId]
          };
        }
      }
    });
  };

  const handleFrequentlyBoughtItemToggle = (itemId: string) => {
    setSelectedFrequentlyBoughtItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const isFormValid = (): boolean => {
    if (!modifierData) return false;

    // 🎨 CUSTOM TEMPLATE: Require name and price input
    if (item.isCustomTemplate) {
      return customItemName.trim().length > 0 && customItemPrice > 0;
    }

    // 🎨 SAVED CUSTOM ITEM: Always valid (already has name and price)
    if (item.isCustomItem) {
      return true;
    }

    // Check if variation is selected (if variations exist)
    if ((modifierData.variations?.length ?? 0) > 0 && Object.values(selectedVariations).length === 0) {
      return false;
    }

    // Check if all required add-on sections are completed
    if (modifierData.addOnSections) {
      for (const section of modifierData.addOnSections) {
        if (section.required) {
          const selectedCount = selectedAddOns[section.id]?.length || 0;
          const minRequired = section.minSelections || 1;

          if (selectedCount < minRequired) {
            return false;
          }
        }
      }
    }

    return true;
  };

  const calculateTotal = (): number => {
    if (!modifierData) return 0;
    
    let total = item.price * quantity;
    
    // Add variation price
    if (modifierData.variations) {
      Object.entries(selectedVariations).forEach(([sectionId, optionId]) => {
        const section = modifierData.variations!.find(s => s.id === sectionId);
        if (section) {
          const option = section.options.find(opt => opt.id === optionId);
          if (option) {
            total += option.price * quantity;
          }
        }
      });
    }
    
    // Add add-ons from all sections
    if (modifierData.addOnSections) {
      modifierData.addOnSections.forEach(section => {
        const selectedSectionAddOns = selectedAddOns[section.id] || [];
        section.addOns.forEach(addon => {
          if (selectedSectionAddOns.includes(addon.id)) {
            total += addon.price * quantity;
          }
        });
      });
    }
    
    // Round to whole number for PKR (no decimals)
    return Math.round(total);
  };

  const calculatePricePerItem = (): number => {
    if (!modifierData) return item.price;

    // 🎨 CUSTOM TEMPLATE: Return custom price being entered
    if (item.isCustomTemplate) {
      return Math.round(customItemPrice);
    }

    // 🎨 SAVED CUSTOM ITEM: Return item's saved price
    if (item.isCustomItem) {
      return Math.round(item.price);
    }

    let pricePerItem = item.price;
    
    // Add variation price
    if (modifierData.variations) {
      Object.entries(selectedVariations).forEach(([sectionId, optionId]) => {
        const section = modifierData.variations!.find(s => s.id === sectionId);
        if (section) {
          const option = section.options.find(opt => opt.id === optionId);
          if (option) {
            pricePerItem += option.price;
          }
        }
      });
    }
    
    // Add add-ons from all sections
    if (modifierData.addOnSections) {
      modifierData.addOnSections.forEach(section => {
        const selectedSectionAddOns = selectedAddOns[section.id] || [];
        section.addOns.forEach(addon => {
          if (selectedSectionAddOns.includes(addon.id)) {
            pricePerItem += addon.price;
          }
        });
      });
    }
    
    // Round to whole number for PKR (no decimals)
    return Math.round(pricePerItem);
  };

  const prepareCartItem = () => {
    if (!modifierData) return null;

    // 🎨 CUSTOM TEMPLATE: Return cart item with user-entered custom data
    if (item.isCustomTemplate) {
      const { isCustomTemplate: _, ...itemWithoutTemplate } = item; // Remove template flag
      return {
        ...itemWithoutTemplate,
        name: customItemName,
        price: Math.round(customItemPrice),
        category: 'custom',
        isCustomItem: true, // Mark as custom item (not template)
        modifiers: {
          variations: [],
          addOns: [],
          specialInstructions
        },
        calculatedPrice: Math.round(customItemPrice),
        originalPrice: Math.round(customItemPrice)
      };
    }

    // 🎨 SAVED CUSTOM ITEM: Return cart item with item's saved data
    if (item.isCustomItem) {
      return {
        ...item,
        name: item.name, // Use saved name
        price: Math.round(item.price), // Use saved price
        modifiers: {
          variations: [],
          addOns: [],
          specialInstructions
        },
        calculatedPrice: Math.round(item.price),
        originalPrice: Math.round(item.price)
      };
    }

    // Prepare modifiers with full data (ID, name, price)
    const modifiers: CartItemModifiers = {
      variations: Object.entries(selectedVariations).map(([sectionId, optionId]) => {
        const section = modifierData.variations?.find(s => s.id === sectionId);
        if (section) {
          const option = section.options.find(opt => opt.id === optionId);
          return option ? {
            id: option.id,
            name: option.name,
            price: option.price
          } : null;
        }
        return null;
      }).filter((item): item is { id: string; name: string; price: number } => item !== null),
      addOns: [],
      specialInstructions
    };
    
    // Collect add-ons with full data from all sections
    if (modifierData.addOnSections) {
      modifierData.addOnSections.forEach(section => {
        const selectedSectionAddOns = selectedAddOns[section.id] || [];
        selectedSectionAddOns.forEach(addonId => {
          const addon = section.addOns.find(a => a.id === addonId);
          if (addon) {
            modifiers.addOns?.push({
              id: addon.id,
              name: addon.name,
              price: addon.price
            });
          }
        });
      });
    }

    // Calculate prices
    const pricePerItem = Math.round(calculatePricePerItem());
    
    return {
      ...item,
      modifiers,
      calculatedPrice: pricePerItem,
      originalPrice: pricePerItem
    };
  };

  return {
    // State
    modifierData,
    loading,
    selectedVariations,
    selectedAddOns,
    selectedFrequentlyBoughtItems,
    specialInstructions,
    quantity,

    // Actions
    setSpecialInstructions,
    setQuantity,
    handleVariationChange,
    handleAddOnToggle,
    handleFrequentlyBoughtItemToggle,

    // Custom item state and actions
    customItemName,
    customItemPrice,
    setCustomItemName,
    setCustomItemPrice,

    // Computed values
    isFormValid,
    calculateTotal,
    calculatePricePerItem,
    prepareCartItem
  };
};
