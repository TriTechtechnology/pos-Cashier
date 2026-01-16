'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Printer, CheckCircle, ChefHat } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth';
import { useCustomer } from '@/lib/store/cart-new';

interface OrderPlacedOverlayProps {
  slotId: string;
  orderNumber: string;
  orderType: 'dine-in' | 'take-away' | 'delivery';
  paymentMethod: 'cash' | 'card' | 'split' | 'unpaid';
  placedAt: string;
  total: number;
  subtotal: number;
  tax: number;
  taxRate?: number; // Dynamic tax rate based on payment method
  cashReceived?: number;
  change?: number;
  onPrintReceipt: () => void;
  onDone: () => void;
  isCompletingUnpaidOrder?: boolean; // New prop to detect payment after service
  isCompletingPaidOrderWithAdditions?: boolean; // New prop for paid order with additional items
}

export const OrderPlacedOverlay: React.FC<OrderPlacedOverlayProps> = React.memo(({
  slotId,
  orderNumber,
  orderType,
  paymentMethod,
  placedAt,
  total: _total,
  subtotal: _subtotal,
  tax: _tax,
  taxRate = 16, // Default to cash tax rate
  cashReceived: _cashReceived,
  change: _change,
  onPrintReceipt,
  onDone,
  isCompletingUnpaidOrder = false,
  isCompletingPaidOrderWithAdditions = false
}) => {
  const customer = useCustomer();
  const user = useAuthStore(state => state.user);
  const userRole = user?.role ?? 'staff';
  const roleLabel = `${userRole.charAt(0).toUpperCase()}${userRole.slice(1)}`;
  const isUnpaidOrder = paymentMethod === 'unpaid';
  const displayPaymentMethod = isUnpaidOrder ? 'pay later' : paymentMethod;
  const orderMeta = `${roleLabel} / ${orderType.replace('-', ' ')} / ${displayPaymentMethod}`;

  // Determine the overlay variant
  const getOverlayVariant = () => {
    if (isCompletingUnpaidOrder) {
      return 'payment-completed'; // Payment received after service
    } else if (isCompletingPaidOrderWithAdditions) {
      return 'additional-payment-completed'; // Additional payment for paid order
    } else if (isUnpaidOrder) {
      return 'order-saved'; // Order saved without payment
    } else {
      return 'order-placed'; // Normal order with payment
    }
  };

  const overlayVariant = getOverlayVariant();

  // Handle receipt printing - OFFLINE-FIRST using frontend receipt generation
  const handlePrintReceipt = async () => {
    try {
      console.log('🖨️ [PRINT] Starting receipt print for order:', orderNumber);

      if (!orderNumber) {
        console.error('❌ [PRINT] Missing order number');
        alert('Cannot print receipt: Order number is missing');
        return;
      }

      // Get order overlay from IndexedDB
      console.log('🔍 [PRINT] Fetching order overlay from IndexedDB...');
      const { useOrderOverlayStore } = await import('@/lib/store/order-overlay');
      const overlay = useOrderOverlayStore.getState().getByOrderId(orderNumber);

      if (!overlay) {
        console.error('❌ [PRINT] Order overlay not found for:', orderNumber);
        alert('Cannot print receipt: Order not found');
        return;
      }

      console.log('📄 [PRINT] Order overlay found:', {
        orderId: overlay.id,
        items: overlay.items.length,
        total: overlay.total,
        paymentStatus: overlay.paymentStatus
      });

      // Generate receipt using frontend service (offline-first)
      console.log('🔨 [PRINT] Generating receipt from frontend...');
      const { generateReceiptFromOrder, getBranchInfo, printReceiptContent } = await import('@/lib/services/receiptService');

      // Get branch info with dynamic tax rate based on payment method
      const branchInfo = {
        ...getBranchInfo(),
        taxRate: taxRate // Use dynamic tax rate from payment method
      };

      // Get cashier name from auth
      const cashierName = user?.name || user?.email || 'Cashier';

      // Generate receipt
      const receipt = await generateReceiptFromOrder(
        overlay,
        cashierName,
        branchInfo,
        _cashReceived,
        _change
      );

      console.log('✅ [PRINT] Receipt generated successfully');
      console.log('📄 [PRINT] Receipt data:', {
        orderNumber: receipt.data.orderNumber,
        items: receipt.data.items.length,
        total: receipt.data.grandTotal,
        taxRate: taxRate,
        format: receipt.format
      });

      // Print receipt
      console.log('🖨️ [PRINT] Opening print window...');
      printReceiptContent(receipt.content, orderNumber);

      console.log('✅ [PRINT] Print window opened successfully');

      // Call the original callback
      onPrintReceipt();
    } catch (error) {
      console.error('❌ [PRINT] Error printing receipt:', error);
      alert(`Print error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Handle KDS receipt printing
  const printKDSReceipt = async () => {
    try {
      console.log('🍳 [KDS] Starting KDS receipt print for order:', orderNumber);

      if (!orderNumber) {
        console.error('❌ [KDS] Missing order number');
        return;
      }

      // Get order overlay from IndexedDB
      const { useOrderOverlayStore } = await import('@/lib/store/order-overlay');
      const overlay = useOrderOverlayStore.getState().getByOrderId(orderNumber);

      if (!overlay) {
        console.error('❌ [KDS] Order overlay not found for:', orderNumber);
        return;
      }

      // Generate KDS receipt content
      const kdsContent = generateKDSReceipt(overlay, slotId, orderType, customer?.name);

      // Print KDS receipt
      const kdsKey = `kds-${orderNumber}-${Date.now()}`;
      sessionStorage.setItem(kdsKey, kdsContent);

      const printUrl = `/print-receipt?key=${kdsKey}`;
      window.open(printUrl, '_blank');

      console.log('✅ [KDS] KDS receipt printed successfully');
    } catch (error) {
      console.error('❌ [KDS] Error printing KDS receipt:', error);
    }
  };

  // Generate KDS receipt content
  const generateKDSReceipt = (
    overlay: any,
    slotId: string,
    orderType: string,
    customerName?: string
  ): string => {
    const WIDTH = 42;
    const line = '='.repeat(WIDTH);
    const dashed = '-'.repeat(WIDTH);

    // Get branch timezone
    let timezone = 'Asia/Karachi';
    try {
      const data = localStorage.getItem('pos-branch-config-storage');
      if (data) {
        const parsed = JSON.parse(data);
        timezone = parsed?.state?.config?.timezone || 'Asia/Karachi';
      }
    } catch {}

    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: timezone
    });
    const dateStr = now.toLocaleDateString('en-GB', { timeZone: timezone });

    let receipt = '';

    // Header
    receipt += centerText('*** KITCHEN ORDER ***', WIDTH) + '\n';
    receipt += line + '\n';

    // Order info
    receipt += `Order #: ${overlay.id}\n`;
    receipt += `Table: ${slotId}\n`;
    receipt += `Type: ${orderType.replace('-', ' ').toUpperCase()}\n`;
    if (customerName && customerName !== 'Guest') {
      receipt += `Customer: ${customerName}\n`;
    }
    receipt += `Time: ${timeStr} | ${dateStr}\n`;
    receipt += dashed + '\n';

    // Items header
    receipt += 'QTY    ITEM\n';
    receipt += dashed + '\n';

    // Items
    overlay.items.forEach((item: any) => {
      const qtyStr = String(item.quantity).padEnd(6);
      receipt += `${qtyStr} ${item.name}\n`;

      // Add modifiers/notes
      if (item.modifiers) {
        if (item.modifiers.variations?.length) {
          item.modifiers.variations.forEach((v: any) => {
            receipt += `       > ${v.name}\n`;
          });
        }
        if (item.modifiers.addOns?.length) {
          item.modifiers.addOns.forEach((a: any) => {
            receipt += `       + ${a.name}\n`;
          });
        }
        if (item.modifiers.specialInstructions) {
          receipt += `       NOTE: ${item.modifiers.specialInstructions}\n`;
        }
      }
    });

    receipt += dashed + '\n';
    receipt += centerText(`TOTAL ITEMS: ${overlay.items.reduce((sum: number, i: any) => sum + i.quantity, 0)}`, WIDTH) + '\n';
    receipt += line + '\n';

    return receipt;
  };

  // Center text helper
  const centerText = (text: string, width: number): string => {
    const padding = Math.max(0, Math.floor((width - text.length) / 2));
    return ' '.repeat(padding) + text;
  };

  // Handle Done button click
  const handleDone = () => {
    onDone();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-secondary border border-border rounded-[42px] w-[440px] max-w-[90vw] p-5 relative">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex flex-col min-w-0 pr-3 max-w-[70%]">
            <div className="flex items-center gap-2 min-w-0">
              <div className="text-2xl font-semibold flex-shrink-0 text-text-primary">{slotId}</div>
              {customer?.name && (
                <div
                  className="text-xl font-semibold text-text-primary whitespace-nowrap overflow-hidden text-ellipsis max-w-[7ch]"
                  title={customer.name}
                >
                  {customer.name}
                </div>
              )}
            </div>
            <div className="text-sm font-semibold text-text-secondary truncate">
              #{orderNumber} / {orderMeta}
            </div>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="text-xl font-bold text-text-primary">Order Time</div>
            <div className="text-sm font-semibold text-text-secondary">{placedAt}</div>
          </div>
        </div>

        {/* Body - Three Variations Based on Order Status */}
        <div className="flex flex-col items-center text-center py-4">
          <div className={`w-16 h-16 ${
            overlayVariant === 'order-saved' ? 'bg-warning/20' : 'bg-success/20'
          } rounded-full flex items-center justify-center mb-3`}>
            <CheckCircle className={`w-10 h-10 ${
              overlayVariant === 'order-saved' ? 'text-warning' : 'text-success'
            }`} />
          </div>
          <h2 className="text-xl font-bold text-text-primary">
            {overlayVariant === 'payment-completed' && 'Payment Completed'}
            {overlayVariant === 'additional-payment-completed' && 'Additional Payment Completed'}
            {overlayVariant === 'order-saved' && 'Order Saved'}
            {overlayVariant === 'order-placed' && 'Order Placed'}
          </h2>
          <p className="text-text-secondary">
            {overlayVariant === 'payment-completed' && 'Order complete - payment received'}
            {overlayVariant === 'additional-payment-completed' && 'Order complete - additional payment received'}
            {overlayVariant === 'order-saved' && 'Order saved - complete payment when ready'}
            {overlayVariant === 'order-placed' && 'JEssE, We NEED TO COOK!'}
          </p>
        </div>

        {/* Footer Actions */}
        <div className="mt-1 relative">
          <div className="absolute left-0 top-0">
            <Button
              variant="line"
              onClick={handlePrintReceipt}
              className="px-5 py-3 flex items-center gap-2"
            >
              <Printer className="w-5 h-5" />
              <span>Print</span>
            </Button>
          </div>
          <div className="flex items-center justify-center">
            <Button
              variant="fill"
              onClick={handleDone}
              className="px-8 py-3"
            >
              Done
            </Button>
          </div>
          <div className="absolute right-0 top-0">
            <Button
              variant="line"
              onClick={printKDSReceipt}
              className="px-5 py-3 flex items-center gap-2"
            >
              <ChefHat className="w-5 h-5" />
              <span>Kitchen</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
});

OrderPlacedOverlay.displayName = 'OrderPlacedOverlay';


