import React from 'react';

interface CartOverlayTabsProps {
  activeTab: 'check' | 'actions' | 'guest';
  onTabChange: (tab: 'check' | 'actions' | 'guest') => void;
}

export const CartOverlayTabs: React.FC<CartOverlayTabsProps> = React.memo(({
  activeTab,
  onTabChange
}) => {
  return (
    <div className="flex gap-1 p-4 flex-shrink-0">
      <button
        onClick={() => onTabChange('check')}
        className={`relative px-6 py-2 rounded-[42px] text-sm font-medium whitespace-nowrap flex items-center justify-center flex-shrink-0 transition-all duration-500 ease-in-out ${
          activeTab === 'check'
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
        <span className="text-center transition-colors duration-500 ease-in-out">
          Check
        </span>
      </button>
      <button
        onClick={() => onTabChange('actions')}
        className={`relative px-6 py-2 rounded-[42px] text-sm font-medium whitespace-nowrap flex items-center justify-center flex-shrink-0 transition-all duration-500 ease-in-out ${
          activeTab === 'actions'
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
        <span className="text-center transition-colors duration-500 ease-in-out">
          Actions
        </span>
      </button>
      <button
        onClick={() => onTabChange('guest')}
        className={`relative px-6 py-2 rounded-[42px] text-sm font-medium whitespace-nowrap flex items-center justify-center flex-shrink-0 transition-all duration-500 ease-in-out ${
          activeTab === 'guest'
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
        <span className="text-center transition-colors duration-500 ease-in-out">
          Guest
        </span>
      </button>
    </div>
  );
});

CartOverlayTabs.displayName = 'CartOverlayTabs';
