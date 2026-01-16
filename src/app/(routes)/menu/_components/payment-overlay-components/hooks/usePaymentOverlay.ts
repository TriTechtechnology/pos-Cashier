import { useState, useEffect } from 'react';
import { useCartItems, useCustomer, useOrderId, useCartActions, useCartStore } from '@/lib/store/cart-new';
import { useNavigationActions } from '@/lib/store/navigation';
import { useSafeSlotActions } from '@/lib/store/unified-integration-wrapper';
import { useUnifiedSlotStore } from '@/lib/store/unified-slots';
import { useCurrentSlotId } from '@/lib/store/cart-new';
// 🏆 PROFESSIONAL: Draft store eliminated - using ORDER OVERLAYS as single source of truth
import { formatCurrency } from '@/lib/utils/format';
import { useOrderOverlayStore } from '@/lib/store/order-overlay';
import { kitchenService } from '@/lib/kitchen/kitchen-service';
import { useSettingsStore } from '@/lib/store/settings';
// ⚡ PHASE 1: Use centralized cart sync service
import { syncCartToOverlay } from '@/lib/services/cartSyncService';
import { useAuthStore } from '@/lib/store/auth';

export type PaymentTab = 'cash' | 'card' | 'split';
export type PaymentStatus = 'idle' | 'processing' | 'completed' | 'failed';

// Tax rates by payment method (offline processing)
export const TAX_RATES = {
  cash: 16, // 16% for cash
  card: 5,  // 5% for card
  split: 16 // 16% for split (treated as cash)
} as const;

// Get current time with branch timezone
const getFormattedTime = (): string => {
  let timezone = 'Asia/Karachi';
  try {
    const data = localStorage.getItem('pos-branch-config-storage');
    if (data) {
      const parsed = JSON.parse(data);
      timezone = parsed?.state?.config?.timezone || 'Asia/Karachi';
    }
  } catch {}

  return new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: timezone
  });
};

interface UsePaymentOverlayProps {
  total: number;
  onOrderComplete?: () => void;
  onClose: () => void;
  slotId?: string | null;
  orderType?: 'dine-in' | 'take-away' | 'delivery' | null;
}

