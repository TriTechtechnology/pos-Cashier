import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, AlertTriangle, BarChart3, TrendingDown } from 'lucide-react';
import { InventoryStats } from '@/types/inventory';

interface StatisticsCardsProps {
  stats: InventoryStats;
}

export function StatisticsCards({ stats }: StatisticsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-text-secondary">Inventory Value</CardTitle>
          <Package className="h-4 w-4 text-text-secondary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-text-primary">${stats.totalInventoryValue.toFixed(2)}</div>
          <p className="text-xs text-text-secondary">Total stock value</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-text-secondary">Low Stock</CardTitle>
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-500">{stats.lowStockItems}</div>
          <p className="text-xs text-text-secondary">Items need restocking</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-text-secondary">Net Profit</CardTitle>
          <BarChart3 className="h-4 w-4 text-text-secondary" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${stats.netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            ${stats.netProfit.toFixed(2)}
          </div>
          <p className="text-xs text-text-secondary">Income - Expenses</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-text-secondary">Total Expenses</CardTitle>
          <TrendingDown className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-500">${stats.totalExpenses.toFixed(2)}</div>
          <p className="text-xs text-text-secondary">This month</p>
        </CardContent>
      </Card>
    </div>
  );
}