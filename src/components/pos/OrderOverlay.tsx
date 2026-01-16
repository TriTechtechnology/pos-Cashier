'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Printer, Edit, Trash2 } from 'lucide-react';
import { CheckTabContent } from '@/app/(routes)/menu/_components/cart-overlay/CheckTabContent';
import { useOrderOverlay } from '@/lib/hooks/useOrderOverlay';
import type { Slot } from '@/types/pos';

export interface OrderOverlayHeaderProps {
  slotId: string;
  orderNumber: string | number;
  orderType: 'dine-in' | 'take-away' | 'delivery';
  paymentMethod?: 'cash' | 'card' | 'online';
  placedAt?: string;
}

export interface OrderOverlayProps extends OrderOverlayHeaderProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
  slot?: Slot;
  // Admin privilege props
  canPrint?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  // Minimized mode for orders page
  isMinimized?: boolean;
  onHeaderClick?: () => void;
  // Expanded state for orders page (when minimized card is tapped)
  isExpanded?: boolean;
  // Sync status for completed orders
  syncStatus?: 'pending' | 'syncing' | 'synced' | 'failed';
}

export const OrderOverlay: React.FC<OrderOverlayProps> = React.memo(({
  isOpen,
  onClose,
  className = '',
  slotId,
  orderNumber,
  orderType,
  paymentMethod,
  placedAt,
  slot,
  canPrint = true,
  canEdit = true,
  canDelete = false,
  isMinimized = false,
  onHeaderClick,
  isExpanded = false,
  syncStatus
}) => {
  const {
    cartItems,
    subtotal,
    tax,
    total,
    discount,
    cartDiscount,
    orderMeta,
    orderTime,
    orderDate,
    timeColor,
    statusInfo,
    slideOverlay,
    handlePrint,
    handleEdit,
    handleDelete,
    handleComplete,
    formatCurrency
  } = useOrderOverlay({
    isOpen,
    onClose,
    slotId,
    orderNumber,
    orderType,
    paymentMethod,
    placedAt,
    slot,
    isMinimized
  });

  // For home page: only render when slide overlay is mounted
  if (!isMinimized && slideOverlay && !slideOverlay.isMounted) return null;

  // ORDERS PAGE MODE: Simple card that expands in place
  if (isMinimized) {
    return (
      <div className={`bg-secondary rounded-[42px] w-full max-w-sm mx-auto flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${className}`}>
        {/* Header */}
        <div
          className="flex items-start p-4 pb-3 flex-shrink-0 cursor-pointer transition-all relative"
          onClick={onHeaderClick}
        >
          {/* Centered main content */}
          <div className="flex flex-col items-start min-w-0 pr-3 max-w-[70%]">
            <div className="flex items-center gap-3 mb-1">
              <div className="text-2xl font-semibold text-text-primary">{slotId}</div>
              {slot?.orderCustomer?.name && (
                <div
                  className="text-xl font-semibold text-text-primary whitespace-nowrap overflow-hidden text-ellipsis max-w-[8ch]"
                  title={slot.orderCustomer.name}
                >
                  {slot.orderCustomer.name}
                </div>
              )}
            </div>
            <div className="text-sm font-semibold text-text-secondary">
              #{orderNumber} • {orderMeta}
            </div>
          </div>

          {/* Order time positioned absolutely to the right */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-center text-center">
            <div className="text-lg font-bold text-text-primary">Order Time</div>
            <div className={`text-sm font-semibold ${timeColor}`}>{orderTime}</div>
          </div>
        </div>

        {/* Meta line for orders page - only show when not expanded */}
        {!isExpanded && (
          <div className="px-4 pb-3">
            <div className="text-sm text-text-secondary">
              {orderDate} • {cartItems.length} items • {formatCurrency(total)} • <span className={statusInfo.colorClass}>{statusInfo.displayName}</span>
              {syncStatus && (
                <>
                  {' • '}
                  <span className={
                    syncStatus === 'synced'
                      ? 'text-green-600'
                      : syncStatus === 'syncing'
                      ? 'text-blue-600 animate-pulse'
                      : syncStatus === 'failed'
                      ? 'text-red-600'
                      : 'text-yellow-600'
                  }>
                    {syncStatus === 'synced' ? 'Synced' : syncStatus === 'syncing' ? 'Syncing' : syncStatus === 'failed' ? 'Sync Failed' : 'Pending Sync'}
                  </span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Expanded content - shows when clicked in orders page mode */}
        {isExpanded && (
          <div className="animate-in slide-in-from-top-2 duration-300">
            {/* Items list */}
            <div className="flex-1 min-h-0 mx-4 mb-3 flex flex-col gap-3">
              <div className="flex-1 min-h-0 bg-card rounded-lg border border-border overflow-hidden flex flex-col relative">
                <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide">
                  <CheckTabContent
                    mode="confirmation"
                    items={cartItems}
                    onItemClick={() => {}}
                    onRepeat={() => {}}
                    onDelete={() => {}}
                  />
                </div>
                {cartItems.length > 4 && (
                  <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-muted/80 text-text-secondary text-xs px-2 py-1 rounded-full pointer-events-none">
                    {cartItems.length} items
                  </div>
                )}
              </div>

              {/* Totals */}
              <div className="flex-shrink-0 bg-card rounded-lg border border-border p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Items ({cartItems.length})</span>
                    <span className="text-text-primary">{formatCurrency(subtotal)}</span>
                  </div>

                  {discount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Item Discounts</span>
                      <span className="text-success-light">-{formatCurrency(discount)}</span>
                    </div>
                  )}

                  {cartDiscount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Cart Discount</span>
                      <span className="text-success-light">-{formatCurrency(cartDiscount)}</span>
                    </div>
                  )}

                  {slot?.orderCustomer?.specialInstructions && (
                    <div className="border-t border-border pt-2 mt-2">
                      <div className="text-text-secondary text-xs mb-1">Special Instructions:</div>
                      <div className="text-text-primary text-sm italic">
                        &quot;{slot.orderCustomer.specialInstructions}&quot;
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-text-secondary">Tax (15%)</span>
                    <span className="text-text-primary">{formatCurrency(tax)}</span>
                  </div>

                  <div className="border-t border-border pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="text-lg font-semibold text-text-primary">Total</span>
                      <span className="text-lg font-bold text-text-primary">{formatCurrency(total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-between px-4 pb-4 pt-1 flex-shrink-0">
              <div className="flex items-center gap-2">
                {canPrint && (
                  <Button variant="icon" size="sm" onClick={handlePrint} className="h-9 w-9 p-0" title="Print Order">
                    <Printer className="h-4 w-4" />
                  </Button>
                )}
                {canEdit && slot?.paymentStatus === 'paid' && (
                  <Button variant="icon" size="sm" onClick={handleEdit} className="h-9 w-9 p-0" title="Edit Order">
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
                {canDelete && (
                  <Button
                    variant="icon"
                    size="sm"
                    onClick={handleDelete}
                    className="h-9 w-9 p-0 text-destructive hover:bg-destructive/10"
                    title="Delete Order"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {slot && slot.status === 'processing' && slot.paymentStatus === 'paid' && (
                <Button
                  variant="fill"
                  onClick={handleComplete}
                  className="px-5 py-2 flex items-center gap-2 text-sm bg-primary hover:bg-primary/90 text-white"
                >
                  Complete Order
                </Button>
              )}
              {slot && slot.status === 'processing' && slot.paymentStatus === 'unpaid' && (
                <Button
                  variant="fill"
                  onClick={handleEdit}
                  className="px-5 py-2 flex items-center gap-2 text-sm bg-primary hover:bg-primary/90 text-white"
                >
                  Edit Order
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // HOME PAGE MODE: Full sliding overlay with backdrop
  if (!slideOverlay) return null;

  return (
    <div {...slideOverlay.overlayProps}>
      <div
        {...slideOverlay.contentProps}
        style={{
          ...slideOverlay.contentProps.style,
          transform: slideOverlay.contentProps.style?.transform?.includes('120%')
            ? slideOverlay.contentProps.style.transform.replace('120%', '-120%')
            : slideOverlay.contentProps.style?.transform
        }}
        className={`${slideOverlay.contentProps.className} w-[440px] max-w-[90vw] max-h-[90vh] ${className}`}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-4 pb-3 flex-shrink-0">
          <div className="flex flex-col min-w-0 pr-3 max-w-[70%]">
            <div className="flex items-center gap-2 min-w-0">
              <div className="text-2xl font-semibold flex-shrink-0 text-text-primary">{slotId}</div>
              {slot?.orderCustomer?.name && (
                <div
                  className="text-xl font-semibold text-text-primary whitespace-nowrap overflow-hidden text-ellipsis max-w-[7ch]"
                  title={slot.orderCustomer.name}
                >
                  {slot.orderCustomer.name}
                </div>
              )}
            </div>
            <div className="text-sm font-semibold text-text-secondary truncate">
              #{orderNumber} • {orderMeta}
            </div>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="text-2xl font-bold text-text-primary">Order Time</div>
            <div className={`text-sm font-semibold ${timeColor}`}>{orderTime}</div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-h-0 mx-4 mb-3 flex flex-col gap-3">
          <div className="flex-1 min-h-0 bg-card rounded-lg border border-border overflow-hidden flex flex-col relative">
            <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide">
              <CheckTabContent
                mode="confirmation"
                items={cartItems}
                onItemClick={() => {}}
                onRepeat={() => {}}
                onDelete={() => {}}
              />
            </div>
            {cartItems.length > 4 && (
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-muted/80 text-text-secondary text-xs px-2 py-1 rounded-full pointer-events-none">
                {cartItems.length} items
              </div>
            )}
          </div>

          <div className="flex-shrink-0 bg-card rounded-lg border border-border p-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-secondary">Items ({cartItems.length})</span>
                <span className="text-text-primary">{formatCurrency(subtotal)}</span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between">
                  <span className="text-text-secondary">Item Discounts</span>
                  <span className="text-success-light">-{formatCurrency(discount)}</span>
                </div>
              )}

              {cartDiscount > 0 && (
                <div className="flex justify-between">
                  <span className="text-text-secondary">Cart Discount</span>
                  <span className="text-success-light">-{formatCurrency(cartDiscount)}</span>
                </div>
              )}

              {slot?.orderCustomer?.specialInstructions && (
                <div className="border-t border-border pt-2 mt-2">
                  <div className="text-text-secondary text-xs mb-1">Special Instructions:</div>
                  <div className="text-text-primary text-sm italic">
                    &quot;{slot.orderCustomer.specialInstructions}&quot;
                  </div>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-text-secondary">Tax (15%)</span>
                <span className="text-text-primary">{formatCurrency(tax)}</span>
              </div>

              <div className="border-t border-border pt-2 mt-2">
                <div className="flex justify-between">
                  <span className="text-lg font-semibold text-text-primary">Total</span>
                  <span className="text-lg font-bold text-text-primary">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between px-4 pb-4 pt-1 flex-shrink-0">
          <div className="flex items-center gap-2">
            {canPrint && (
              <Button variant="icon" size="sm" onClick={handlePrint} className="h-9 w-9 p-0" title="Print Order">
                <Printer className="h-4 w-4" />
              </Button>
            )}
            {canEdit && slot?.paymentStatus === 'paid' && (
              <Button variant="icon" size="sm" onClick={handleEdit} className="h-9 w-9 p-0" title="Edit Order">
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {canDelete && (
              <Button
                variant="icon"
                size="sm"
                onClick={handleDelete}
                className="h-9 w-9 p-0 text-destructive hover:bg-destructive/10"
                title="Delete Order"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>

          {slot && slot.status === 'processing' && slot.paymentStatus === 'paid' && (
            <Button
              variant="fill"
              onClick={handleComplete}
              className="px-5 py-2 flex items-center gap-2 text-sm bg-primary hover:bg-primary/90 text-white"
            >
              Complete Order
            </Button>
          )}
          {slot && slot.status === 'processing' && slot.paymentStatus === 'unpaid' && (
            <Button
              variant="fill"
              onClick={handleEdit}
              className="px-5 py-2 flex items-center gap-2 text-sm bg-primary hover:bg-primary/90 text-white"
            >
              Edit Order
            </Button>
          )}
        </div>
      </div>
    </div>
  );
});

OrderOverlay.displayName = 'OrderOverlay';