export const usePaymentOverlay = ({
  total,
  onOrderComplete,
  onClose,
  slotId = null
}: UsePaymentOverlayProps) => {
  const { navigateToHome } = useNavigationActions();
  const [activeTab, setActiveTab] = useState<PaymentTab>('cash');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('idle');
  const [showSplitPayments, setShowSplitPayments] = useState(false);
  const [showOrderComplete, setShowOrderComplete] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentTab>('cash');
  const [placedAt, setPlacedAt] = useState<string>('');
  const [orderNumber, setOrderNumber] = useState<string>('');
  const [isCompletingUnpaidOrder, setIsCompletingUnpaidOrder] = useState<boolean>(false);
  
  // Cash payment state
  const [cashAmount, setCashAmount] = useState('');
  const [cashChange, setCashChange] = useState(0);
  
  // Card payment state
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  
  // Split payment state
  const [splitPayments, setSplitPayments] = useState<Array<{
    method: PaymentTab;
    amount: number;
    reference?: string;
  }>>([]);
  
  const { clearCart } = useCartActions();
  const customer = useCustomer();
  const cartItems = useCartItems();
  const cartOrderId = useOrderId(); // BULLETPROOF: Use cart's order ID
  // 🏆 PROFESSIONAL: Draft store eliminated - using ORDER OVERLAYS as single source of truth
  const { setSlotProcessing, setSlotCompleted } = useSafeSlotActions();
  const currentSlotId = useCurrentSlotId(); // Get current slot from cart store
  const overlayStore = useOrderOverlayStore.getState();
  const { kitchen: kitchenSettings } = useSettingsStore();


  // Calculate cash change when cash amount changes
  useEffect(() => {
    const cash = parseFloat(cashAmount) || 0;
    setCashChange(Math.max(0, cash - total));
  }, [cashAmount, total]);

  // Handle payment completion
  const handlePaymentComplete = () => {
    setPaymentStatus('completed');
    setSelectedPaymentMethod(activeTab);
    setPlacedAt(getFormattedTime());

    // 🚨 CRITICAL FIX: Use cart's order ID ONLY, never generate new one here
    if (!cartOrderId) {
      console.error('❌ [PAYMENT] No cart order ID available! Cart should have generated this already.');
      return;
    }

    // 🎯 CRITICAL FIX: Check if completing unpaid order BEFORE showing overlay
    const targetSlotId = slotId || currentSlotId;
    if (targetSlotId) {
      const currentSlotState = useUnifiedSlotStore.getState().getSlot(targetSlotId);
      const isExistingOrder = currentSlotState?.status === 'processing' && currentSlotState?.orderRefId;
      const completingUnpaid = isExistingOrder && currentSlotState?.paymentStatus === 'unpaid';

      if (completingUnpaid) {
        console.log('💰 [PAYMENT COMPLETE] Completing unpaid order - setting flag BEFORE overlay');
        setIsCompletingUnpaidOrder(true);
      }
    }

    setOrderNumber(cartOrderId); // BULLETPROOF: Always use existing cart order ID
    setShowOrderComplete(true);
  };

  // REMOVED: Using shared generateOrderNumber from posUtils for consistency

  // Handle cash payment
  const handleCashPayment = () => {
    if (parseFloat(cashAmount) < total) {
      alert('Cash amount must be equal to or greater than total');
      return;
    }
    
    setPaymentStatus('processing');
    // Simulate payment processing
    setTimeout(() => {
      handlePaymentComplete();
    }, 1500);
  };

  // Handle card payment
  const handleCardPayment = () => {
    if (!cardNumber || !cardHolder || !expiryDate || !cvv) {
      alert('Please fill in all card details');
      return;
    }
    
    setPaymentStatus('processing');
    // Simulate payment processing
    setTimeout(() => {
      handlePaymentComplete();
    }, 2000);
  };

  // Handle offline card payment
  const handleOfflineCardPayment = () => {
    setPaymentStatus('processing');
    // Simulate offline card processing
    setTimeout(() => {
      handlePaymentComplete();
    }, 1500);
  };

  // Handle split bill payment
  const handleSplitBillPayment = (splitData: { numberOfPersons: number; amountPerPerson: number; totalAmount: number }) => {
    console.log('💳 [SPLIT BILL] Processing split payment:', splitData);
    setPaymentStatus('processing');
    // Simulate split payment processing (each person paying their share)
    setTimeout(() => {
      handlePaymentComplete();
    }, 1500);
  };

  // Get current tax rate based on active payment tab
  const currentTaxRate = TAX_RATES[activeTab];

  // Handle split payment
  const handleSplitPayment = () => {
    if (splitPayments.length === 0) {
      alert('Please add at least one split payment method');
      return;
    }
    
    const totalSplit = splitPayments.reduce((sum, payment) => sum + payment.amount, 0);
    if (Math.abs(totalSplit - total) > 0.01) {
      alert(`Split payments must equal total amount. Current: ${formatCurrency(totalSplit)}, Required: ${formatCurrency(total)}`);
      return;
    }
    
    setPaymentStatus('processing');
    // Simulate split payment processing
    setTimeout(() => {
      handlePaymentComplete();
    }, 2500);
  };

  // Add split payment method
  const addSplitPayment = (method: PaymentTab) => {
    const remainingAmount = total - splitPayments.reduce((sum, payment) => sum + payment.amount, 0);
    if (remainingAmount <= 0) {
      alert('Total amount already covered by split payments');
      return;
    }
    
    setSplitPayments([...splitPayments, {
      method,
      amount: remainingAmount
    }]);
  };

  // Remove split payment
  const removeSplitPayment = (index: number) => {
    setSplitPayments(splitPayments.filter((_, i) => i !== index));
  };

  // Update split payment amount
  const updateSplitAmount = (index: number, amount: number) => {
    const updated = [...splitPayments];
    updated[index].amount = amount;
    setSplitPayments(updated);
  };

  // Handle keypad input for cash
  const handleKeypadInput = (value: string) => {
    if (value === '.') {
      if (!cashAmount.includes('.')) {
        setCashAmount(prev => prev + value);
      }
    } else {
      setCashAmount(prev => prev + value);
    }
  };

  // Handle keypad clear
  const handleKeypadClear = () => {
    setCashAmount('');
  };

  // Handle keypad backspace
  const handleKeypadBackspace = () => {
    setCashAmount(prev => prev.slice(0, -1));
  };

  // Handle order completion
  const handleOrderComplete = () => {
    // Clear cart
    clearCart();
    
    // Close payment overlay
    onClose();
    
    // Call parent callback
    if (onOrderComplete) {
      onOrderComplete();
    }
  };

  // Handle print receipt
  const handlePrintReceipt = () => {
    // TODO: Implement print receipt functionality
    console.log('Printing receipt...');
  };

  // Handle go to home
  const handleGoToHome = async () => {
    // ROBUST SLOT TARGETING - Prevent orders from going to wrong slots
    const targetSlotId = slotId || currentSlotId;
    
    console.log('🚀 [PAYMENT] Processing order completion');
    console.log('🎯 [SLOT TARGETING] Slot resolution:', { 
      providedSlotId: slotId, 
      currentSlotId, 
      targetSlotId,
      hasTargetSlot: !!targetSlotId,
      slotSource: slotId ? 'provided' : currentSlotId ? 'current' : 'none'
    });
    console.log('👤 [CUSTOMER] Customer info:', {
      hasCustomer: !!customer,
      customerName: customer?.name || 'N/A'
    });
    console.log('🛒 [ORDER] Cart details:', {
      total,
      itemCount: cartItems?.length || 0,
      hasItems: !!(cartItems && cartItems.length > 0)
    });
    
    // CRITICAL: Ensure we have a valid slot ID before processing
    if (!targetSlotId) {
      console.error('❌ [CRITICAL] No slot ID available for order placement!');
      alert('Error: No slot selected for order placement.\n\nPlease ensure you have selected a table/slot before placing the order.');
      return;
    }
    
    try {
      // Check if this is an existing order (paid or unpaid) or a new advance payment FIRST
      const currentSlotState = useUnifiedSlotStore.getState().getSlot(targetSlotId);
      const isExistingOrder = currentSlotState?.status === 'processing' && currentSlotState?.orderRefId;
      const completingUnpaidOrder = isExistingOrder && currentSlotState?.paymentStatus === 'unpaid';
      const completingPaidOrderWithAdditions = isExistingOrder && currentSlotState?.paymentStatus === 'paid';

      console.log('🔍 [ORDER TYPE DETECTION]:', {
        slotId: targetSlotId,
        currentStatus: currentSlotState?.status,
        currentPaymentStatus: currentSlotState?.paymentStatus,
        hasOrderRef: !!currentSlotState?.orderRefId,
        isExistingOrder,
        completingUnpaidOrder,
        completingPaidOrderWithAdditions
      });

      // Update state for UI
      setIsCompletingUnpaidOrder(!!completingUnpaidOrder);

      console.log('🎯 [PRE-VALIDATION] Slot payment context:', {
        slotId: targetSlotId,
        currentStatus: currentSlotState?.status,
        currentPaymentStatus: currentSlotState?.paymentStatus,
        completingUnpaidOrder,
        hasCartItems: !!(cartItems && cartItems.length > 0),
        hasExistingOrderRef: !!currentSlotState?.orderRefId
      });

      // SMART VALIDATION: For existing unpaid orders, use overlay details (overlay-first)
      let orderItems;
      let orderCustomer;

      if (completingUnpaidOrder) {
        console.log('💰 [EXISTING UNPAID] Loading active overlay for completion');
        const overlay = await useOrderOverlayStore.getState().getActiveOrderBySlot(targetSlotId);
        if (overlay?.items?.length) {
          orderItems = overlay.items.map((item: any, index: number) => ({
            uniqueId: `order-${overlay.id}-${index}`,
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            totalPrice: item.total || item.price,
            category: item.category || 'food',
            description: item.description || '',
            image: item.image || '',
            available: true,
            modifiers: item.modifiers || { variations: [], addOns: [] },
            // 🎯 CRITICAL: Mark all items as paid when completing unpaid order
            isPaid: true,
            originalOrderId: overlay.id
          }));
          orderCustomer = overlay.customer || {
            name: 'Guest',
            phone: '',
            email: '',
            specialInstructions: '',
            currentStamps: 0,
            totalStamps: 0,
            totalSpent: 0
          };
        } else {
          console.warn('⚠️ [EXISTING UNPAID] No overlay found; falling back to cart');
        }
      }

      if (!orderItems) {
        // NEW ORDER: Use current cart items
        console.log('🆕 [NEW ORDER] Using current cart items');

        // CRITICAL: Ensure we have cart items for new orders
        if (!cartItems || cartItems.length === 0) {
          console.error('❌ [CRITICAL] No cart items for new order placement!');
          alert('Error: Cart is empty. Cannot place order without items.');
          return;
        }

        // 🏆 PROFESSIONAL CONVERSION: Convert cart items with payment status tracking
        orderItems = cartItems.map((item, index) => ({
          uniqueId: item.uniqueId || `new-order-${index}`,
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          totalPrice: item.totalPrice,
          category: item.category,
          available: item.available,
          description: item.description,
          image: item.image,
          modifiers: item.modifiers,
          // 🎯 MARK AS PAID: All items being paid now become paid items
          isPaid: true,
          originalOrderId: item.originalOrderId || cartOrderId || undefined
        }));

        // Create guest customer if none provided
        orderCustomer = customer || {
          name: 'Guest',
          phone: '',
          email: '',
          specialInstructions: '',
          currentStamps: 0,
          totalStamps: 0,
          totalSpent: 0
        };
      }

      console.log('👤 [CUSTOMER] Using customer:', orderCustomer?.name || 'Guest');
      console.log('📦 [ORDER] Order items for slot', targetSlotId + ':', orderItems);

      console.log('🎯 [PAYMENT ANALYSIS] Slot payment context:', {
        slotId: targetSlotId,
        currentStatus: currentSlotState?.status,
        currentPaymentStatus: currentSlotState?.paymentStatus,
        completingUnpaidOrder,
        workflow: (completingUnpaidOrder || completingPaidOrderWithAdditions)
          ? 'Complete existing order → Set to completed'
          : 'New advance payment → Keep processing until served'
      });

      // 🚀 LIGHTNING-FAST APPROACH: Separate slot UI state from order data
      console.log('⚡ [PHASE 1] Clean separation: Slot UI + Order Overlay architecture');

      // 🚨 CRITICAL FIX: Use cart's order ID ONLY, should already exist from cart overlay
      if (!cartOrderId) {
        console.error('❌ [PAYMENT] No cart order ID available in handleGoToHome! Cart should have generated this already.');
        alert('Error: Order ID not found. Please go back to cart and place order again.');
        return;
      }

      const finalOrderId = cartOrderId; // BULLETPROOF: Always use existing cart order ID

      // 1. Update slot UI state only (lightning fast)
      await setSlotProcessing(targetSlotId, {
        orderRefId: finalOrderId,
        paymentMethod: selectedPaymentMethod,
        paymentStatus: 'paid'
      });

      console.log('✅ [SLOT UI] Updated slot', targetSlotId, 'with order reference:', finalOrderId);

      // 2. Save complete order data to overlay store (source of truth) using centralized sync service
      // ⚡ PHASE 1: Use centralized cart sync service for consistent syncing
      // 🎯 CRITICAL: For completing unpaid orders, save directly as 'completed' with correct payment method

      // Get backend sync required fields from auth/till stores
      const user = useAuthStore.getState().user;

      // 🚨 CRITICAL FIX: Use actual cart totals, not approximations
      // Get accurate subtotal and tax from cart store
      const cartStore = useCartStore.getState();
      const cartState = targetSlotId ? cartStore.carts[targetSlotId] : null;
      const actualSubtotal = cartState?.subtotal || (total / 1.1); // Fallback: reverse calculate if cart missing
      const actualTax = cartState?.tax || (total - actualSubtotal); // Fallback: difference

      await syncCartToOverlay({
        orderId: finalOrderId,
        slotId: targetSlotId,
        orderType: currentSlotState?.orderType || 'dine-in',
        items: orderItems || [],
        customer: orderCustomer || { name: 'Guest', phone: '', email: '', specialInstructions: '', currentStamps: 0, totalStamps: 0, totalSpent: 0 },
        total: (completingUnpaidOrder ? ((await useOrderOverlayStore.getState().getActiveOrderBySlot(targetSlotId))?.total || total) : total) || total,
        subtotal: actualSubtotal, // ✅ Use actual cart subtotal
        tax: actualTax, // ✅ Use actual cart tax
        paymentStatus: 'paid',
        paymentMethod: selectedPaymentMethod, // 🎯 CRITICAL: Persist payment method for backend sync
        status: (completingUnpaidOrder || completingPaidOrderWithAdditions) ? 'completed' : 'active', // Mark as completed immediately if paying off existing order
        // 🎯 BACKEND SYNC REQUIRED FIELDS (from Postman collection)
        branchId: user?.branchId,       // From auth store
        posId: user?.posId,             // From auth store
        tillSessionId: undefined        // To be assigned during backend sync
      });

      console.log('✅ [ORDER OVERLAY] Saved complete order data for', finalOrderId);

      // 🚀 IMMEDIATE BACKEND SYNC FOR PRINTING
      // Sync order to backend immediately to get MongoDB _id for printing receipt
      console.log('📤 [BACKEND SYNC] Syncing order to backend for printing...');

      try {
        // Import placeOrder API
        const { placeOrder } = await import('@/lib/api/orders');

        // Get till session ID from local storage
        const tillSessionId = localStorage.getItem('till-session-id');

        if (!tillSessionId) {
          console.error('❌ [BACKEND SYNC] Missing till session ID');
          throw new Error('Till session ID not found');
        }

        // 🎯 CRITICAL: For unpaid orders, get total from overlay; for new orders, use cart total
        const orderTotal = completingUnpaidOrder
          ? ((await useOrderOverlayStore.getState().getActiveOrderBySlot(targetSlotId))?.total || total)
          : total;

        // Prepare order data for backend
        // Map split payment method to cash for backend API (split is treated as cash)
        const backendPaymentMethod = selectedPaymentMethod === 'split' ? 'cash' : selectedPaymentMethod;

        const backendOrderData = {
          branchId: user?.branchId || '',
          posId: user?.posId || '',
          tillSessionId: tillSessionId,
          customerName: orderCustomer?.name || 'Guest',
          notes: orderCustomer?.specialInstructions || undefined,
          items: orderItems?.map((item: any) => ({
            menuItemId: item.id,
            quantity: item.quantity,
            notes: [
              item.modifiers?.specialInstructions,
              item.modifiers?.notes,
              item.modifiers?.variations?.map((v: any) => v.name).join(', '),
              item.modifiers?.addOns?.map((a: any) => a.name).join(', ')
            ].filter(Boolean).join(' | ') || undefined
          })) || [],
          paymentMethod: backendPaymentMethod, // 'cash', 'card', or 'online' (split is mapped to cash)
          amountPaid: orderTotal // Total amount paid by customer (from overlay for unpaid, cart for new)
        };

        console.log('📦 [BACKEND SYNC] Order data:', backendOrderData);

        // Sync to backend
        const syncResult = await placeOrder(backendOrderData);

        if (syncResult.success && syncResult.orderId) {
          console.log('✅ [BACKEND SYNC] Order synced successfully, backend ID:', syncResult.orderId);

          // 🎯 CRITICAL: Store backend order ID in overlay for printing
          await overlayStore.updateOverlay(finalOrderId, {
            backendOrderId: syncResult.orderId,
            syncStatus: 'synced',
            lastSyncAttempt: new Date()
          });

          console.log('✅ [ORDER OVERLAY] Updated with backend order ID:', syncResult.orderId);
        } else {
          console.error('❌ [BACKEND SYNC] Failed to sync order:', syncResult.error);
          // Don't block order completion if sync fails
          // Print will show error but order will still be placed
        }
      } catch (syncError) {
        console.error('❌ [BACKEND SYNC] Exception during sync:', syncError);
        // Don't block order completion if sync fails
      }

      // 🗑️ PROFESSIONAL: Clear slot cache to prevent stale data loading after payment
      overlayStore.clearSlotCache(targetSlotId);

      // 🍳 KITCHEN SERVICE INTEGRATION: Send order to kitchen if enabled
      if (kitchenSettings.autoSendToKitchen) {
        try {
          console.log('🍳 [KITCHEN] Sending order to kitchen system');

          // Switch kitchen mode based on settings
          kitchenService.switchMode(kitchenSettings.mode);

          // Determine if this is additional items or new order
          const isAdditionalItems = completingPaidOrderWithAdditions;

          // Get valid order type (filter out draft)
          const validOrderType = (currentSlotState?.orderType && currentSlotState.orderType !== 'draft')
            ? currentSlotState.orderType as 'dine-in' | 'take-away' | 'delivery'
            : 'dine-in';

          // Convert order items to cart format for kitchen service
          const cartItemsForKitchen = orderItems?.map((item: any, index: number) => ({
            uniqueId: `kitchen-${finalOrderId}-${index}`,
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            totalPrice: item.totalPrice || item.price,
            category: item.category || 'food',
            available: true,
            description: item.description || '',
            image: item.image || '',
            modifiers: item.modifiers || { variations: [], addOns: [] },
            isPaid: !isAdditionalItems // Mark as paid unless it's additional items
          })) || [];

          const kitchenSuccess = isAdditionalItems
            ? await kitchenService.sendAdditionalItems(
                cartItemsForKitchen,
                targetSlotId,
                finalOrderId,
                validOrderType,
                orderCustomer?.name,
                orderCustomer?.specialInstructions
              )
            : await kitchenService.sendNewOrder(
                cartItemsForKitchen,
                targetSlotId,
                finalOrderId,
                validOrderType,
                orderCustomer?.name,
                orderCustomer?.specialInstructions
              );

          if (kitchenSuccess) {
            console.log('✅ [KITCHEN] Order sent to kitchen successfully');
          } else {
            console.warn('⚠️ [KITCHEN] Failed to send order to kitchen (order processed anyway)');
          }
        } catch (kitchenError) {
          console.error('❌ [KITCHEN] Error sending to kitchen:', kitchenError);
          // Don't fail the order if kitchen system fails
        }
      } else {
        console.log('🍳 [KITCHEN] Auto-send disabled, skipping kitchen notification');
      }

      // 🏆 PROFESSIONAL: Order overlay is automatically marked completed - no draft cleanup needed
      console.log('✅ [ORDER OVERLAY] Order will be marked completed automatically');

      // 🚀 SMART WORKFLOW: Different behavior based on order type
      if (completingUnpaidOrder || completingPaidOrderWithAdditions) {
        // EXISTING ORDER COMPLETION: Either unpaid order payment or paid order with additional items → Complete immediately
        // ✅ Order already saved as 'completed' in syncCartToOverlay above with correct payment method

        await setSlotCompleted(targetSlotId);
        const completionType = completingUnpaidOrder ? 'unpaid order payment' : 'paid order with additions payment';
        console.log('✅ [WORKFLOW]', completionType, 'received - order completed for slot', targetSlotId);

        console.log('🧹 [ORDER COMPLETE] Order completed for slot:', targetSlotId);
      } else {
        // NEW ORDER: Payment before service → Stay processing until served
        console.log('✅ [WORKFLOW] New order payment received - stays processing until served for slot', targetSlotId);
      }

      const finalStatus = (completingUnpaidOrder || completingPaidOrderWithAdditions)
        ? `completed (${completingUnpaidOrder ? 'unpaid payment' : 'paid additions payment'})`
        : 'processing (paid)';
      console.log('✅ [SUCCESS] Slot', targetSlotId, 'payment completed:', {
        orderId: finalOrderId,
        customer: orderCustomer?.name || 'Guest',
        itemCount: orderItems?.length || 0,
        total,
        paymentMethod: selectedPaymentMethod,
        wasExistingOrder: completingUnpaidOrder || completingPaidOrderWithAdditions,
        orderType: completingUnpaidOrder ? 'unpaid' : completingPaidOrderWithAdditions ? 'paid-with-additions' : 'new',
        finalStatus
      });
    } catch (error) {
      console.error('❌ [ERROR] Failed to complete order in slot', targetSlotId, ':', error);
      alert(`Failed to complete order in slot ${targetSlotId}. Please try again.`);
      return;
    }

    // Clear cart BEFORE navigating to avoid re-saving draft on unmount
    try {
      clearCart();
    } catch (e) {
      console.warn('Cleanup before navigating home failed', e);
    }

    // Navigate to home (PWA-first - instant state change)
    console.log('🏠 Navigating to home...');
    navigateToHome();
  };

  // Simple navigation for unpaid orders (no payment processing)
  const handleNavigateHome = () => {
    console.log('🏠 [NAVIGATE] Simple navigation to home (unpaid order preserved)');

    // Clear any overlay state to prevent double overlays
    setShowOrderComplete(false);
    setIsCompletingUnpaidOrder(false);

    // Clear cart to prevent stale state
    try {
      clearCart();
    } catch (e) {
      console.warn('Cart clear failed during navigation:', e);
    }

    // PWA-first navigation
    navigateToHome();
  };

  // Handle pay later - Place order without immediate payment
  const handlePayLater = async () => {
    // ROBUST SLOT TARGETING - Same validation as paid orders
    const targetSlotId = slotId || currentSlotId;

    console.log('⏰ [PAY LATER] Processing order without payment');
    console.log('🎯 [SLOT TARGETING] Slot resolution:', {
      providedSlotId: slotId,
      currentSlotId,
      targetSlotId,
      hasTargetSlot: !!targetSlotId,
      slotSource: slotId ? 'provided' : currentSlotId ? 'current' : 'none'
    });

    // CRITICAL: Ensure we have a valid slot ID before processing
    if (!targetSlotId) {
      console.error('❌ [CRITICAL] No slot ID available for order placement!');
      alert('Error: No slot selected for order placement.\n\nPlease ensure you have selected a table/slot before placing the order.');
      return;
    }

    // CRITICAL: Ensure we have cart items
    if (!cartItems || cartItems.length === 0) {
      console.error('❌ [CRITICAL] No cart items for order placement!');
      alert('Error: Cart is empty. Cannot place order without items.');
      return;
    }

    // Create guest customer if none provided
    const orderCustomer = customer || {
      name: 'Guest',
      phone: '',
      email: '',
      specialInstructions: '',
      currentStamps: 0,
      totalStamps: 0,
      visits: 0,
      totalSpent: 0,
      orderHistory: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log('👤 [CUSTOMER] Using customer:', orderCustomer.name);

    // 🏆 PROFESSIONAL CONVERSION: Convert cart items to order items preserving payment status
    const orderItems = cartItems.map((item, index) => {
      console.log(`💾 [SAVE ITEM ${index}] Name: ${item.name}, isPaid: ${item.isPaid}, Modifiers:`, JSON.stringify(item.modifiers, null, 2));

      return {
        uniqueId: item.uniqueId || `pay-later-${index}`,
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        totalPrice: item.totalPrice,
        category: item.category,
        available: item.available,
        description: item.description,
        image: item.image,
        modifiers: item.modifiers,
        // 🎯 CRITICAL: Preserve individual item payment status
        isPaid: item.isPaid || false,
        originalOrderId: item.originalOrderId
      };
    });

    // 🚨 CRITICAL: Payment overlay should NEVER generate order IDs - cart overlay is responsible
    if (!cartOrderId) {
      console.error('❌ [PAY LATER] No cart order ID available! Order ID should be generated by cart overlay first.');
      alert('Error: Order ID not found. Please go back to cart and generate order ID first.');
      return;
    }

    const finalOrderId = cartOrderId; // ONLY use existing cart order ID
    console.log('🎯 [PAY LATER] Using existing cart order ID:', finalOrderId);

    console.log('📦 [PAY LATER] Order items for slot', targetSlotId + ':', orderItems);

    try {
      // ⚡ LIGHTNING-FAST PAY LATER: Clean UI + Overlay separation
      console.log('⚡ [PAY LATER] Ultra-fast unpaid order processing');

      // 1. Update slot UI state (lightning fast)
      await setSlotProcessing(targetSlotId, {
        orderRefId: finalOrderId,
        paymentMethod: 'unpaid',
        paymentStatus: 'unpaid'
      });

      console.log('✅ [SLOT UI] Set slot', targetSlotId, 'to processing with order ref:', finalOrderId);

      // 2. Save complete order data to overlay store (source of truth) using centralized sync service
      // ⚡ PHASE 1: Use centralized cart sync service for consistent syncing

      // Get backend sync required fields from auth/till stores
      const user = useAuthStore.getState().user;

      // 🚨 CRITICAL FIX: Use actual cart totals, not approximations
      const cartStore2 = useCartStore.getState();
      const cartState2 = targetSlotId ? cartStore2.carts[targetSlotId] : null;
      const actualSubtotal2 = cartState2?.subtotal || (total / 1.1); // Fallback: reverse calculate
      const actualTax2 = cartState2?.tax || (total - actualSubtotal2); // Fallback: difference

      await syncCartToOverlay({
        orderId: finalOrderId,
        slotId: targetSlotId,
        orderType: useUnifiedSlotStore.getState().getSlot(targetSlotId)?.orderType || 'dine-in',
        items: orderItems,
        customer: orderCustomer,
        total,
        subtotal: actualSubtotal2, // ✅ Use actual cart subtotal
        tax: actualTax2, // ✅ Use actual cart tax
        paymentStatus: 'unpaid',
        paymentMethod: 'unpaid', // 🎯 CRITICAL: Mark as unpaid for pay later workflow
        status: 'active',
        // 🎯 BACKEND SYNC REQUIRED FIELDS (from Postman collection)
        branchId: user?.branchId,       // From auth store
        posId: user?.posId,             // From auth store
        tillSessionId: undefined  // ⚠️ NO tillSessionId for unpaid orders - assigned when paid
      });

      console.log('✅ [ORDER OVERLAY] Saved unpaid order data for', finalOrderId);

      // 🏆 PROFESSIONAL: Order overlay handles state management - no draft cleanup needed
      console.log('✅ [ORDER OVERLAY] Order saved successfully to persistent storage');

      console.log('✅ [PAY LATER SUCCESS] Slot', targetSlotId, 'set to processing (unpaid):', {
        orderId: finalOrderId,
        customer: orderCustomer.name,
        itemCount: orderItems.length,
        total,
        paymentStatus: 'unpaid'
      });

      // Clear cart before showing overlay to avoid re-saving drafts
      try {
        clearCart();
      } catch (e) {
        console.warn('Cleanup before showing overlay failed', e);
      }

      // FIXED: Show order placed overlay for pay later (like advance payment)
      setOrderNumber(finalOrderId); // Already using cart's order ID via finalOrderId
      setSelectedPaymentMethod('unpaid' as any); // Special case for unpaid
      setPlacedAt(getFormattedTime());
      setShowOrderComplete(true);

      console.log('✅ [PAY LATER] Showing order placed overlay for unpaid order');

    } catch (error) {
      console.error('❌ [ERROR] Failed to process pay later order:', error);
      alert(`Failed to place order in slot ${targetSlotId}. Please try again.`);
      return;
    }
  };

  return {
    // State
    activeTab,
    paymentStatus,
    showSplitPayments,
    showOrderComplete,
    selectedPaymentMethod,
    placedAt,
    orderNumber,
    isCompletingUnpaidOrder,
    cashAmount,
    cashChange,
    cardNumber,
    cardHolder,
    expiryDate,
    cvv,
    splitPayments,
    
    // Actions
    setActiveTab,
    setShowSplitPayments,
    setCashAmount,
    setCardNumber,
    setCardHolder,
    setExpiryDate,
    setCvv,
    
    // Handlers
    handleCashPayment,
    handleCardPayment,
    handleOfflineCardPayment,
    handleSplitBillPayment,
    handleSplitPayment,
    addSplitPayment,
    removeSplitPayment,
    updateSplitAmount,
    handleKeypadInput,
    handleKeypadClear,
    handleKeypadBackspace,
    handleOrderComplete,
    handlePrintReceipt,
    handleGoToHome,
    handleNavigateHome,
    handlePayLater,

    // Computed values
    formatCurrency,
    currentTaxRate
  };
};
