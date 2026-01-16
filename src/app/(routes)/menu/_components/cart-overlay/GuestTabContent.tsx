import React from 'react';
import { Button } from '@/components/ui/button';
import { CustomerInfo } from '@/types/pos';

interface GuestTabContentProps {
  mode: 'cart' | 'confirmation';
  customer: CustomerInfo | undefined;
  scannedCustomer: CustomerInfo | null;
  recentCustomers: CustomerInfo[];
  searchQuery: string;
  searchResults: CustomerInfo[];
  isSearching: boolean;
  customerLookup: string;
  isLookingUp: boolean;
  guestName: string;
  guestPhone: string;
  guestEmail: string;
  guestInstructions: string;
  guestStamps: number;
  onGuestNameChange: (name: string) => void;
  onGuestPhoneChange: (phone: string) => void;
  onGuestEmailChange: (email: string) => void;
  onGuestInstructionsChange: (instructions: string) => void;
  onGuestStampsChange: (stamps: number) => void;
  onCustomerLookupChange: (lookup: string) => void;
  onCustomerLookup: () => void;
  onSearchInputChange: (value: string) => void;
  onSaveGuestInfo: () => void;
  onSetCustomer: (customer: CustomerInfo) => void;
}

export const GuestTabContent: React.FC<GuestTabContentProps> = React.memo(({
  mode,
  customer,
  scannedCustomer,
  guestName,
  guestPhone,
  guestInstructions,
  onGuestNameChange,
  onGuestPhoneChange,
  onGuestInstructionsChange,
  onSaveGuestInfo,
  onSetCustomer
}) => {
  // Confirmation mode - minimal customer display
  if (mode === 'confirmation') {
    return (
      <div className="h-full overflow-y-auto scrollbar-hide p-4">
        {customer && (
          <div className="space-y-3">
            <div className="p-3 border border-border rounded-lg bg-card">
              <h4 className="text-sm font-medium text-text-primary mb-2">Customer</h4>
              <p className="text-text-primary">{customer.name}</p>
              {customer.phone && <p className="text-sm text-text-secondary">{customer.phone}</p>}
              {customer.loyaltyCardId && (
                <p className="text-xs text-green-600 mt-2">Loyalty Member</p>
              )}
            </div>
            {guestInstructions && (
              <div className="p-3 border border-border rounded-lg bg-card">
                <h4 className="text-sm font-medium text-text-primary mb-2">Special Instructions</h4>
                <p className="text-sm text-text-secondary">{guestInstructions}</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Cart mode - minimal customer entry
  return (
    <div className="h-full overflow-y-auto scrollbar-hide p-4">
      {/* Scanned Customer - Simple */}
      {scannedCustomer && !customer && (
        <div className="p-3 border border-green-200 rounded-lg bg-green-50 mb-4">
          <h4 className="text-sm font-medium text-text-primary mb-2">Scanned Customer</h4>
          <p className="text-text-primary">{scannedCustomer.name}</p>
          <p className="text-sm text-text-secondary">{scannedCustomer.phone}</p>
          <Button
            variant="line"
            size="sm"
            className="mt-2"
            onClick={() => onSetCustomer(scannedCustomer)}
          >
            Use Customer
          </Button>
        </div>
      )}

      {/* Guest Info - Minimal Form */}
      <div className="space-y-3">
        <h3 className="text-base font-medium text-text-primary">Guest Information</h3>

        <div>
          <input
            type="text"
            placeholder="Guest name (optional)"
            value={guestName}
            onChange={(e) => onGuestNameChange(e.target.value)}
            className="w-full p-3 bg-background border border-border rounded-lg text-text-primary placeholder-text-secondary"
          />
        </div>

        <div>
          <input
            type="tel"
            placeholder="Phone number (optional)"
            value={guestPhone}
            onChange={(e) => onGuestPhoneChange(e.target.value)}
            className="w-full p-3 bg-background border border-border rounded-lg text-text-primary placeholder-text-secondary"
          />
        </div>

        <div>
          <textarea
            placeholder="Special instructions..."
            value={guestInstructions}
            onChange={(e) => onGuestInstructionsChange(e.target.value)}
            rows={3}
            className="w-full p-3 bg-background border border-border rounded-lg text-text-primary placeholder-text-secondary resize-none"
          />
        </div>

        {(guestName || guestPhone || guestInstructions) && (
          <Button
            variant="line"
            className="w-full"
            onClick={onSaveGuestInfo}
          >
            Save Guest Info
          </Button>
        )}
      </div>

      {/* Current Customer Display */}
      {customer && (
        <div className="mt-6 p-3 border border-border rounded-lg bg-card">
          <h4 className="text-sm font-medium text-text-primary mb-2">Current Customer</h4>
          <p className="text-text-primary">{customer.name}</p>
          {customer.phone && <p className="text-sm text-text-secondary">{customer.phone}</p>}
          {customer.loyaltyCardId && (
            <p className="text-xs text-green-600 mt-2">Loyalty Member</p>
          )}
        </div>
      )}
    </div>
  );
});

GuestTabContent.displayName = 'GuestTabContent';