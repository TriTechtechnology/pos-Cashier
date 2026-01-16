'use client';

// Local interface to avoid circular dependencies
interface ModifierVariation {
  id: string;
  name: string;
  price: number;
}

interface VariationSection {
  id: string;
  title: string;
  required: boolean;
  options: ModifierVariation[];
}

import { StatusBadge } from '@/components/ui/StatusBadge';
import { RadioButton } from '@/components/ui/RadioButton';

interface VariationSelectorProps {
  variations: VariationSection[];
  selectedVariations: Record<string, string>;
  onVariationChange: (variationId: string) => void;
}

export const VariationSelector: React.FC<VariationSelectorProps> = ({
  variations,
  selectedVariations,
  onVariationChange
}) => {
  const hasSelection = Object.keys(selectedVariations).length > 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-xl font-medium text-text-primary">Variations</h4>
        <StatusBadge variant={hasSelection ? 'completed' : 'required'}>
          {hasSelection ? 'Completed' : 'Required'}
        </StatusBadge>
      </div>
      
      {/* Radio Buttons */}
      <div className="space-y-3">
        {variations.map((variationSection) => (
          <div key={variationSection.id} className="space-y-3">
            <div className="space-y-2">
              {variationSection.options.map((option) => (
                <RadioButton
                  key={option.id}
                  name={`variation_${variationSection.id}`}
                  value={option.id}
                  checked={selectedVariations[variationSection.id] === option.id}
                  onChange={() => onVariationChange(option.id)}
                  label={option.name}
                  price={option.price}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
