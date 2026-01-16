import { InventoryItem, Expense } from '@/types/inventory';

const CATEGORIES = ['Beverages', 'Food Items', 'Supplies', 'Equipment'];
const SUPPLIERS = ['Supplier A', 'Supplier B', 'Supplier C', 'Supplier D'];
const EXPENSE_CATEGORIES = ['Food & Beverage', 'Supplies', 'Equipment', 'Utilities', 'Rent', 'Salary'];
const PAYMENT_METHODS = ['Cash', 'Card', 'Bank Transfer'];

export const generateMockInventory = (): InventoryItem[] => {
  return Array.from({ length: 15 }, (_, index) => {
    const quantity = Math.floor(Math.random() * 100) + 1;
    const minQuantity = 10;
    const cost = Math.floor(Math.random() * 50) + 5;
    const price = cost * (1.5 + Math.random() * 0.5);
    
    let status: InventoryItem['status'] = 'in-stock';
    if (quantity === 0) status = 'out-of-stock';
    else if (quantity <= minQuantity) status = 'low-stock';
    
    return {
      id: `item-${index + 1}`,
      name: `Item ${index + 1}`,
      category: CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)],
      sku: `SKU${String(index + 1001).padStart(6, '0')}`,
      quantity,
      minQuantity,
      cost,
      price,
      supplier: SUPPLIERS[Math.floor(Math.random() * SUPPLIERS.length)],
      lastUpdated: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      status,
    };
  });
};

export const generateMockExpenses = (): Expense[] => {
  return Array.from({ length: 20 }, (_, index) => ({
    id: `expense-${index + 1}`,
    description: `Expense ${index + 1}`,
    category: EXPENSE_CATEGORIES[Math.floor(Math.random() * EXPENSE_CATEGORIES.length)],
    amount: Math.floor(Math.random() * 1000) + 10,
    date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
    type: Math.random() > 0.7 ? 'income' : 'expense',
    paymentMethod: PAYMENT_METHODS[Math.floor(Math.random() * PAYMENT_METHODS.length)],
    notes: Math.random() > 0.5 ? `Note for expense ${index + 1}` : undefined,
  }));
};