'use client';

import React, { useEffect } from 'react';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigationActions } from '@/lib/store/navigation';

interface OrderCompletionOverlayProps {
  slotId: string;
  orderType: 'dine-in' | 'take-away' | 'delivery';
  onDone: () => void;
}

export const OrderCompletionOverlay: React.FC<OrderCompletionOverlayProps> = ({
  slotId,
  orderType,
  onDone
}) => {
  const { navigateToHome } = useNavigationActions();

  // Auto-redirect after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      onDone();
      navigateToHome();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onDone, navigateToHome]);

  const handleDone = () => {
    onDone();
    navigateToHome();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card border border-border rounded-2xl p-8 max-w-md mx-4 text-center">
        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>

        {/* Success Message */}
        <h2 className="text-xl font-semibold text-text-primary mb-2">
          Order Completed!
        </h2>
        <p className="text-text-secondary mb-6">
          {orderType === 'dine-in' ? 'Order has been served' :
           orderType === 'take-away' ? 'Order is ready for pickup' :
           'Order has been delivered'}
        </p>

        {/* Slot Info */}
        <div className="bg-background rounded-lg p-3 mb-6">
          <p className="text-sm text-text-secondary">Slot</p>
          <p className="font-semibold text-text-primary">{slotId}</p>
          <p className="text-xs text-text-secondary">Now available for new orders</p>
        </div>

        {/* Action Button */}
        <Button
          variant="fill"
          size="lg"
          className="w-full"
          onClick={handleDone}
        >
          Back to Home
        </Button>

        {/* Auto-redirect notice */}
        <p className="text-xs text-text-secondary mt-3">
          Automatically redirecting in 3 seconds...
        </p>
      </div>
    </div>
  );
};