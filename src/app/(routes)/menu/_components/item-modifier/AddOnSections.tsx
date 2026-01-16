'use client';

import React from 'react';

/**
 * Local interface for add-on sections to avoid circular dependencies
 * 
 * ADMIN-DRIVEN CONFIGURATION:
 * All rules are dynamically set by the client admin module:
 * - required: boolean - Admin decides if section is mandatory
 * - minSelections: number - Admin-set minimum selections (e.g., "must choose at least 1 size")
 * - maxSelections: number - Admin-set maximum selections (default 50 for reasonable UX)
 * - type: Admin categorizes sections for business logic
 * - addOns: Admin manages available options and pricing
 */
interface AddOnSection {
  id: string;
  title: string;
  type: 'variation' | 'addon' | 'required'; // Admin-configured section type
  required: boolean; // Admin-configured: true = customer must make selection
  minSelections?: number; // Admin-configured: minimum required selections
  maxSelections?: number; // Admin-configured: maximum allowed selections (default 50)
  addOns: Array<{ 
    id: string; 
    name: string; 
    price: number; // Admin-configured pricing
  }>;
}
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Checkbox } from '@/components/ui/Checkbox';

interface AddOnSectionsProps {
  sections: AddOnSection[];
  selectedAddOns: Record<string, string[]>; // sectionId -> selected addon IDs
  onAddOnToggle: (sectionId: string, addOnId: string) => void;
}

export const AddOnSections: React.FC<AddOnSectionsProps> = ({
  sections,
  selectedAddOns,
  onAddOnToggle
}) => {
  const getSectionStatus = (section: AddOnSection) => {
    const selectedCount = selectedAddOns[section.id]?.length || 0;
    const minRequired = section.minSelections || 0;
    
    if (section.required) {
      if (selectedCount < minRequired) {
        return { variant: 'required' as const, text: `Required (${selectedCount}/${minRequired})` };
      } else {
        return { variant: 'completed' as const, text: 'Completed' };
      }
    } else {
      // Optional section - only show completed if something is selected
      if (selectedCount > 0) {
        return { variant: 'completed' as const, text: 'Completed' };
      } else {
        return { variant: 'optional' as const, text: 'Optional' };
      }
    }
  };

  const canSelectAddOn = (section: AddOnSection, addOnId: string) => {
    const selectedCount = selectedAddOns[section.id]?.length || 0;
    const maxAllowed = section.maxSelections || Infinity;
    const isSelected = selectedAddOns[section.id]?.includes(addOnId) || false;
    
    // Can always deselect
    if (isSelected) return true;
    
    // For single selection (minSelections === maxSelections === 1), allow switching
    if (section.minSelections === 1 && section.maxSelections === 1) {
      return true;
    }
    
    // Check if we can select more
    return selectedCount < maxAllowed;
  };

  return (
    <div className="space-y-6">
      {sections.map((section) => {
        const status = getSectionStatus(section);
        const selectedCount = selectedAddOns[section.id]?.length || 0;
        const minRequired = section.minSelections || 0;
        
        return (
          <div key={section.id} className="space-y-4">
            {/* Section Header */}
            <div className="flex items-center justify-between">
              <h4 className="text-xl font-medium text-text-primary font-inter">
                {section.title}
              </h4>
              <div className="flex items-center gap-2">
                <StatusBadge variant={status.variant}>
                  {status.text}
                </StatusBadge>
              </div>
            </div>
            
            {/* Section Description */}
            {section.required && (
              <div className="text-sm text-text-secondary">
                {section.minSelections && section.maxSelections && section.minSelections === section.maxSelections ? (
                  `Please select ${section.minSelections} option${section.minSelections > 1 ? 's' : ''}`
                ) : section.minSelections && section.maxSelections ? (
                  `Please select ${section.minSelections} to ${section.maxSelections} options`
                ) : section.minSelections ? (
                  `Please select at least ${section.minSelections} option${section.minSelections > 1 ? 's' : ''}`
                ) : (
                  'This selection is required'
                )}
              </div>
            )}
            {!section.required && (
              <div className="text-sm text-text-secondary">
                Optional - select what you like
              </div>
            )}
            
            {/* Checkboxes */}
            <div className="space-y-2">
              {section.addOns.map((addon) => {
                const isSelected = selectedAddOns[section.id]?.includes(addon.id) || false;
                const canSelect = canSelectAddOn(section, addon.id);
                
                return (
                  <Checkbox
                    key={addon.id}
                    checked={isSelected}
                    onChange={() => onAddOnToggle(section.id, addon.id)}
                    label={addon.name}
                    price={addon.price}
                    disabled={!canSelect}
                  />
                );
              })}
            </div>
            
            {/* Selection Limit Warning */}
            {section.maxSelections && selectedCount >= section.maxSelections && (
              <div className="p-2 bg-warning/10 border border-warning/20 rounded-lg">
                <p className="text-xs text-warning">
                  Maximum {section.maxSelections} selection{section.maxSelections > 1 ? 's' : ''} allowed
                </p>
              </div>
            )}
            
            {/* Required Warning */}
            {section.required && selectedCount < minRequired && (
              <div className="p-2 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-xs text-destructive">
                  Please select at least {minRequired} option{minRequired > 1 ? 's' : ''}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
