import React from 'react';
import { Button } from '@/components/ui/button';
import { CreditCard } from 'lucide-react';

interface CardPaymentTabProps {
  cardNumber: string;
  cardHolder: string;
  expiryDate: string;
  cvv: string;
  paymentStatus: string;
  onCardNumberChange: (value: string) => void;
  onCardHolderChange: (value: string) => void;
  onExpiryDateChange: (value: string) => void;
  onCvvChange: (value: string) => void;
  onCardPayment: () => void;
  onOfflineCardPayment: () => void;
}

export const CardPaymentTab: React.FC<CardPaymentTabProps> = React.memo(({
  paymentStatus,
  onOfflineCardPayment
}) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-3">
          <CreditCard className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-text-primary">Card Payment</h3>
        <p className="text-sm text-text-secondary">Process card payment offline</p>
      </div>

      {/* Tax Info */}
      <div className="bg-success/10 border border-success/20 rounded-lg p-4 text-center">
        <p className="text-sm font-medium text-success">
          Card payments have reduced tax rate
        </p>
        <p className="text-2xl font-bold text-success mt-1">5% Tax</p>
      </div>

      {/* Info */}
      <div className="bg-muted rounded-lg p-4">
        <p className="text-sm text-text-secondary text-center">
          Use the external card terminal to process the payment, then confirm below.
        </p>
      </div>

      {/* Confirm Button */}
      <Button
        variant="fill"
        className="w-full h-11 flex-shrink-0 bg-success hover:bg-success/90 text-white font-bold text-sm disabled:bg-muted disabled:text-text-secondary shadow-lg"
        onClick={onOfflineCardPayment}
        disabled={paymentStatus === 'processing'}
      >
        {paymentStatus === 'processing' ? (
          <span className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Processing...
          </span>
        ) : (
          'Confirm Card Payment'
        )}
      </Button>
    </div>
  );
});

CardPaymentTab.displayName = 'CardPaymentTab';
