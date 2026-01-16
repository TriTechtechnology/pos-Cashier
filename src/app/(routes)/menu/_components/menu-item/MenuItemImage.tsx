import { FoodIcon } from '@/components/ui/FoodIcon';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { Plus } from 'lucide-react';

interface MenuItemImageProps {
  item: {
    id: string;
    name: string;
    image?: string;
    isCustomTemplate?: boolean;
    isCustomItem?: boolean;
  };
  itemPrefs: {
    showImage: boolean;
    available: boolean;
  };
  hasItem: boolean;
  showImages: boolean;
  sizeClasses: {
    image: string;
  };
}

export const MenuItemImage: React.FC<MenuItemImageProps> = ({
  item,
  itemPrefs,
  hasItem,
  showImages,
  sizeClasses
}) => {
  // Detect custom items
  const isTemplate = item.isCustomTemplate;
  const isCustom = item.isCustomItem && !item.isCustomTemplate;

  return (
    <div className={`relative ${sizeClasses.image} bg-secondary flex items-center justify-center`}>
      {/* Custom Template - Show Plus Icon */}
      {isTemplate ? (
        <div className="flex items-center justify-center w-full h-full bg-primary/5">
          <Plus className="w-16 h-16 text-primary" strokeWidth={2.5} />
        </div>
      ) : /* Custom Item - Always show food icon */
      isCustom ? (
        <div className="flex items-center justify-center w-full h-full">
          <FoodIcon itemName={item.name} className="w-8 h-8 text-text-secondary" />
        </div>
      ) : /* Regular Item - Show image if enabled and available, otherwise food icon */
      (showImages && itemPrefs.showImage && item.image) ? (
        <OptimizedImage
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="flex items-center justify-center w-full h-full">
          <FoodIcon itemName={item.name} className="w-8 h-8 text-text-secondary" />
        </div>
      )}
      
      {/* Conditional Status Indicator */}
      <div className="absolute top-4 right-4">
        {!itemPrefs.available ? (
          // Red indicator for unavailable items
          <div className="w-2.5 h-2.5 rounded-full bg-destructive" />
        ) : hasItem ? (
          // Green indicator for items in cart
          <div className="w-2.5 h-2.5 rounded-full bg-success" />
        ) : null}
      </div>
      
      {/* Hover Overlay */}
      <div className="absolute inset-0 bg-transparent group-hover:bg-accent/5 transition-colors duration-200" />
    </div>
  );
};
