import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Edit, Trash2 } from 'lucide-react';
import { Expense } from '@/types/inventory';

interface ExpenseItemProps {
  expense: Expense;
  onView?: (expense: Expense) => void;
  onEdit?: (expense: Expense) => void;
  onDelete?: (expense: Expense) => void;
}

export function ExpenseItemComponent({ expense, onView, onEdit, onDelete }: ExpenseItemProps) {
  return (
    <div className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-card/50 transition-colors">
      <div className="flex items-center space-x-4">
        <div>
          <p className="font-medium text-text-primary">{expense.description}</p>
          <p className="text-sm text-text-secondary">{expense.category} • {expense.paymentMethod}</p>
        </div>
        <div className="flex gap-2">
          <Badge className={expense.type === 'income' ? 'bg-green-500' : 'bg-red-500'}>
            {expense.type === 'income' ? 'Income' : 'Expense'}
          </Badge>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="text-right">
          <p className={`font-medium ${expense.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
            {expense.type === 'income' ? '+' : '-'}${expense.amount.toFixed(2)}
          </p>
          <p className="text-sm text-text-secondary">
            {expense.date.toLocaleDateString()}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="icon-line" 
            size="sm"
            onClick={() => onView?.(expense)}
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button 
            variant="line" 
            size="sm"
            onClick={() => onEdit?.(expense)}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button 
            variant="line" 
            size="sm" 
            className="text-red-500 hover:text-red-600"
            onClick={() => onDelete?.(expense)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}