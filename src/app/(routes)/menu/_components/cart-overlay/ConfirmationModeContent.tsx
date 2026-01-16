import React from 'react';
import { CheckTabContent } from './CheckTabContent';
import { GuestTabContent } from './GuestTabContent';
import { CartItem as CartItemType } from '@/lib/store/cart-new';
import { CustomerInfo } from '@/types/pos';

interface ConfirmationModeContentProps {
  activeTab: 'check' | 'actions' | 'guest';
  items: CartItemType[];
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
  onItemClick: (item: CartItemType) => void;
  onRepeat: (item: CartItemType) => void;
  onDelete: (itemId: string) => void;
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

export const ConfirmationModeContent: React.FC<ConfirmationModeContentProps> = React.memo(({
  activeTab,
  items,
  customer,
  scannedCustomer,
  recentCustomers,
  searchQuery,
  searchResults,
  isSearching,
  customerLookup,
  isLookingUp,
  guestName,
  guestPhone,
  guestEmail,
  guestInstructions,
  guestStamps,
  onItemClick,
  onRepeat,
  onDelete,
  onGuestNameChange,
  onGuestPhoneChange,
  onGuestEmailChange,
  onGuestInstructionsChange,
  onGuestStampsChange,
  onCustomerLookupChange,
  onCustomerLookup,
  onSearchInputChange,
  onSaveGuestInfo,
  onSetCustomer
}) => {
  return (
    <div className="flex flex-col flex-1 mx-4 mb-3 min-h-0">
      {/* Tab Content - Show in confirmation mode */}
      <div className="flex-1 bg-card rounded-lg border border-border p-1 min-h-0 overflow-hidden">
        {activeTab === 'check' && (
          <CheckTabContent
            mode="confirmation"
            items={items}
            onItemClick={onItemClick}
            onRepeat={onRepeat}
            onDelete={onDelete}
          />
        )}

        {activeTab === 'guest' && (
          <GuestTabContent
            mode="confirmation"
            customer={customer}
            scannedCustomer={scannedCustomer}
            recentCustomers={recentCustomers}
            searchQuery={searchQuery}
            searchResults={searchResults}
            isSearching={isSearching}
            customerLookup={customerLookup}
            isLookingUp={isLookingUp}
            guestName={guestName}
            guestPhone={guestPhone}
            guestEmail={guestEmail}
            guestInstructions={guestInstructions}
            guestStamps={guestStamps}
            onGuestNameChange={onGuestNameChange}
            onGuestPhoneChange={onGuestPhoneChange}
            onGuestEmailChange={onGuestEmailChange}
            onGuestInstructionsChange={onGuestInstructionsChange}
            onGuestStampsChange={onGuestStampsChange}
            onCustomerLookupChange={onCustomerLookupChange}
            onCustomerLookup={onCustomerLookup}
            onSearchInputChange={onSearchInputChange}
            onSaveGuestInfo={onSaveGuestInfo}
            onSetCustomer={onSetCustomer}
          />
        )}

        {/* Actions tab is not available in confirmation mode */}
        {activeTab === 'actions' && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-4xl mb-4">✅</div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">Order Confirmed</h3>
              <p className="text-sm text-text-secondary">Actions are not available in confirmation mode</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

ConfirmationModeContent.displayName = 'ConfirmationModeContent';
