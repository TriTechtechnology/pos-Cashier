'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Dropdown, DropdownOption } from '@/components/ui/Dropdown';
import { useCurrentSlotId, useOrderType, useCartActions } from '@/lib/store/cart-new';
import { useUnifiedSlotStore, useUnifiedSlotsByType } from '@/lib/store/unified-slots';
import { useOrderOverlayStore } from '@/lib/store/order-overlay';
import { Slot } from '@/types/pos';

interface SlotSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSlotSelected: (slotId: string) => void;
}

export const SlotSelector: React.FC<SlotSelectorProps> = ({
  isOpen,
  onClose,
  onSlotSelected
}) => {
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const slotId = useCurrentSlotId();
  const orderType = useOrderType();
  // Cart actions destructured for potential future use (slot switching, type changes)
  // Currently, slot transfer is handled via transferOrderToSlot in handleConfirm
  const { setCurrentSlot: _setCurrentSlot, setOrderType: _setOrderType } = useCartActions();
  const [selectedOrderType, setSelectedOrderType] = useState<string>('dine-in');

  // Get unified slots and overlays for draft detection
  const unifiedSlotStore = useUnifiedSlotStore();
  const rawSlots = useUnifiedSlotsByType(selectedOrderType as 'dine-in' | 'take-away' | 'delivery');
  const overlays = useOrderOverlayStore(state => state.overlays);

  // 🚀 BULLETPROOF: Draft detection (same logic as useSlotManagement)
  const draftSlotMap = useMemo(() => {
    const map = new Map<string, boolean>();
    try {
      const allSlots = Object.values(unifiedSlotStore.slots || {});

      Object.values(overlays || {}).forEach((order) => {
        // Only mark as draft if ALL conditions are true
        if (order.slotId &&
            order.status === 'active' &&
            order.paymentStatus !== 'paid' &&
            order.items && order.items.length > 0) {

          const slot = allSlots.find(s => s.id === order.slotId);
          if (slot && (slot.status === 'available' || slot.orderRefId === order.id)) {
            map.set(order.slotId, true);
          }
        }
      });
    } catch (error) {
      console.error('❌ [SLOT SELECTOR] Draft detection error:', error);
    }
    return map;
  }, [overlays, unifiedSlotStore.slots]);

  // Convert unified slots to legacy format with draft status
  const allSlots = useMemo(() => {
    return (rawSlots || []).map(unifiedSlot => {
      const slotStatus = unifiedSlot.status as 'available' | 'processing' | 'completed';
      const hasDraft = draftSlotMap.has(unifiedSlot.id);
      const displayStatus = (slotStatus === 'available' && hasDraft) ? 'draft' : slotStatus;

      // Find overlay ID for draft slots
      let orderId = unifiedSlot.orderRefId;
      if (displayStatus === 'draft' && !orderId) {
        const draftOverlay = Object.values(overlays || {}).find(o =>
          o.slotId === unifiedSlot.id &&
          o.status === 'active' &&
          o.paymentStatus !== 'paid' &&
          o.items && o.items.length > 0
        );
        if (draftOverlay) {
          orderId = draftOverlay.id;
        }
      }

      return {
        id: unifiedSlot.id,
        number: unifiedSlot.number,
        orderType: unifiedSlot.orderType,
        status: displayStatus, // ⬅️ CRITICAL: Includes draft status
        isActive: unifiedSlot.isActive,
        startTime: unifiedSlot.startTime,
        timeStatus: unifiedSlot.timeStatus,
        elapsedTime: unifiedSlot.elapsedTime,
        customerCount: unifiedSlot.customerCount,
        orderId: orderId,
        paymentMethod: unifiedSlot.paymentMethod,
        paymentStatus: unifiedSlot.paymentStatus,
        createdAt: unifiedSlot.createdAt,
        updatedAt: unifiedSlot.updatedAt
      } as Slot;
    });
  }, [rawSlots, draftSlotMap, overlays]);

  // Show ALL slots but determine which ones can be transferred to
  // RULE: Can only transfer draft orders to AVAILABLE slots (not draft, not processing)
  const slotsWithTransferability = allSlots.map(slot => ({
    ...slot,
    canTransferTo: slot.status === 'available' // Only empty available slots
  }));

  // Debug logging when slots change
  useEffect(() => {
    if (isOpen && slotsWithTransferability.length > 0) {
      console.log('🎯 [SLOT SELECTOR] Slots with status:',
        slotsWithTransferability.map(s => ({ id: s.id, status: s.status, canTransferTo: s.canTransferTo }))
      );
    }
  }, [isOpen, slotsWithTransferability]);

  const orderTypeOptions: DropdownOption[] = [
    { value: 'dine-in', label: 'Dine In' },
    { value: 'take-away', label: 'Take Away' },
    { value: 'delivery', label: 'Delivery' }
  ];


  // Sync selected order type with cart order type
  useEffect(() => {
    if (orderType) {
      setSelectedOrderType(orderType);
    } else {
      // If no order type in cart, default to dine-in
      setSelectedOrderType('dine-in');
    }
  }, [orderType]);

  const handleSlotSelect = (slot: Slot) => {
    setSelectedSlot(slot.id);
  };

  const handleConfirm = async () => {
    if (!selectedSlot) return;

    if (slotId && slotId !== selectedSlot) {
      // 🎯 DETERMINE ACTION: Draft transfer vs. Available slot switch
      const currentSlotData = allSlots.find(s => s.id === slotId);
      const isDraftTransfer = currentSlotData?.status === 'draft';

      if (isDraftTransfer) {
        // Draft order transfer - use transferOrderToSlot
        console.log('🔄 [SLOT SELECTOR] Transferring draft order from', slotId, 'to', selectedSlot);
        try {
          await useUnifiedSlotStore.getState().transferOrderToSlot(slotId, selectedSlot);
          onSlotSelected(selectedSlot);
          onClose();
        } catch (error) {
          console.error('❌ [SLOT SELECTOR] Draft transfer failed:', error);
          alert('Failed to transfer order. Please try again.');
        }
      } else {
        // Available → Available switch - just change slot
        console.log('🔄 [SLOT SELECTOR] Switching from available slot', slotId, 'to', selectedSlot);
        onSlotSelected(selectedSlot);
        onClose();
      }
    } else {
      // Initial slot selection (no current slot)
      console.log('✅ [SLOT SELECTOR] Initial slot selection:', selectedSlot);
      onSlotSelected(selectedSlot);
      onClose();
    }
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <>
      {/* Backdrop - Matches item modifier pattern EXACTLY */}
      <div
        className={`fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-40 transition-opacity duration-300 ease-out ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Slide Overlay - Responsive height with proper spacing */}
      <div
        className="bg-secondary rounded-[42px] w-full max-w-md flex flex-col overflow-hidden touch-pan-y transition-all duration-300 ease-out z-50"
        style={{
          position: 'fixed',
          top: '80px',
          left: '50%',
          maxHeight: 'calc(100vh - 120px)', // Responsive max height
          transform: isOpen ? 'translate(-50%, 0)' : 'translate(-50%, 20px)',
          opacity: isOpen ? 1 : 0,
          willChange: 'opacity, transform',
          backfaceVisibility: 'hidden',
          pointerEvents: isOpen ? 'auto' : 'none'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 flex flex-col h-full">
        <div className="text-center mb-4 flex-shrink-0">
          
          
          {/* Clean Header with Current Slot and Order Type */}
          <div className="flex items-center  gap-4 mb-4 ">
            
            {/* Current Slot Display */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-primary/10 border-2 border-primary/20 rounded-lg flex items-center justify-center">
                <span className="text-lg font-bold text-primary">
                  {slotId ? slotId : '?'}
                </span>
              </div>
            </div>
            <h2 className="text-xl font-bold text-center text-text-primary mb-1">Slot Management</h2>
            {/* Order Type Dropdown */}
            <div className="text-right">
              <Dropdown
                options={orderTypeOptions}
                value={selectedOrderType}
                onChange={(value) => {
                  setSelectedOrderType(value); // Only update local state
                  setSelectedSlot(''); // Reset selection when type changes
                }}
                size="sm"
                className="w-36"
              />
            </div>
          </div>
        </div>

        <div className="space-y-3 mb-6 max-h-64 overflow-y-auto scrollbar-hide">
          {slotsWithTransferability.length === 0 ? (
            <div className="text-center py-4 text-text-secondary">No slots available</div>
          ) : (
            slotsWithTransferability.map((slot) => {
              // Determine badge styling based on actual slot status
              const getBadgeStyle = () => {
                switch (slot.status) {
                  case 'draft':
                    return {
                      bg: 'bg-yellow-100 dark:bg-yellow-900/20',
                      text: 'text-yellow-800 dark:text-yellow-400',
                      label: 'Draft'
                    };
                  case 'processing':
                    return {
                      bg: 'bg-blue-100 dark:bg-blue-900/20',
                      text: 'text-blue-800 dark:text-blue-400',
                      label: 'Processing'
                    };
                  case 'available':
                  default:
                    return {
                      bg: 'bg-green-100 dark:bg-green-900/20',
                      text: 'text-green-800 dark:text-green-400',
                      label: 'Available'
                    };
                }
              };

              const badge = getBadgeStyle();
              const isDisabled = !slot.canTransferTo;

              return (
                <button
                  key={slot.id}
                  onClick={() => !isDisabled && handleSlotSelect(slot)}
                  disabled={isDisabled}
                  className={`w-full p-4 rounded-lg border transition-colors relative ${
                    isDisabled
                      ? 'bg-card/50 text-text-secondary border-border/50 opacity-60 cursor-not-allowed'
                      : selectedSlot === slot.id
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card text-text-primary border-border active:bg-accent/50 cursor-pointer'
                  }`}
                >
                  {/* Status Badge - Top Right with dynamic status */}
                  <div className="absolute top-2 right-2">
                    <div className={`text-xs px-2 py-1 rounded-full ${badge.bg} ${badge.text}`}>
                      {badge.label}
                    </div>
                  </div>

                  {/* Locked indicator for disabled slots */}
                  {isDisabled && (
                    <div className="absolute top-2 left-2">
                      <div className="text-xs px-2 py-1 rounded-full bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400">
                        🔒 Locked
                      </div>
                    </div>
                  )}

                  <div className={`text-left ${isDisabled ? 'pr-16' : 'pr-16'}`}>
                    <div className="font-semibold">{slot.id}</div>
                    <div className="text-sm opacity-80 capitalize">{slot.orderType.replace('-', ' ')}</div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Buttons - flex-shrink-0 to stay at bottom */}
        <div className="flex gap-3 flex-shrink-0">
          <Button
            variant="line"
            onClick={handleCancel}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            variant="fill"
            onClick={handleConfirm}
            disabled={!selectedSlot}
            className="flex-1"
          >
            Confirm
          </Button>
        </div>
        </div>
      </div>
    </>
  );
};
