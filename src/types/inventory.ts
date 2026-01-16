export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  sku: string;
  quantity: number;
  minQuantity: number;
  cost: number;
  price: number;
  supplier: string;
  lastUpdated: Date;
  status: 'in-stock' | 'low-stock' | 'out-of-stock';
}

export interface Expense {
  id: string;
  description: string;
  category: string;
  amount: number;
  date: Date;
  type: 'income' | 'expense';
  paymentMethod: string;
  notes?: string;
}

export interface InventoryFilters {
  searchQuery: string;
  categoryFilter: string;
  statusFilter: InventoryItem['status'] | 'all';
}

export interface InventoryStats {
  totalInventoryValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  totalExpenses: number;
  totalIncome: number;
  netProfit: number;
}

export type ActiveTab = 'inventory' | 'expenses';