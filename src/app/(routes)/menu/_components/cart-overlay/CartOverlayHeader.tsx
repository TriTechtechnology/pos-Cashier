import React from 'react';
import { X, Trash2, Save, Printer, FileText, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CartOverlayHeaderProps {
  mode: 'cart' | 'confirmation';
  orderId: string;
  slotId: string | null;
  orderType: 'dine-in' | 'take-away' | 'delivery' | null;
  // actionHistoryLength: number; // Legacy - no longer used in bulletproof implementation
  itemsLength: number;
  hasOrderOverlay: boolean; // Whether order overlay exists
  isProcessingOrder: boolean; // Whether this is a processing order (locks certain buttons)
  onCancelOrder: () => void;
  onClearCart: () => void; // New: Clear cart items only
  onDraftOrder: () => void;
  onPrintReceipt: () => void;
  onDraftOrderFromConfirmation: () => void;
  onTipButton: () => void;
}

export const CartOverlayHeader: React.FC<CartOverlayHeaderProps> = React.memo(({
  mode = 'cart',
  orderId = '999',
  slotId = null,
  orderType = null,
  // actionHistoryLength = 0, // Legacy - no longer used in bulletproof implementation
  itemsLength = 0,
  hasOrderOverlay = false,
  isProcessingOrder = false,
  onCancelOrder = () => {},
  onClearCart = () => {},
  onDraftOrder = () => {},
  onPrintReceipt = () => {},
  onDraftOrderFromConfirmation = () => {},
  onTipButton = () => {}
}) => {
  return (
    <div className="flex items-center justify-between p-3 flex-shrink-0">
      <div className="flex flex-col">
        {mode === 'confirmation' ? (
          <>
            <h2 className="text-xl font-bold text-text-primary">Confirmation</h2>
            <p className="text-sm text-text-secondary">
              Order#{orderId || '999'} / Slot#{slotId || 'D1'}
            </p>
          </>
        ) : (
          <>
            <h2 className="text-xl font-bold text-text-primary">Order#{orderId || '999'}</h2>
            <p className="text-sm text-text-secondary">
              {orderType ? orderType.charAt(0).toUpperCase() + orderType.slice(1).replace('-', ' ') : 'Dine In'} / SLOT#{slotId || 'D1'}
            </p>
          </>
        )}
      </div>
     
      <div className="flex items-center space-x-2">
        {mode === 'confirmation' ? (
          <>
            <Button
              variant="icon-line"
              size="icon"
              onClick={() => onPrintReceipt?.()}
              className="w-8 h-8"
              title="Print Receipt"
            >
              <Printer className="w-5 h-5" />
            </Button>
            <Button
              variant="icon-line"
              size="icon"
              onClick={() => onDraftOrderFromConfirmation?.()}
              className="w-8 h-8"
              title="Draft Order"
            >
              <FileText className="w-4 h-4" />
            </Button>
            <Button
              variant="icon-line"
              size="icon"
              onClick={() => onTipButton?.()}
              className="w-8 h-8"
              title="Tip"
            >
              <User className="w-5 h-5" />
            </Button>
          </>
        ) : (
          <>
            {/* Cancel Order Button - Clears order overlay and returns to home */}
            <Button
              variant="icon-line"
              size="icon"
              onClick={() => onCancelOrder?.()}
              className="w-8 h-8"
              title="Cancel Order & Delete"
            >
              <X className="w-6 h-6" />
            </Button>

            {/* Clear Cart Button - Clears menu items only */}
            <Button
              variant="icon-line"
              size="icon"
              onClick={() => onClearCart?.()}
              className="w-8 h-8"
              title="Clear Cart Items"
              disabled={!itemsLength || itemsLength === 0 || isProcessingOrder}
            >
              <Trash2 className="w-5 h-5" />
            </Button>

            {/* Draft Order Button - Routes to home (keeps overlay) */}
            <Button
              variant="icon-line"
              size="icon"
              onClick={() => onDraftOrder?.()}
              className="w-8 h-8"
              title="Save as Draft"
              disabled={!hasOrderOverlay || !itemsLength || itemsLength === 0 || isProcessingOrder}
            >
              <Save className="w-4 h-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
});

CartOverlayHeader.displayName = 'CartOverlayHeader';
