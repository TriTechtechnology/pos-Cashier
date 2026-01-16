import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { History } from 'lucide-react';
import { CustomerInfo } from '@/types/pos';
import { LoyaltyOrder } from '@/lib/api/loyalty';

interface OrderHistoryCardProps {
  customer: CustomerInfo;
  formatCurrency: (amount: number) => string;
  formatDate: (dateString: string) => string;
  onReorder: (order: LoyaltyOrder) => void;
}

export const OrderHistoryCard: React.FC<OrderHistoryCardProps> = ({
  customer,
  formatCurrency,
  formatDate,
  onReorder
}) => {
  if (!customer.orderHistory || customer.orderHistory.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <History className="w-4 h-4" />
          Recent Orders ({customer.orderHistory?.length || 0})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {customer.orderHistory?.slice(0, 5).map((order: any) => (
          <div 
            key={order.id}
            className="flex items-center justify-between p-2 border rounded-lg hover:bg-muted/50 cursor-pointer"
            onClick={() => {
              const foundOrder = customer.orderHistory?.find((o: any) => o.id === order.id);
              if (foundOrder) {
                onReorder(foundOrder as unknown as LoyaltyOrder);
              }
            }}
          >
            <div className="flex-1">
              <p className="font-medium text-sm">{formatDate(order.date)}</p>
              <p className="text-xs text-muted-foreground">
                {order.items.slice(0, 2).join(', ')}
                {order.items.length > 2 && ` +${order.items.length - 2} more`}
              </p>
            </div>
            <div className="text-right">
              <p className="font-medium text-sm">{formatCurrency(order.total)}</p>
              <p className="text-xs text-muted-foreground capitalize">{order.status}</p>
            </div>
          </div>
        ))}
        {customer.orderHistory.length > 5 && (
          <p className="text-xs text-muted-foreground text-center">
            Showing 5 of {customer.orderHistory.length} orders
          </p>
        )}
      </CardContent>
    </Card>
  );
};
