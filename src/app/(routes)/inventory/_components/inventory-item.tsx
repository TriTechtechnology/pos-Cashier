import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Edit, Trash2 } from 'lucide-react';
import { InventoryItem } from '@/types/inventory';

interface InventoryItemProps {
  item: InventoryItem;
  onView?: (item: InventoryItem) => void;
  onEdit?: (item: InventoryItem) => void;
  onDelete?: (item: InventoryItem) => void;
}

const getStatusColor = (status: InventoryItem['status']) => {
  switch (status) {
    case 'in-stock': return 'bg-green-500';
    case 'low-stock': return 'bg-yellow-500';
    case 'out-of-stock': return 'bg-red-500';
    default: return 'bg-gray-500';
  }
};

const getStatusText = (status: InventoryItem['status']) => {
  switch (status) {
    case 'in-stock': return 'In Stock';
    case 'low-stock': return 'Low Stock';
    case 'out-of-stock': return 'Out of Stock';
    default: return 'Unknown';
  }
};

export function InventoryItemComponent({ item, onView, onEdit, onDelete }: InventoryItemProps) {
  return (
    <div className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-card/50 transition-colors">
      <div className="flex items-center space-x-4">
        <div>
          <p className="font-medium text-text-primary">{item.name}</p>
          <p className="text-sm text-text-secondary">{item.sku} • {item.category}</p>
        </div>
        <div className="flex gap-2">
          <Badge className={getStatusColor(item.status)}>
            {getStatusText(item.status)}
          </Badge>
          <Badge variant="secondary">
            Qty: {item.quantity}
          </Badge>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="text-right">
          <p className="font-medium text-text-primary">${item.price.toFixed(2)}</p>
          <p className="text-sm text-text-secondary">Cost: ${item.cost.toFixed(2)}</p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="icon-line" 
            size="sm"
            onClick={() => onView?.(item)}
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button 
            variant="icon-line" 
            size="sm"
            onClick={() => onEdit?.(item)}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button 
            variant="icon-line" 
            size="sm" 
            className="text-red-500 hover:text-red-600"
            onClick={() => onDelete?.(item)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}