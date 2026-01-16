interface MenuItemContentProps {
  item: {
    name: string;
    price: number;
    isCustomTemplate?: boolean;
    isCustomItem?: boolean;
  };
  sizeClasses: {
    content: string;
    text: string;
    price: string;
  };
}

export const MenuItemContent: React.FC<MenuItemContentProps> = ({
  item,
  sizeClasses
}) => {
  // Detect custom template item
  const isTemplate = item.isCustomTemplate;
  const displayName = isTemplate ? 'Add Custom Item' : item.name;

  return (
    <div className={`px-4 py-3 bg-secondary flex items-center ${isTemplate ? 'justify-center' : 'justify-between'} ${sizeClasses.content}`}>
      {/* Item Name */}
      <h3 className={`font-semibold ${isTemplate ? 'text-primary' : 'text-text-primary'} ${sizeClasses.text} line-clamp-1 leading-tight ${isTemplate ? 'text-center' : 'flex-1 mr-2'}`}>
        {displayName}
      </h3>

      {/* Price - Hide for template */}
      {!isTemplate && (
        <p className={`font-bold text-text-primary flex-shrink-0 ${sizeClasses.price}`}>
          Rs. {Math.round(item.price)}
        </p>
      )}
    </div>
  );
};
