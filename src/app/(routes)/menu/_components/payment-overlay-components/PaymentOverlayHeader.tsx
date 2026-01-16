import React from 'react';
import { Button } from '@/components/ui/button';
import { X, Clock } from 'lucide-react';
import { PaymentStatus } from './hooks/usePaymentOverlay';
import { useBranchConfigStore } from '@/lib/store/branchConfig';

interface PaymentOverlayHeaderProps {
  paymentStatus: PaymentStatus;
  onClose: () => void;
  onPayLater?: () => void; // New prop for pay later functionality
}

export const PaymentOverlayHeader: React.FC<PaymentOverlayHeaderProps> = React.memo(({
  paymentStatus,
  onClose,
  onPayLater
}) => {
  // Get branch configuration to determine payment mode
  const branchConfig = useBranchConfigStore((state) => state.config);
  const paymentMode = branchConfig?.paymentMode || branchConfig?.posConfig?.paymentMode || 'payNow';

  // Show "Pay Later" only if payment mode is 'payLater' (fine dining style)
  const showPayLater = paymentMode === 'payLater';

  const getStatusText = (status: PaymentStatus) => {
    switch (status) {
      case 'idle': return 'Ready';
      case 'processing': return 'Processing...';
      case 'completed': return 'Completed';
      case 'failed': return 'Failed';
      default: return 'Ready';
    }
  };

  const getStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case 'idle': return 'text-text-secondary';
      case 'processing': return 'text-warning';
      case 'completed': return 'text-success';
      case 'failed': return 'text-destructive';
      default: return 'text-text-secondary';
    }
  };

  return (
    <div className="flex items-center justify-between p-3 flex-shrink-0">
      <div className="flex flex-col">
        <h2 className="text-xl font-bold text-text-primary">Payment</h2>
        <p className={`text-sm ${getStatusColor(paymentStatus)}`}>
          {getStatusText(paymentStatus)}
        </p>
      </div>

      <div className="flex items-center space-x-2">
        {/* Pay Later Button - Only show when:
            1. Payment is idle
            2. onPayLater callback is provided
            3. Branch payment mode is 'payLater' (fine dining style)
        */}
        {paymentStatus === 'idle' && onPayLater && showPayLater && (
          <Button
            variant="line"
            onClick={onPayLater}
            className="px-3 py-2 flex items-center gap-2 bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100"
            title="Place order and pay later"
          >
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">Pay Later</span>
          </Button>
        )}

        <Button
          variant="icon-line"
          size="icon"
          onClick={onClose}
          className="w-8 h-8"
          title="Close"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
});

PaymentOverlayHeader.displayName = 'PaymentOverlayHeader';
