import React from 'react';

interface OrderTabsProps {
  activeTab: 'all' | 'pending' | 'in-progress' | 'ready' | 'completed' | 'cancelled' | 'unpaid';
  onTabChange: (tab: 'all' | 'pending' | 'in-progress' | 'ready' | 'completed' | 'cancelled' | 'unpaid') => void;
  tabCounts: {
    all: number;
    pending: number;
    'in-progress': number;
    ready: number;
    completed: number;
    cancelled: number;
    unpaid: number;
  };
}

export const OrderTabs: React.FC<OrderTabsProps> = React.memo(({
  activeTab,
  onTabChange,
  tabCounts
}) => {
  const tabs = [
    { key: 'all' as const, label: 'ALL', count: tabCounts.all },
    // Pending and Ready will be added later with KDS module
    { key: 'in-progress' as const, label: 'In Progress', count: tabCounts['in-progress'] },
    { key: 'unpaid' as const, label: 'Unpaid', count: tabCounts.unpaid },
    { key: 'completed' as const, label: 'Completed', count: tabCounts.completed },
    { key: 'cancelled' as const, label: 'Cancelled', count: tabCounts.cancelled }
  ];

  return (
    <div className="flex gap-1 flex-shrink-0">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
          className={`relative px-6 py-2 rounded-xl text-sm font-medium whitespace-nowrap flex items-center justify-center flex-shrink-0 transition-all duration-500 ease-in-out ${
            activeTab === tab.key
              ? 'bg-secondary text-text-primary border border-border'
              : 'text-text-secondary hover:text-text-primary bg-transparent border border-transparent'
          }`}
          style={{
            minWidth: 'fit-content',
            fontSize: '14px',
            fontWeight: 800,
            lineHeight: '1.4em'
          }}
        >
          <span className="text-center transition-colors duration-500 ease-in-out">
            {tab.label} ({tab.count})
          </span>
        </button>
      ))}
    </div>
  );
});

OrderTabs.displayName = 'OrderTabs';
