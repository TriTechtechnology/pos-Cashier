'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Search, RefreshCw } from 'lucide-react';
import { OrderOverlay } from '@/components/pos';
import { Dropdown, DropdownOption } from '@/components/ui/Dropdown';
import { useOrderManagement } from '../_hooks/useOrderManagement';
import { OrderTabs } from './order-tabs';
import { useSafeSlotsByType } from '@/lib/store/unified-integration-wrapper';
import { useOrderOverlayStore } from '@/lib/store/order-overlay';

export const OrdersPageContent = () => {
  // Professional order management hook
  const {
    orders,
    isLoading,
    filters,
    tabCounts,
    handleFilterChange,
  } = useOrderManagement();

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingOrderCount, setPendingOrderCount] = useState(0);

  // Count pending orders for sync button
  useEffect(() => {
    const countPendingOrders = async () => {
      const overlayStore = useOrderOverlayStore.getState();
      const pendingOrders = await overlayStore.getPendingSyncOrders();
      setPendingOrderCount(pendingOrders.length);
    };

    countPendingOrders();
    const interval = setInterval(countPendingOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  // Get real-time slot data for accurate OrderOverlay display
  const dineInSlots = useSafeSlotsByType('dine-in') || [];
  const takeAwaySlots = useSafeSlotsByType('take-away') || [];
  const deliverySlots = useSafeSlotsByType('delivery') || [];

  // Debug: Check if orders are loading
  console.log('📊 [OrdersPageContent] Orders:', orders.length, orders);

  // State for managing minimized/expanded overlays
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // BULLETPROOF: Responsive column distribution for tablet optimization
  const columnDistribution = useMemo(() => {
    const col1: typeof orders = [];
    const col2: typeof orders = [];
    const col3: typeof orders = [];

    orders.forEach((order, index) => {
      // Distribute orders across columns for optimal tablet layout
      if (index % 3 === 0) col1.push(order);
      else if (index % 3 === 1) col2.push(order);
      else col3.push(order);
    });

    return { col1, col2, col3 };
  }, [orders]);

  // Find the actual slot data for the selected order
  const findSlotBySlotId = (slotId: string) => {
    const allSlots = [...dineInSlots, ...takeAwaySlots, ...deliverySlots];
    return allSlots.find(slot => slot.id === slotId);
  };

  // Handle order overlay toggle - use callback to prevent re-render issues
  const handleOrderToggle = (orderId: string) => {
    setExpandedOrderId(prev => prev === orderId ? null : orderId);
  };

  // Handle syncing orders
  const handleSyncOrders = async () => {
    setIsSyncing(true);
    try {
      const { syncService } = await import('@/lib/services/syncService');
      const result = await syncService.syncPendingOrders();
      console.log('✅ [ORDERS PAGE] Sync completed:', result);

      // Recount pending orders after sync
      const overlayStore = useOrderOverlayStore.getState();
      const pendingOrders = await overlayStore.getPendingSyncOrders();
      setPendingOrderCount(pendingOrders.length);
    } catch (error) {
      console.error('❌ [ORDERS PAGE] Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  // BULLETPROOF: Render order overlay with consistent logic and sync status inline
  const renderOrderOverlay = (order: typeof orders[0]) => {
    const realSlot = findSlotBySlotId(order.slotId);
    const isExpanded = expandedOrderId === order.id;

    // Use realSlot if available, otherwise ensure payment status from order
    if (realSlot && order.status === 'unpaid') {
      realSlot.paymentStatus = 'unpaid';
    }

    return (
      <div key={order.id} className="w-full">
        <OrderOverlay
          isOpen={false} // Never use sliding overlay on orders page
          onClose={() => setExpandedOrderId(null)}
          slotId={order.slotId}
          orderNumber={order.orderNumber}
          orderType={order.orderType}
          paymentMethod={order.paymentMethod}
          placedAt={order.placedAt}
          slot={realSlot}
          isMinimized={true} // Always minimized mode for orders page
          isExpanded={isExpanded} // Show expanded content when tapped
          onHeaderClick={() => handleOrderToggle(order.id)}
          syncStatus={order.status === 'completed' ? order.syncStatus : undefined} // Pass sync status for completed orders
        />
      </div>
    );
  };

  // Determine active tab from filters
  const activeTab = filters.statusFilter === 'all' ? 'all' : filters.statusFilter;

  const handleTabChange = (newTab: 'all' | 'pending' | 'in-progress' | 'ready' | 'completed' | 'cancelled' | 'unpaid') => {
    handleFilterChange({ statusFilter: newTab });
  };

  // Order type dropdown options
  const orderTypeOptions: DropdownOption[] = [
    { value: 'all', label: 'All Orders' },
    { value: 'dine-in', label: 'Dine-in' },
    { value: 'take-away', label: 'Take-away' },
    { value: 'delivery', label: 'Delivery' }
  ];

  // State for expandable search
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const searchContainerRef = React.useRef<HTMLDivElement>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // Collapse search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchExpanded(false);
      }
    };

    if (isSearchExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSearchExpanded]);

  // Focus input when expanded
  useEffect(() => {
    if (isSearchExpanded && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchExpanded]);

  return (
    <div className="h-full bg-background flex flex-col overflow-hidden">
      {/* Header with Tabs and Controls */}
      <div className="flex-shrink-0 w-full z-20 border-b border-border/20">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 px-5 py-3">
          {/* Order Tabs - Scrollable */}
          <div className="overflow-x-auto scrollbar-hide flex-1 min-w-0 w-full sm:w-auto">
            <OrderTabs
              activeTab={activeTab}
              onTabChange={handleTabChange}
              tabCounts={tabCounts}
            />
          </div>

          {/* Search and Controls */}
          <div className="flex items-center gap-3 w-full sm:w-auto flex-shrink-0">
            {/* Search Input - Expandable like menu header */}
            <div
              ref={searchContainerRef}
              onClick={() => !isSearchExpanded && setIsSearchExpanded(true)}
              className={`relative flex items-center bg-secondary border border-border rounded-xl transition-all duration-300 ease-in-out cursor-pointer h-[46px] select-none outline-none ring-0 focus:ring-0 shadow-none [WebkitTapHighlightColor:transparent] ${isSearchExpanded ? 'flex-1 sm:w-64 sm:flex-none' : 'w-[46px]'
                }`}
            >
              <div className={`absolute flex items-center justify-center transition-all duration-300 ${isSearchExpanded ? 'left-3' : 'inset-0'
                }`}>
                <Search className={`text-text-secondary transition-all ${isSearchExpanded ? 'w-4 h-4' : 'w-5 h-5'
                  }`} />
              </div>
              <input
                ref={searchInputRef}
                type="text"
                placeholder={isSearchExpanded ? "Search orders..." : ""}
                value={filters.searchQuery}
                onChange={(e) => handleFilterChange({ searchQuery: e.target.value })}
                className={`w-full bg-transparent border-none appearance-none text-text-primary placeholder-text-secondary focus:outline-none focus:ring-0 focus:ring-transparent focus-visible:ring-0 focus-visible:ring-transparent focus-visible:ring-offset-0 shadow-none transition-all duration-300 h-full ${isSearchExpanded
                  ? 'pl-10 pr-4 opacity-100 cursor-text'
                  : 'pl-0 pr-0 opacity-0 cursor-pointer pointer-events-none'
                  }`}
              />
            </div>

            {/* Sync Button - Next to search */}
            <button
              onClick={handleSyncOrders}
              disabled={isSyncing || pendingOrderCount === 0}
              className={`relative w-[46px] h-[46px] flex items-center justify-center bg-secondary border border-border rounded-xl transition-colors flex-shrink-0 ${pendingOrderCount > 0 && !isSyncing
                ? 'hover:bg-accent/50 text-primary'
                : 'text-text-secondary opacity-50 cursor-not-allowed'
                }`}
              title={pendingOrderCount > 0 ? `Sync ${pendingOrderCount} pending order${pendingOrderCount > 1 ? 's' : ''}` : 'No orders to sync'}
            >
              <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
              {pendingOrderCount > 0 && !isSyncing && (
                <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {pendingOrderCount}
                </span>
              )}
            </button>

            {/* Order Type Dropdown */}
            <div className="w-32 sm:w-36">
              <Dropdown
                options={orderTypeOptions}
                value={filters.orderTypeFilter}
                onChange={(value) => handleFilterChange({ orderTypeFilter: value as 'dine-in' | 'take-away' | 'delivery' })}
                placeholder="Order Type"
                size="md"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Orders Layout - Bulletproof overflow and positioning */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-5 pb-5 pt-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-text-secondary">Loading orders...</div>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-text-secondary mb-2">No orders found</div>
              <div className="text-text-secondary text-sm">Orders will appear here automatically</div>
            </div>
          </div>
        ) : (
          <div className="flex gap-4 items-start justify-center min-h-full px-2 sm:px-4 max-w-full mx-auto">
            {/* Column 1 - Always visible */}
            <div className="flex-1 max-w-sm space-y-4">
              {columnDistribution.col1.map(renderOrderOverlay)}
            </div>

            {/* Column 2 - Show on tablet landscape and up */}
            <div className="flex-1 max-w-sm space-y-4 hidden sm:block">
              {columnDistribution.col2.map(renderOrderOverlay)}
            </div>

            {/* Column 3 - Show on large tablets and desktop */}
            <div className="flex-1 max-w-sm space-y-4 hidden lg:block">
              {columnDistribution.col3.map(renderOrderOverlay)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
