import { useMemo, useCallback, useState } from 'react';
import OrderSection from './order-section';
import { Slot, OrderType } from '@/types/pos';
import { useSlotManagement } from '../_hooks/useSlotManagement';
import { OrderOverlay } from '@/components/pos';
import { useNavigationActions } from '@/lib/store/navigation';

export const HomePageContent = () => {
  const { navigateToMenu } = useNavigationActions();
  const [openOrder, setOpenOrder] = useState<{ isOpen: boolean; slot: Slot | null }>({ isOpen: false, slot: null });
  
  // Custom hooks for state management
  const {
    slots,
    selectedSlot,
    handleSelect,
    handleSwap,
    handleDeleteSlot,
    refetchSlots,
    createNewSlot
  } = useSlotManagement();

  // Navigation handlers - PWA-first with Zustand navigation
  const handleSlotClick = useCallback((slot: Slot) => {
    // Prevent navigation if we're in edit/swap mode (any slot is selected)
    if (selectedSlot) {
      return;
    }

    // Type assertion for navigation - orderType is guaranteed to be one of these
    const orderType = slot.orderType as 'dine-in' | 'take-away' | 'delivery';

    if (slot.status === 'draft') {
      navigateToMenu(slot.id, orderType, 'draft');
    } else if (slot.status === 'available') {
      navigateToMenu(slot.id, orderType, 'normal');
    } else if (slot.status === 'processing') {
      // Ensure payment status is set correctly for overlay
      if (!slot.paymentStatus && slot.paymentMethod === 'unpaid') {
        slot.paymentStatus = 'unpaid';
      }
      // Open order details overlay for processing orders
      setOpenOrder({ isOpen: true, slot });
    } else {
      console.log('Opening order details for:', slot);
    }
  }, [navigateToMenu, selectedSlot]);

  const handleAddOrder = useCallback(async (orderType: OrderType) => {
    console.log(`🎯 [ADD ORDER] Creating new ${orderType} slot...`);

    try {
      // Create new slot and ensure it's properly saved
      const newSlot = await createNewSlot(orderType);
      console.log(`✅ [SLOT CREATED] New slot: ${newSlot.id} (${orderType})`);

      // Small delay to ensure slot is persisted and available
      await new Promise(resolve => setTimeout(resolve, 50));

      // PWA-first navigation - instant state change
      console.log(`🚀 [NAVIGATION] Navigating to menu with slot: ${newSlot.id}`);
      // Type assertion for navigation - orderType is guaranteed to be one of these
      navigateToMenu(newSlot.id, orderType as 'dine-in' | 'take-away' | 'delivery', 'normal');

    } catch (error) {
      console.error(`❌ [CREATE ERROR] Failed to create ${orderType} slot:`, error);
      alert(`Unable to create new ${orderType} slot. Please try again.`);
    }
  }, [createNewSlot, navigateToMenu]);

  // Memoized section data to prevent unnecessary re-renders filhal
  const sectionData = useMemo(() => [
    {
      key: 'dine-in' as const,
      title: 'Dine In',
      orderType: 'dine-in' as const,
      slots: slots['dine-in'],
      isMainSection: true
    },
    {
      key: 'take-away' as const,
      title: 'Take Away',
      orderType: 'take-away' as const,
      slots: slots['take-away'],
      isMainSection: false
    },
    {
      key: 'delivery' as const,
      title: 'Delivery',
      orderType: 'delivery' as const,
      slots: slots.delivery,
      isMainSection: false
    }
  ], [slots]);

  return (
    <div className="h-full w-full bg-background flex flex-col overflow-hidden scrollbar-hide">
      {/* Main Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-5 py-6 scrollbar-hide">
        <div className="w-full space-y-6">

          {sectionData.map(({ key, title, orderType, slots: sectionSlots, isMainSection }) => (
            <OrderSection
              key={key}
              title={title}
              orderType={orderType}
              slots={sectionSlots}
              onSlotClick={handleSlotClick}
              onAddOrder={handleAddOrder}
              isMainSection={isMainSection}
              selectedIndex={selectedSlot?.section === key ? selectedSlot.index : null}
              onSelect={(index) => handleSelect(index, key)}
              onSwap={(fromIndex, toIndex) => handleSwap(fromIndex, toIndex, key)}
              onDeleteSlot={(slotId) => handleDeleteSlot(slotId, key)}
              selectedSlot={selectedSlot}
            />
          ))}
        </div>
      </div>
      {openOrder.isOpen && openOrder.slot && (
        <OrderOverlay
          isOpen={openOrder.isOpen}
          onClose={() => {
            setOpenOrder({ isOpen: false, slot: null });
            refetchSlots(); // Refetch slots when closing overlay to ensure updated status
          }}
          slotId={openOrder.slot.id}
          orderNumber={openOrder.slot.orderId || 'N/A'}
          orderType={(openOrder.slot.orderType === 'draft' ? 'dine-in' : openOrder.slot.orderType) as 'dine-in' | 'take-away' | 'delivery'}
          paymentMethod={openOrder.slot.paymentMethod as 'cash' | 'card' | 'online' | undefined}
          placedAt={openOrder.slot.startTime?.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) || 'N/A'}
          slot={openOrder.slot}
        >
          {/* Order details will be rendered by the OrderOverlay component */}
        </OrderOverlay>
      )}
    </div>
  );
};