import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Gift, Plus, Minus } from 'lucide-react';
import { CustomerInfo } from '@/types/pos';

interface LoyaltyStampsCardProps {
  customer: CustomerInfo;
  mode: 'cart' | 'confirmation';
  stampInput: string;
  isProcessing: boolean;
  onStampInputChange: (value: string) => void;
  onAddStamps: () => void;
  onRedeemStamps: () => void;
}

export const LoyaltyStampsCard: React.FC<LoyaltyStampsCardProps> = ({
  customer,
  mode,
  stampInput,
  isProcessing,
  onStampInputChange,
  onAddStamps,
  onRedeemStamps
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Gift className="w-4 h-4" />
          Loyalty Stamps
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <span className="text-muted-foreground text-sm">Current Stamps</span>
            <p className="text-2xl font-bold text-primary">{customer.currentStamps || 0}</p>
          </div>
          <div>
            <span className="text-muted-foreground text-sm">Total Stamps</span>
            <p className="text-2xl font-bold">{customer.totalStamps || 0}</p>
          </div>
        </div>

        {mode === 'cart' && (
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                placeholder="Number of stamps"
                value={stampInput}
                onChange={(e) => onStampInputChange(e.target.value)}
                type="number"
                min="1"
              />
              <Button 
                onClick={onAddStamps}
                disabled={isProcessing || !stampInput || parseInt(stampInput) <= 0}
                size="sm"
              >
                <Plus className="w-4 h-4" />
              </Button>
              <Button 
                onClick={onRedeemStamps}
                disabled={isProcessing || !stampInput || parseInt(stampInput) <= 0 || (customer.currentStamps || 0) < parseInt(stampInput)}
                size="sm"
                variant="line"
              >
                <Minus className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Add stamps with +, redeem with -
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
