'use client';

import { useEffect, useState } from 'react';
import { Utensils } from 'lucide-react';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { FoodIcon } from '@/components/ui/FoodIcon';

interface ItemInfoProps {
  name?: string;
  description?: string;
  price?: number;
  image?: string;
  totalPrice?: number;
  isCustomItem?: boolean;
}

export const ItemInfo: React.FC<ItemInfoProps> = ({
  name,
  description,
  image,
  isCustomItem
}) => {
  const [imageError, setImageError] = useState(false);

  // Reset image error when image changes
  useEffect(() => {
    setImageError(false);
  }, [image]);

  // Safety check for required props
  if (!name) {
    return (
      <div className="space-y-4">
        <div className="relative h-48 rounded-xl overflow-hidden bg-card flex items-center justify-center">
          <Utensils className="w-16 h-16 text-text-secondary" />
        </div>
        <div className="space-y-2">
          <p className="text-sm text-text-secondary font-inter">
            {description || 'No description available'}
          </p>
        </div>
        <div className="border-t border-border/20" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Item Image */}
      <div className="relative h-48 rounded-3xl overflow-hidden bg-card flex items-center justify-center">
        {/* Custom items always use food icon, regular items can have images */}
        {!isCustomItem && !imageError && image ? (
          <OptimizedImage
            src={image}
            alt={name || 'Item'}
            className="w-full h-full object-cover"
            width={400}
            height={300}
          />
        ) : (
          <FoodIcon itemName={name} className="w-16 h-16 text-text-secondary" />
        )}
      </div>
      
      {/* Item Details */}
      <div className="space-y-2">
        {/* No price display - price only shown in header */}
        <div></div>
        
        {/* Description */}
        <p className="text-sm text-text-secondary font-inter">
          {description || 'No description available'}
        </p>
      </div>

      {/* Divider */}
      <div className="border-t border-border/20" />
    </div>
  );
};
