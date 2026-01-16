/**
 * useOrderOverlay Hook - Professional Order Management
 *
 * PURPOSE: Clean abstraction for OrderOverlay logic
 * - Home page: Full sliding overlay with backdrop
 * - Orders page: Simple card that expands in place
 */

import { useAuthStore } from '@/lib/store/auth';
import { useManagerPin } from '@/components/providers/ManagerPinProvider';
import { useSlideOverlay } from './useSlideOverlay';
import { useOrderOverlayData } from './useOrderOverlayData';
import { formatCurrency, formatTime } from '@/lib/utils/format';
import { MOCK_DATA } from '@/lib/api/mockDataManager';
import type { Slot } from '@/types/pos';
import { useNavigationActions } from '@/lib/store/navigation';
import { useSettingsStore } from '@/lib/store/settings';

interface UseOrderOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  slotId: string;
  orderNumber: string | number;
  orderType: 'dine-in' | 'take-away' | 'delivery';
  paymentMethod?: 'cash' | 'card' | 'online';
  placedAt?: string;
  slot?: Slot;
  isMinimized?: boolean;
}

export const useOrderOverlay = ({
  isOpen,
  onClose,
  slotId,
  orderNumber: _orderNumber,
  orderType,
  paymentMethod,
  placedAt: _placedAt,
  slot,
  isMinimized = false
}: UseOrderOverlayProps) => {
  const { navigateToMenu } = useNavigationActions();
  const userRole = useAuthStore(state => state.user?.role ?? 'staff');
  const { requestManagerAuth } = useManagerPin();

  // 🔍 BULLETPROOF ORDER DATA LOADING: Use professional data loading hook
  const {
    cartItems,
    subtotal,
    tax,
    total,
    discount,
    cartDiscount,
    orderData: overlayOrder,
    isLoading,
    error
  } = useOrderOverlayData({
    slotId,
    orderNumber: _orderNumber,
    slot
  });

  // Only use slide overlay for home page (non-minimized mode)
  const slideOverlay = useSlideOverlay({
    isOpen: !isMinimized && isOpen,
    animationDuration: 500,
    onClose,
    isCartOpen: false
  });

  // Header data - show cashier name, not just role
  const userName = useAuthStore(state => state.user?.name);
  const roleLabel = `${userRole.charAt(0).toUpperCase()}${userRole.slice(1)}`; // Keep for return value
  const cashierName = userName || roleLabel;
  const orderMeta = `${cashierName} • ${orderType?.replace('-', ' ') || 'dine-in'} • ${overlayOrder?.paymentMethod || paymentMethod || 'cash'}`;

  // Order time calculation (when order was placed)
  const orderTime = overlayOrder?.placedAt ? formatTime(overlayOrder.placedAt) : (slot?.startTime ? formatTime(slot.startTime) : (_placedAt || 'Just now'));

  // Order date for meta line (date only, no time)
  const orderDate = (overlayOrder?.placedAt ? new Date(overlayOrder.placedAt) : (slot?.startTime ? new Date(slot.startTime) : new Date()))
    .toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });

  // Simple time status color based on slot's timeStatus (same as processed slots)
  const { orderTiming } = useSettingsStore();

  const getTimeColor = () => {
    // If we have an explicit timeStatus from the slot, respect it (backend-driven)
    if (slot?.timeStatus) {
      switch (slot.timeStatus) {
        case 'fresh': return 'text-success';
        case 'warning': return 'text-warning';
        case 'overdue': return 'text-destructive';
        default: return 'text-text-secondary';
      }
    }

    // Otherwise calculate dynamically based on order time if available
    const startTime = overlayOrder?.placedAt ? new Date(overlayOrder.placedAt) : (slot?.startTime ? new Date(slot.startTime) : null);

    if (startTime) {
      const elapsedMinutes = Math.floor((new Date().getTime() - startTime.getTime()) / 60000);

      if (elapsedMinutes >= orderTiming.criticalThreshold) {
        return 'text-destructive';
      } else if (elapsedMinutes >= orderTiming.warningThreshold) {
        return 'text-warning';
      } else {
        return 'text-success';
      }
    }

    return 'text-text-secondary';
  };

  // Status color and display name from centralized config (KDS-ready)
  const getStatusInfo = () => {
    const statusConfig = MOCK_DATA.orderStatusConfig;

    // Map slot status to display status (future-proof for KDS integration)
    let currentStatus: string;

    // 🎯 CRITICAL: Check overlay status first (completed orders have overlay.status = 'completed')
    const overlayStatus = overlayOrder?.status as string | undefined;
    if (overlayStatus === 'completed') {
      currentStatus = 'completed';
    } else if (overlayStatus === 'cancelled') {
      currentStatus = 'cancelled';
    }
    // Then check slot status for active orders
    else if (slot?.status === 'pending') {
      currentStatus = 'pending';
    } else if (slot?.status === 'processing') {
      currentStatus = 'in-progress';
    } else if (slot?.status === 'ready') {
      currentStatus = 'ready';
    } else if (slot?.status === 'completed') {
      currentStatus = 'completed';
    } else if (slot?.status === 'cancelled') {
      currentStatus = 'cancelled';
    } else if (slot?.status === 'draft') {
      currentStatus = 'pending'; // Draft orders show as pending
    } else if (slot?.status === 'occupied') {
      currentStatus = 'in-progress'; // Occupied slots show as in-progress
    } else if (slot?.status === 'available') {
      currentStatus = 'pending'; // Available slots show as pending
    } else {
      currentStatus = 'in-progress'; // Default fallback
    }

    const config = statusConfig[currentStatus as keyof typeof statusConfig];
    return {
      colorClass: config?.colorClass || 'text-text-secondary',
      displayName: config?.displayName || 'Processing'
    };
  };

  // Action handlers

  const handlePrint = () => {
    // TODO: Implement print functionality
  };

  const handleEdit = () => {
    if (!slot) return;

    const proceedToEdit = () => {
      console.log('✏️ [UNIFIED EDIT] Starting edit mode for order:', slotId);

      // Close overlay
      if (!isMinimized && slideOverlay) {
        slideOverlay.handleClose();
      } else {
        onClose();
      }

      // PWA-first navigation to menu page for editing
      navigateToMenu(slotId, orderType, 'edit');
    };

    // PAID ORDER: Require manager PIN authentication before editing
    if (slot.paymentStatus === 'paid') {
      console.log('🔐 [MANAGER PIN] Paid order edit requires manager authentication');
      requestManagerAuth(proceedToEdit);
    } else {
      // UNPAID ORDER: Direct edit
      proceedToEdit();
    }
  };


  const handleComplete = async () => {
    // Complete order: mark overlay as completed and set slot available
    try {
      console.log('🏁 [ORDER COMPLETE] Completing order for slot:', slotId, 'order:', _orderNumber);

      // Step 1: Mark the overlay as completed (so it never loads in cart again)
      if (_orderNumber) {
        const { useOrderOverlayStore } = await import('@/lib/store/order-overlay');
        const overlayStore = useOrderOverlayStore.getState();
        await overlayStore.markOrderCompleted(String(_orderNumber));
      }

      // Step 2: Set slot as available (no order reference)
      const { setSlotAvailable } = (await import('@/lib/store/unified-slots')).useUnifiedSlotStore.getState();
      await setSlotAvailable(slotId);

      // 🏆 PROFESSIONAL: No draft cleanup needed - using ORDER OVERLAYS as single source of truth
      console.log('✅ [ORDER COMPLETE] Order completed - using ORDER OVERLAY system');

      console.log('🧹 [ORDER COMPLETE] Order completed and slot cleaned for slot:', slotId);

      // Step 3: Close overlay
      if (!isMinimized && slideOverlay) {
        slideOverlay.handleClose();
      } else {
        onClose();
      }

      console.log('✅ [ORDER COMPLETE] Order completed successfully - slot available for next customer');
    } catch (e) {
      console.error('❌ Failed to complete order for slot', slotId, e);
    }
  };

  const handleDelete = () => {
    // TODO: Implement delete functionality
  };

  const handleCompletePayment = () => {
    // PWA-first navigation to menu to complete payment; cart will load from overlay store
    navigateToMenu(slotId, orderType, 'payment');
  };

  return {
    // Data
    cartItems,
    subtotal,
    tax,
    total,
    discount,
    cartDiscount,
    orderMeta,
    roleLabel,
    orderTime,
    orderDate,
    timeColor: getTimeColor(),
    statusInfo: getStatusInfo(),

    // Loading state
    isLoading,
    error,

    // Slide overlay (only for home page)
    slideOverlay: !isMinimized ? slideOverlay : null,

    // Actions
    handlePrint,
    handleEdit,
    handleComplete,
    handleDelete,
    handleCompletePayment,

    // Helper functions
    formatCurrency
  };
};