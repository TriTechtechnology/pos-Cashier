import React from 'react';
import { MenuItem } from '@/types/pos';
import { cn } from '@/lib/utils';
import { FoodIcon } from '@/components/ui/FoodIcon';
import { useSettingsStore } from '@/lib/store/settings';

// Pastel colors for the cards
const PASTEL_COLORS = [
    'bg-red-100 hover:bg-red-200 border-red-200',
    'bg-orange-100 hover:bg-orange-200 border-orange-200',
    'bg-amber-100 hover:bg-amber-200 border-amber-200',
    'bg-yellow-100 hover:bg-yellow-200 border-yellow-200',
    'bg-lime-100 hover:bg-lime-200 border-lime-200',
    'bg-green-100 hover:bg-green-200 border-green-200',
    'bg-emerald-100 hover:bg-emerald-200 border-emerald-200',
    'bg-teal-100 hover:bg-teal-200 border-teal-200',
    'bg-cyan-100 hover:bg-cyan-200 border-cyan-200',
    'bg-sky-100 hover:bg-sky-200 border-sky-200',
    'bg-blue-100 hover:bg-blue-200 border-blue-200',
    'bg-indigo-100 hover:bg-indigo-200 border-indigo-200',
    'bg-violet-100 hover:bg-violet-200 border-violet-200',
    'bg-purple-100 hover:bg-purple-200 border-purple-200',
    'bg-fuchsia-100 hover:bg-fuchsia-200 border-fuchsia-200',
    'bg-pink-100 hover:bg-pink-200 border-pink-200',
    'bg-rose-100 hover:bg-rose-200 border-rose-200',
];

interface CashierMenuItemCardProps {
    item: MenuItem;
    index: number;
    onClick: (item: MenuItem) => void;
    draggable?: boolean;
    isRearrangeMode?: boolean;
    icon?: React.ElementType;
    onLongPress?: () => void;
    onDragStart?: (e: React.DragEvent, index: number) => void;
    onDragOver?: (e: React.DragEvent, index: number) => void;
    onDrop?: (e: React.DragEvent, index: number) => void;
    isCartOpen?: boolean;
}

export const CashierMenuItemCard: React.FC<CashierMenuItemCardProps> = React.memo(({
    item,
    index,
    onClick,
    draggable = false,
    isRearrangeMode = false,
    icon: Icon,
    onLongPress,
    onDragStart,
    onDragOver,
    onDrop,
    isCartOpen = false
}) => {
    // Local state for drag visual feedback
    const [isDragOver, setIsDragOver] = React.useState(false);
    const [isPressed, setIsPressed] = React.useState(false);
    const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    // Get currency formatter from settings store
    const { formatCurrency } = useSettingsStore();

    // Responsive sizing based on cart state
    const sizeClasses = isCartOpen
        ? { icon: "w-6 h-6", title: "text-sm", price: "text-sm" }
        : { icon: "w-8 h-8", title: "text-xl", price: "text-lg" };

    // Deterministic color assignment based on item ID hash
    const colorIndex = React.useMemo(() => {
        let hash = 0;
        for (let i = 0; i < item.id.length; i++) {
            hash = item.id.charCodeAt(i) + ((hash << 5) - hash);
        }
        return Math.abs(hash) % PASTEL_COLORS.length;
    }, [item.id]);

    const colorClass = PASTEL_COLORS[colorIndex];

    const handlePointerDown = (_e: React.PointerEvent) => {
        // Only start timer if not already in rearrange mode
        if (!isRearrangeMode && onLongPress) {
            setIsPressed(true);
            timeoutRef.current = setTimeout(() => {
                onLongPress();
                setIsPressed(false); // Reset press visual on activation
                // Optional: Vibrate if supported
                if (navigator.vibrate) navigator.vibrate(50);
            }, 2000); // 2 seconds hold
        }
    };

    const handlePointerUp = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        setIsPressed(false);
    };

    const handlePointerLeave = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        setIsPressed(false);
    };

    const handleClick = () => {
        // Only trigger click if NOT in rearrange mode
        // Note: When draggable is true, onClick might be suppressed by drag events anyway,
        // but this is a safety check.
        if (!isRearrangeMode) {
            onClick(item);
        }
    };

    const handleDragStart = (e: React.DragEvent) => {
        if (onDragStart && draggable) {
            e.dataTransfer.effectAllowed = 'move';
            onDragStart(e, index);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        if (onDragOver) {
            onDragOver(e, index);
            if (!isDragOver) setIsDragOver(true);
        }
    };

    const handleDragLeave = () => {
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        if (onDrop) {
            onDrop(e, index);
        }
    };

    return (
        <div
            onClick={handleClick}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerLeave}
            draggable={draggable}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{ fontFamily: '"Allerta Stencil", sans-serif' }}
            className={cn(
                "aspect-square w-full rounded-xl flex flex-col justify-between p-4 transition-all duration-200 select-none touch-manipulation relative overflow-hidden",
                colorClass,
                // Active/Press state visual (scaling down while holding)
                isPressed && !isRearrangeMode && "scale-95 duration-1000",
                // Drag Target visual
                isDragOver && "ring-4 ring-primary ring-offset-2 scale-105 z-10 opacity-90",
                // Draggable/Rearrange Mode visual
                draggable && "cursor-grab active:cursor-grabbing animate-pulse-slow",
                // Normal Interaction
                !draggable && "cursor-pointer active:scale-95"
            )}
        >
            {/* Top Left Icon */}
            <div className="flex justify-start w-full">
                {Icon ? (
                    <Icon className={`${sizeClasses.icon} text-black/80`} />
                ) : (
                    <FoodIcon itemName={item.name} className={`${sizeClasses.icon} text-black/80`} />
                )}
            </div>

            {/* Bottom Left Content */}
            <div className={cn(
                "flex flex-col items-start w-full text-left",
                draggable && "animate-wiggle"
            )}>
                <span className={cn(
                    "font-bold text-black leading-tight line-clamp-2",
                    sizeClasses.title
                )}>
                    {item.name}
                </span>
                {item.price > 0 && (
                    <span className={cn(
                        "font-bold text-neutral-600 mt-1",
                        sizeClasses.price
                    )}>
                        {formatCurrency(item.price)}
                    </span>
                )}
            </div>

            {/* Visual indicator for Drag Mode */}
            {draggable && (
                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary/50 animate-ping" />
            )}
        </div>
    );
});

CashierMenuItemCard.displayName = 'CashierMenuItemCard';
