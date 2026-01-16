import React from 'react';
import { Banknote, CreditCard, Users } from 'lucide-react';
import { useBranchConfigStore } from '@/lib/store/branchConfig';

type PaymentTab = 'cash' | 'card' | 'split';

interface PaymentOverlayTabsProps {
  activeTab: PaymentTab;
  onTabChange: (tab: PaymentTab) => void;
}

export const PaymentOverlayTabs: React.FC<PaymentOverlayTabsProps> = React.memo(({
  activeTab,
  onTabChange
}) => {
  // Get branch config to filter payment methods
  const branchConfig = useBranchConfigStore(state => state.config);

  // Check which payment methods are enabled
  const isCashEnabled = branchConfig?.paymentMethods?.cash?.enabled ??
                        branchConfig?.posConfig?.paymentMethods?.cash?.enabled ??
                        true; // Default to enabled

  const isCardEnabled = branchConfig?.paymentMethods?.card?.enabled ??
                        branchConfig?.posConfig?.paymentMethods?.card?.enabled ??
                        true; // Default to enabled

  // Mobile payment is not shown in tabs, but split requires at least 2 methods
  const isMobileEnabled = branchConfig?.paymentMethods?.mobile?.enabled ??
                          branchConfig?.posConfig?.paymentMethods?.mobile?.enabled ??
                          true;

  // Count enabled payment methods
  const enabledMethodsCount = [isCashEnabled, isCardEnabled, isMobileEnabled].filter(Boolean).length;
  const isSplitEnabled = enabledMethodsCount >= 2; // Split requires at least 2 methods

  // Filter tabs based on enabled payment methods
  const allTabs = [
    { id: 'cash' as PaymentTab, label: 'Cash', icon: Banknote, enabled: isCashEnabled },
    { id: 'card' as PaymentTab, label: 'Card', icon: CreditCard, enabled: isCardEnabled },
    { id: 'split' as PaymentTab, label: 'Split', icon: Users, enabled: isSplitEnabled }
  ];

  // Only show tabs for enabled payment methods
  const tabs = allTabs.filter(tab => tab.enabled);

  console.log('💳 [PAYMENT TABS] Payment methods:', {
    cash: isCashEnabled,
    card: isCardEnabled,
    mobile: isMobileEnabled,
    split: isSplitEnabled,
    visibleTabs: tabs.map(t => t.id)
  });

  // Auto-switch to first enabled tab if current tab is disabled
  React.useEffect(() => {
    const isActiveTabEnabled = tabs.some(tab => tab.id === activeTab);
    if (!isActiveTabEnabled && tabs.length > 0) {
      console.log('⚠️ [PAYMENT TABS] Active tab not enabled, switching to:', tabs[0].id);
      onTabChange(tabs[0].id);
    }
  }, [activeTab, tabs, onTabChange]);

  return (
    <div className="flex gap-1 p-4 flex-shrink-0">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`relative px-6 py-2 rounded-[42px] text-sm font-medium whitespace-nowrap flex items-center justify-center flex-shrink-0 transition-all duration-500 ease-in-out ${
              isActive
                ? 'bg-card text-text-primary border border-border shadow-sm'
                : 'text-text-secondary hover:text-text-primary bg-transparent border border-transparent'
            }`}
            style={{
              minWidth: 'fit-content',
              fontFamily: 'Inter',
              fontSize: '14px',
              fontWeight: 500,
              lineHeight: '1.4em'
            }}
          >
            <Icon className="w-4 h-4 mr-2" />
            <span className="text-center transition-colors duration-500 ease-in-out">
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
});

PaymentOverlayTabs.displayName = 'PaymentOverlayTabs';
