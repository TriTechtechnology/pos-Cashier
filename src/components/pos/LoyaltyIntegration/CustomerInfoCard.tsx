import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User } from 'lucide-react';
import { CustomerInfo } from '@/types/pos';

interface CustomerInfoCardProps {
  customer: CustomerInfo;
  formatCurrency: (amount: number) => string;
  formatDate: (dateString: string) => string;
}

export const CustomerInfoCard: React.FC<CustomerInfoCardProps> = ({
  customer,
  formatCurrency,
  formatDate
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <User className="w-4 h-4" />
          Customer Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-muted-foreground">Name:</span>
            <p className="font-medium">{customer.name}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Phone:</span>
            <p className="font-medium">{customer.phone}</p>
          </div>
          {customer.email && (
            <div className="col-span-2">
              <span className="text-muted-foreground">Email:</span>
              <p className="font-medium">{customer.email}</p>
            </div>
          )}
          {customer.specialInstructions && (
            <div className="col-span-2">
              <span className="text-muted-foreground">Special Instructions:</span>
              <p className="font-medium">{customer.specialInstructions}</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 text-sm">
          <div className="text-center">
            <span className="text-muted-foreground">Orders</span>
            <p className="font-medium">{customer.totalOrders || 0}</p>
          </div>
          <div className="text-center">
            <span className="text-muted-foreground">Total Spent</span>
            <p className="font-medium">{formatCurrency(customer.totalSpent || 0)}</p>
          </div>
          <div className="text-center">
            <span className="text-muted-foreground">Member Since</span>
            <p className="font-medium">{customer.memberSince ? formatDate(customer.memberSince) : 'N/A'}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
