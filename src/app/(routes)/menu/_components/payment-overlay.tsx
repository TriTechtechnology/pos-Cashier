/**
 * PaymentOverlay Component
 * 
 * PURPOSE: Handles the complete payment process after order confirmation.
 * Supports multiple payment methods: cash, card, and online payments.
 * 
 * LINKS WITH:
 * - PaymentOverlayHeader: Shows order total and payment status
 * - PaymentOverlayTabs: Navigation between payment methods
 * - CashPaymentTab: Cash payment interface with change calculation
 * - CardPaymentTab: Card payment processing
 * - SplitPaymentTab: Handle multiple payment methods for one order
 * - OrderPlacedOverlay: Success/failure confirmation
 * - usePaymentOverlay hook: Payment state management and processing logic
 * - useCart hook: Final order data
 * 
 * WHY: Critical component for completing transactions. Handles different payment
 * scenarios and ensures secure payment processing with proper error handling.
 */

'use client';

import React, { useEffect } from 'react';
import { useCartTotal } from '@/lib/store/cart-new';
import {
  PaymentOverlayHeader,
  PaymentOverlayTabs,
  CashPaymentTab,
  CardPaymentTab,
  SplitPaymentTab,
  usePaymentOverlay
} from './payment-overlay-components';
import { OrderPlacedOverlay } from './order-completion';

interface PaymentOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
  slotId?: string | null;
  orderType?: 'dine-in' | 'take-away' | 'delivery' | null;
  onOrderComplete?: () => void;
  onTaxRateChange?: (taxRate: number) => void; // Callback when payment tab changes (affects tax rate)
}

export const PaymentOverlay: React.FC<PaymentOverlayProps> = React.memo(({
  isOpen,
  onClose,
  className = '',
  slotId = null,
  orderType = null,
  onOrderComplete,
  onTaxRateChange
}) => {
  const total = useCartTotal();
  
  // Use the custom hook for all business logic
  const {
    activeTab,
    paymentStatus,
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
    setActiveTab,
    setCardNumber,
    setCardHolder,
    setExpiryDate,
    setCvv,
    handleCashPayment,
    handleCardPayment,
    handleOfflineCardPayment,
    handleSplitBillPayment,
    handleKeypadInput,
    handleKeypadClear,
    handleKeypadBackspace,
    handlePrintReceipt,
    handleGoToHome,
    handleNavigateHome,
    handlePayLater,
    formatCurrency,
    currentTaxRate
  } = usePaymentOverlay({
    total,
    onOrderComplete,
    onClose,
    slotId,
    orderType
  });

  // Notify parent when tax rate changes (for confirmation overlay sync)
  useEffect(() => {
    if (onTaxRateChange) {
      onTaxRateChange(currentTaxRate);
    }
  }, [currentTaxRate, onTaxRateChange]);

  if (!isOpen) return null;

  // Order completion overlay
  if (showOrderComplete) {
    return (
      <OrderPlacedOverlay
        slotId={slotId || '?'}
        orderNumber={orderNumber || '000000'}
        orderType={orderType || 'dine-in'}
        paymentMethod={selectedPaymentMethod}
        placedAt={placedAt || ''}
        total={total}
        subtotal={total / (1 + currentTaxRate / 100)} // Calculate subtotal from total with current tax rate
        tax={total - (total / (1 + currentTaxRate / 100))} // Tax based on current payment method
        taxRate={currentTaxRate}
        cashReceived={selectedPaymentMethod === 'cash' || selectedPaymentMethod === 'split' ? parseFloat(cashAmount) || 0 : undefined}
        change={selectedPaymentMethod === 'cash' || selectedPaymentMethod === 'split' ? cashChange : undefined}
        onPrintReceipt={handlePrintReceipt}
        onDone={(selectedPaymentMethod as any) === 'unpaid' ? handleNavigateHome : handleGoToHome}
        isCompletingUnpaidOrder={isCompletingUnpaidOrder}
        isCompletingPaidOrderWithAdditions={false} // Future: Will be implemented when needed
      />
    );
  }

  return (
    <div 
      className={`bg-secondary rounded-[8px] z-40 flex flex-col ${className}`}
      style={{ 
        fontFamily: 'Inter',
        position: 'fixed',
        top: '8px',
        bottom: '8px',
        width: '33.333333%',
        transition: 'all 500ms cubic-bezier(0.4, 0, 0.2, 1)',
        transitionDelay: isOpen ? '0ms' : '50ms',
        ...(isOpen ? { right: '8px' } : { right: '-33.333333%' })
      }}
    >
      {/* Header */}
      <PaymentOverlayHeader
        paymentStatus={paymentStatus}
        onClose={onClose}
        onPayLater={handlePayLater}
      />

      {/* Navigation Tabs */}
      <PaymentOverlayTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Content Area - Fits remaining overlay space */}
      <div className="flex flex-col flex-1 mx-4 mb-4 min-h-0">
        <div className="flex-1 bg-card rounded-lg border border-border p-1 min-h-0 overflow-hidden">
          {/* Tab Content - Fits remaining space */}
          <div className="h-full overflow-hidden p-3">
            {activeTab === 'cash' && (
              <CashPaymentTab
                cashAmount={cashAmount}
                cashChange={cashChange}
                total={total}
                paymentStatus={paymentStatus}
                formatCurrency={formatCurrency}
                onKeypadInput={handleKeypadInput}
                onKeypadClear={handleKeypadClear}
                onKeypadBackspace={handleKeypadBackspace}
                onCashPayment={handleCashPayment}
              />
            )}

            {activeTab === 'card' && (
              <CardPaymentTab
                cardNumber={cardNumber}
                cardHolder={cardHolder}
                expiryDate={expiryDate}
                cvv={cvv}
                paymentStatus={paymentStatus}
                onCardNumberChange={setCardNumber}
                onCardHolderChange={setCardHolder}
                onExpiryDateChange={setExpiryDate}
                onCvvChange={setCvv}
                onCardPayment={handleCardPayment}
                onOfflineCardPayment={handleOfflineCardPayment}
              />
            )}

            {activeTab === 'split' && (
              <SplitPaymentTab
                total={total}
                paymentStatus={paymentStatus}
                onSplitPayment={handleSplitBillPayment}
              />
            )}
          </div>
        </div>
      </div>

    </div>
  );
});

PaymentOverlay.displayName = 'PaymentOverlay';
