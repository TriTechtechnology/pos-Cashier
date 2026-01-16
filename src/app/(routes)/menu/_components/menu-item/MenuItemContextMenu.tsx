import { Eye, EyeOff, Move, Trash2 } from 'lucide-react';

interface MenuItemContextMenuProps {
  showContextMenu: boolean;
  itemPrefs: {
    available: boolean;
    showImage: boolean;
  };
  isCustomItem?: boolean;
  isCustomTemplate?: boolean;
  onToggleAvailability: () => void;
  onToggleImage: () => void;
  onChangePosition: () => void;
  onDeleteCustomItem?: () => void;
}

export const MenuItemContextMenu: React.FC<MenuItemContextMenuProps> = ({
  showContextMenu,
  itemPrefs,
  isCustomItem,
  isCustomTemplate,
  onToggleAvailability,
  onToggleImage,
  onChangePosition,
  onDeleteCustomItem
}) => {
  if (!showContextMenu) return null;

  // Custom saved item - only show delete option
  const isSavedCustomItem = isCustomItem && !isCustomTemplate;

  return (
    <div
      className="absolute inset-0 bg-background/20 rounded-[42px] flex items-center justify-center z-50 animate-in fade-in-0 duration-150"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="bg-card border border-border rounded-lg shadow-lg min-w-32 animate-in zoom-in-95 slide-in-from-bottom-2 duration-150">
        <div className="p-1">
          {isSavedCustomItem ? (
            /* Custom Item - Only Delete Option */
            onDeleteCustomItem && (
              <button
                onClick={onDeleteCustomItem}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-md"
              >
                <Trash2 className="w-4 h-4" />
                Delete Custom Item
              </button>
            )
          ) : (
            /* Regular Item - Standard Options */
            <>
              <button
                onClick={onToggleAvailability}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-accent/50 rounded-md"
              >
                {itemPrefs.available ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {itemPrefs.available ? 'Mark Unavailable' : 'Mark Available'}
              </button>
              <button
                onClick={onToggleImage}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-accent/50 rounded-md"
              >
                {itemPrefs.showImage ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {itemPrefs.showImage ? 'Hide Image' : 'Show Image'}
              </button>
              <button
                onClick={onChangePosition}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-accent/50 rounded-md"
              >
                <Move className="w-4 h-4" />
                Change Position
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
