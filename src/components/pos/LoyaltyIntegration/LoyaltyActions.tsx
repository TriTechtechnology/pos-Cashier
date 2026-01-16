import { Button } from '@/components/ui/button';
import { QrCode } from 'lucide-react';

interface LoyaltyActionsProps {
  mode: 'cart' | 'confirmation';
  onScanCard: () => void;
  onClearCustomerData: () => void;
}

export const LoyaltyActions: React.FC<LoyaltyActionsProps> = ({
  mode,
  onScanCard,
  onClearCustomerData
}) => {
  if (mode !== 'cart') {
    return null;
  }

  return (
    <div className="space-y-2">
      <Button 
        onClick={onScanCard}
        className="w-full"
        variant="line"
        size="sm"
      >
        <QrCode className="w-4 h-4 mr-2" />
        Scan Different Card
      </Button>
      <Button 
        onClick={onClearCustomerData}
        className="w-full"
        variant="line"
        size="sm"
      >
        Clear Customer Data
      </Button>
    </div>
  );
};
