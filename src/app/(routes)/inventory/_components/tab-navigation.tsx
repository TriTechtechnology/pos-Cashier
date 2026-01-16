import { ActiveTab } from '@/types/inventory';

interface TabNavigationProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
}

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  return (
    <div className="flex space-x-1 bg-card p-1 rounded-lg">
      <button
        onClick={() => onTabChange('inventory')}
        className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
          activeTab === 'inventory'
            ? 'bg-primary text-primary-foreground'
            : 'text-text-secondary hover:text-text-primary'
        }`}
      >
        Inventory
      </button>
      <button
        onClick={() => onTabChange('expenses')}
        className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
          activeTab === 'expenses'
            ? 'bg-primary text-primary-foreground'
            : 'text-text-secondary hover:text-text-primary'
        }`}
      >
        Expenses
      </button>
    </div>
  );
}