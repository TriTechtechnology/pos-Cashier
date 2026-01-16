'use client';

import { useEffect, useState } from 'react';
import {
  Home,
  ShoppingCart,
  Settings,
  DollarSign,
  X,
  Gift
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCustomerStore } from '@/lib/store/customer';
import { useSyncStatusStore } from '@/lib/services/syncService';
import { useNavigationActions } from '@/lib/store/navigation';
import LoyaltyCardScanner from '../pos/LoyaltyCardScanner';
import { LoyaltyCard } from '@/lib/api/loyalty';

interface MenuBubbleProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout?: () => void;
  flashColor?: string;
  onFlash?: () => void;
  isCartOpen?: boolean;
}

const MenuBubble: React.FC<MenuBubbleProps> = ({
  isOpen,
  onClose,
  flashColor,
  onFlash,
  isCartOpen = false
}) => {
  const { navigateToHome, navigateToOrders, navigateToSettings, navigateToInventory } = useNavigationActions();
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);
  const { setScannedCustomer, setScannerOpen, isScannerOpen } = useCustomerStore();

  // Sync status for animated border
  const { isOnline, isSyncing, pendingCount } = useSyncStatusStore();
  const [pendingPaidOrders, setPendingPaidOrders] = useState(0);
  

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setTimeout(() => setIsAnimating(true), 10);
    } else {
      setIsAnimating(false);
      setTimeout(() => setIsVisible(false), 250); // Wait for fade-out to complete
    }
  }, [isOpen]);

  // Subscribe to sync status changes for pending order count
  useEffect(() => {
    // Use pendingCount from sync status store (updated when orders are completed)
    setPendingPaidOrders(pendingCount);
  }, [pendingCount]);

  // Flash effect
  useEffect(() => {
    if (flashColor) {
      setIsFlashing(true);
      setTimeout(() => {
        setIsFlashing(false);
        if (onFlash) onFlash();
      }, 1000); // Flash for 1 second
    }
  }, [flashColor, onFlash]);

  const handleMenuClick = (action: string) => {
    switch (action) {
      case 'home':
        navigateToHome();
        break;
      case 'orders':
        navigateToOrders();
        break;
      case 'settings':
        navigateToSettings();
        break;
      case 'expenses':
        navigateToInventory();
        break;
      case 'loyalty-scan':
        setScannerOpen(true);
        // Don't close menu when scanner opens
        return;
    }
    onClose();
  };

  const handleLoyaltyCardFound = async (loyaltyCard: LoyaltyCard) => {
    // Convert loyalty card to customer info
    // We need to resolve the item names from menuItemId references
    const { MOCK_DATA } = await import('@/lib/api/mockDataManager');
    
    const customerInfo = {
      name: loyaltyCard.customerName,
      phone: loyaltyCard.customerPhone,
      email: loyaltyCard.customerEmail,
      loyaltyCardId: loyaltyCard.id,
      specialInstructions: loyaltyCard.specialInstructions,
      totalOrders: loyaltyCard.recentOrders.length,
      totalSpent: loyaltyCard.recentOrders.reduce((sum, order) => sum + order.total, 0),
      currentStamps: loyaltyCard.currentStamps,
      totalStamps: loyaltyCard.totalStamps,
      memberSince: loyaltyCard.memberSince,
      loyaltyCard: loyaltyCard,
      orderHistory: loyaltyCard.recentOrders.map(order => ({
        id: order.id,
        date: order.date,
        total: order.total,
        items: order.items.map(item => {
          // Resolve item name from menuItemId
          for (const category of MOCK_DATA.categories) {
            const menuItem = category.items.find(menuItem => menuItem.id === item.menuItemId);
            if (menuItem) return menuItem.name;
          }
          return 'Unknown Item';
        }),
        status: order.status
      }))
    };

    setScannedCustomer(customerInfo);
    setScannerOpen(false);
    onClose(); // Close menu when scanner closes
  };

  if (!isVisible) return null;

  // No hover effects for bubble menu - keeps solid appearance
  const hoverClasses = '';

  return (
    <div className={`fixed inset-0 z-30`}>
      {/* Backdrop with Smooth Blur Animation */}
      <div 
        className={`absolute inset-0 transition-all ease-in-out ${
          isAnimating 
            ? 'bg-black/30 backdrop-blur-sm opacity-100 duration-400' 
            : 'bg-black/0 backdrop-blur-none opacity-0 duration-400'
        }`}
        onClick={onClose}
      />
      
      {/* Menu Buttons - Perfect Inverted Triangle Formation */}
      <div className={`absolute top-[8px] transition-all duration-500 ease-out ${
        isCartOpen ? 'right-[34.8%]' : 'right-[20px]'
      }`}>
        
        {/* TOP ROW - 3 buttons */}
        
        {/* Close Button - Exact Logo Position */}
        <div 
          className={`absolute top-0 right-0 transition-all ease-out ${
            isAnimating 
              ? 'scale-100 opacity-100 duration-300' 
              : 'scale-100 opacity-0 duration-200'
          }`}
          style={{ 
            transitionDelay: isAnimating ? '100ms' : '0ms' 
          }}
        >
          <Button
            variant="icon"
            size="icon"
            onClick={onClose}
                         className={`w-[70px] h-[70px] bg-secondary rounded-full active:scale-100 active:shadow-inner transition-all duration-400 touch-manipulation select-none hover:bg-card ${hoverClasses} ${
               isFlashing ? 'ring-4 ring-opacity-70 scale-110' : ''
             } ${
               // Sync status border animation
               // Priority: Syncing > Offline > Pending Paid Orders > Online
               isSyncing
                 ? 'ring-4 ring-blue-500 animate-pulse'
                 : !isOnline
                   ? 'ring-4 ring-red-500 animate-pulse'
                   : pendingPaidOrders > 0
                     ? 'ring-4 ring-blue-400'
                     : 'ring-4 ring-green-500'
             }`}
            style={{
              borderColor: isFlashing ? flashColor : undefined,
              boxShadow: isFlashing
                ? `0 0 20px ${flashColor}`
                : isSyncing
                  ? '0 0 15px rgba(59, 130, 246, 0.5)' // Blue glow (syncing)
                  : !isOnline
                    ? '0 0 15px rgba(239, 68, 68, 0.5)' // Red glow (offline)
                    : pendingPaidOrders > 0
                      ? '0 0 15px rgba(96, 165, 250, 0.5)' // Blue glow (pending orders)
                      : '0 0 10px rgba(34, 197, 94, 0.3)', // Green glow (all synced)
            }}
          >
            <X className="w-8 h-8 text-text-primary" />
          </Button>
        </div>

        {/* TOP ROW - 2 buttons to the left of close */}
        
        {/* TOP ROW - Left of close button */}
        
        {/* Settings - Animated from logo position */}
        <div 
          className={`absolute transition-all ease-out ${
            isAnimating 
              ? 'top-0 -left-[224px] scale-100 opacity-100 duration-500' 
              : 'top-0 -left-[224px] scale-100 opacity-0 duration-200'
          }`}
          style={{ 
            transitionDelay: isAnimating ? '200ms' : '0ms' 
          }}
        >
                     <Button
             variant="icon"
             size="icon"
             onClick={() => handleMenuClick('settings')}
             className={`w-[70px] h-[70px] bg-secondary rounded-full active:scale-95 active:shadow-inner transition-all duration-150 touch-manipulation select-none hover:bg-card ${hoverClasses}`}
           >
            <Settings className="w-8 h-8 text-text-primary" />
          </Button>
        </div>

        {/* Expenses - Animated from logo position */}
        <div 
          className={`absolute transition-all ease-out ${
            isAnimating 
              ? 'top-0 -left-[147px] scale-100 opacity-100 duration-500' 
              : 'top-0 -left-[147px] scale-100 opacity-0 duration-200'
          }`}
          style={{ 
            transitionDelay: isAnimating ? '250ms' : '0ms' 
          }}
        >
                     <Button
             variant="icon"
             size="icon"
             onClick={() => handleMenuClick('expenses')}
             className={`w-[70px] h-[70px] bg-secondary rounded-full active:scale-95 active:shadow-inner transition-all duration-150 shadow-lg touch-manipulation select-none hover:bg-card ${hoverClasses}`}
           >
            <DollarSign className="w-8 h-8 text-text-primary" />
          </Button>
        </div>

        {/* Home - Animated from logo position */}
        <div 
          className={`absolute transition-all ease-out ${
            isAnimating 
              ? 'top-[69px] -left-[185px] scale-100 opacity-100 duration-500' 
              : 'top-[69px] -left-[185px] scale-100 opacity-0 duration-200'
          }`}
          style={{ 
            transitionDelay: isAnimating ? '300ms' : '0ms' 
          }}
        >
                     <Button
             variant="icon"
             size="icon"
             onClick={() => handleMenuClick('home')}
             className={`w-[70px] h-[70px] bg-secondary rounded-full active:scale-95 active:shadow-inner transition-all duration-150 shadow-lg touch-manipulation select-none hover:bg-card ${hoverClasses}`}
           >
            <Home className="w-8 h-8 text-text-primary" />
          </Button>
        </div>

        {/* Orders - Animated from logo position */}
        <div 
          className={`absolute transition-all ease-out ${
            isAnimating 
              ? 'top-[69px] -left-[108px] scale-100 opacity-100 duration-500' 
              : 'top-[69px] -left-[108px] scale-100 opacity-0 duration-200'
          }`}
          style={{ 
            transitionDelay: isAnimating ? '350ms' : '0ms' 
          }}
        >
                     <Button
             variant="icon"
             size="icon"
             onClick={() => handleMenuClick('orders')}
             className={`w-[70px] h-[70px] bg-secondary rounded-full active:scale-95 active:shadow-inner transition-all duration-150 shadow-lg touch-manipulation select-none hover:bg-card ${hoverClasses}`}
           >
            <ShoppingCart className="w-8 h-8 text-text-primary" />
          </Button>
        </div>

        {/* Loyalty Scanner - Animated from logo position */}
        <div 
          className={`absolute transition-all ease-out ${
            isAnimating 
              ? 'top-[138px] -left-[147px] scale-100 opacity-100 duration-500' 
              : 'top-[138px] -left-[147px] scale-100 opacity-0 duration-200'
          }`}
          style={{ 
            transitionDelay: isAnimating ? '400ms' : '0ms' 
          }}
        >
                     <Button
             variant="icon"
             size="icon"
             onClick={() => handleMenuClick('loyalty-scan')}
             className={`w-[70px] h-[70px] bg-secondary rounded-full active:scale-95 active:shadow-inner transition-all duration-150 shadow-lg touch-manipulation select-none hover:bg-card ${hoverClasses}`}
           >
            <Gift className="w-8 h-8 text-text-primary" />
          </Button>
        </div>
        
      </div>

      {/* Loyalty Card Scanner */}
      <LoyaltyCardScanner
        isOpen={isScannerOpen}
        onClose={() => setScannerOpen(false)}
        onCardFound={handleLoyaltyCardFound}
      />
    </div>
  );
};

export default MenuBubble;
