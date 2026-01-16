interface MenuItemSelectionIndicatorProps {
  isSelected: boolean;
  themeStyles: {
    selectionOverlay: string;
    selectionOverlayStyle: React.CSSProperties;
    selectionText: string;
    selectionTextStyle: React.CSSProperties;
  };
}

export const MenuItemSelectionIndicator: React.FC<MenuItemSelectionIndicatorProps> = ({
  isSelected,
  themeStyles
}) => {
  if (!isSelected) return null;

  return (
    <div 
      className={`absolute inset-0 rounded-[42px] flex items-center justify-center animate-in fade-in-0 zoom-in-95 duration-200 ${
        themeStyles.selectionOverlay === 'bg-opacity-20' ? 'bg-opacity-20' : themeStyles.selectionOverlay
      }`}
      style={themeStyles.selectionOverlayStyle}
    >
      <div 
        className={`px-3 py-1 rounded-full text-sm font-medium animate-in slide-in-from-bottom-2 duration-200 ${
          themeStyles.selectionText === 'text-primary-foreground' ? 'text-primary-foreground' : themeStyles.selectionText
        }`}
        style={themeStyles.selectionTextStyle}
      >
        Tap another item to swap
      </div>
    </div>
  );
};
