import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { QrCode, Gift, Plus, Search } from 'lucide-react';
// import { CustomerInfo } from '@/types/pos'; // Currently unused

interface LoyaltyEmptyStateProps {
  searchPhone: string;
  isSearching: boolean;
  showCreateForm: boolean;
  newCustomerData: {
    name: string;
    phone: string;
    email: string;
    specialInstructions: string;
  };
  onSearchPhoneChange: (value: string) => void;
  onSearchByPhone: () => void;
  onShowCreateFormChange: (show: boolean) => void;
  onNewCustomerDataChange: (field: 'name' | 'phone' | 'email' | 'specialInstructions', value: string) => void;
  onCreateLoyaltyCard: () => void;
  onScanCard: () => void;
}

export const LoyaltyEmptyState: React.FC<LoyaltyEmptyStateProps> = ({
  searchPhone,
  isSearching,
  showCreateForm,
  newCustomerData,
  onSearchPhoneChange,
  onSearchByPhone,
  onShowCreateFormChange,
  onNewCustomerDataChange,
  onCreateLoyaltyCard,
  onScanCard
}) => {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <Gift className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">Loyalty Card</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Scan a loyalty card or search by phone number to access customer information and order history
        </p>
      </div>

      <div className="space-y-3">
        <Button 
          onClick={onScanCard} 
          className="w-full"
          variant="line"
        >
          <QrCode className="w-4 h-4 mr-2" />
          Scan Loyalty Card
        </Button>

        <div className="flex gap-2">
          <Input
            placeholder="Enter phone number"
            value={searchPhone}
            onChange={(e) => onSearchPhoneChange(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && onSearchByPhone()}
          />
          <Button 
            onClick={onSearchByPhone}
            disabled={isSearching || !searchPhone.trim()}
            size="sm"
          >
            <Search className="w-4 h-4" />
          </Button>
        </div>

        <Button 
          onClick={() => onShowCreateFormChange(true)}
          className="w-full"
          variant="line"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create New Loyalty Card
        </Button>
      </div>

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Create New Loyalty Card</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Customer Name *"
              value={newCustomerData.name}
              onChange={(e) => onNewCustomerDataChange('name', e.target.value)}
            />
            <Input
              placeholder="Phone Number *"
              value={newCustomerData.phone}
              onChange={(e) => onNewCustomerDataChange('phone', e.target.value)}
            />
            <Input
              placeholder="Email (optional)"
              value={newCustomerData.email}
              onChange={(e) => onNewCustomerDataChange('email', e.target.value)}
            />
            <Input
              placeholder="Special Instructions (optional)"
              value={newCustomerData.specialInstructions}
              onChange={(e) => onNewCustomerDataChange('specialInstructions', e.target.value)}
            />
            <div className="flex gap-2">
              <Button 
                onClick={onCreateLoyaltyCard}
                disabled={!newCustomerData.name.trim() || !newCustomerData.phone.trim()}
                className="flex-1"
              >
                Create Card
              </Button>
              <Button 
                onClick={() => onShowCreateFormChange(false)}
                variant="line"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
