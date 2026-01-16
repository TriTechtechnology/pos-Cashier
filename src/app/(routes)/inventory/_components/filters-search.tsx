import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Filter } from 'lucide-react';
import { InventoryFilters, ActiveTab, InventoryItem } from '@/types/inventory';

interface FiltersSearchProps {
  activeTab: ActiveTab;
  filters: InventoryFilters;
  onFiltersChange: (filters: Partial<InventoryFilters>) => void;
}

export function FiltersSearch({ activeTab, filters, onFiltersChange }: FiltersSearchProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary w-4 h-4" />
              <Input
                placeholder={activeTab === 'inventory' ? "Search inventory items..." : "Search expenses..."}
                value={filters.searchQuery}
                onChange={(e) => onFiltersChange({ searchQuery: e.target.value })}
                className="pl-10"
              />
            </div>
          </div>
          {activeTab === 'inventory' && (
            <div className="flex gap-2">
              <select
                value={filters.categoryFilter}
                onChange={(e) => onFiltersChange({ categoryFilter: e.target.value })}
                className="px-3 py-2 bg-card border border-border rounded-md text-text-primary"
              >
                <option value="all">All Categories</option>
                <option value="Beverages">Beverages</option>
                <option value="Food Items">Food Items</option>
                <option value="Supplies">Supplies</option>
                <option value="Equipment">Equipment</option>
              </select>
              <select
                value={filters.statusFilter}
                onChange={(e) => onFiltersChange({ statusFilter: e.target.value as InventoryItem['status'] | 'all' })}
                className="px-3 py-2 bg-card border border-border rounded-md text-text-primary"
              >
                <option value="all">All Status</option>
                <option value="in-stock">In Stock</option>
                <option value="low-stock">Low Stock</option>
                <option value="out-of-stock">Out of Stock</option>
              </select>
            </div>
          )}
          <Button variant="line" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}