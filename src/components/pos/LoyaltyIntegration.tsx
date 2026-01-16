/**
 * LoyaltyIntegration Component
 * 
 * PURPOSE: Manages customer loyalty card integration including scanning, customer lookup,
 * stamp tracking, and order history display.
 * 
 * LINKS WITH:
 * - LoyaltyEmptyState: Shows when no customer is selected
 * - CustomerInfoCard: Displays customer details and loyalty info
 * - LoyaltyStampsCard: Shows current stamps and redemption options
 * - OrderHistoryCard: Displays past orders for reordering
 * - LoyaltyActions: Scan card, lookup customer, redeem stamps
 * - useLoyaltyIntegration hook: Loyalty state management
 * - LoyaltyAPI: Loyalty card operations and data
 * - useCustomerStore: Customer data management
 * - formatCurrency: Price formatting
 * - formatDate: Date formatting
 * 
 * WHY: Essential for customer retention and loyalty programs. Integrates with
 * the cart system to apply loyalty benefits and track customer preferences.
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { QrCode, User, Gift, History, Plus, Minus, Search } from 'lucide-react';
import { useCustomerStore } from '@/lib/store/customer';
import { LoyaltyCard } from '@/lib/api/loyalty';
import LoyaltyCardScanner from './LoyaltyCardScanner';
import { formatCurrency } from '@/lib/utils/format';
import { formatDate } from '@/lib/utils/format';

interface LoyaltyIntegrationProps {
  mode: 'cart' | 'confirmation';
  onClose?: () => void;
}

const LoyaltyIntegration: React.FC<LoyaltyIntegrationProps> = ({ mode, onClose }) => {
  const { scannedCustomer, clearScannedCustomer } = useCustomerStore();
  
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [searchPhone, setSearchPhone] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [stampInput, setStampInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState({
    name: '',
    phone: '',
    email: '',
    specialInstructions: ''
  });

  const handleScanCard = (loyaltyCard: LoyaltyCard) => {
    // Scanner will handle setting the customer via MenuBubble
    console.log('Loyalty card scanned:', loyaltyCard);
  };

  const handleSearchByPhone = async () => {
    if (!searchPhone.trim()) return;
    
    setIsSearching(true);
    try {
      // TODO: Implement phone search functionality
      console.log('Searching by phone:', searchPhone);
    } catch (error) {
      console.error('Error searching by phone:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleCreateLoyaltyCard = async () => {
    if (!newCustomerData.name.trim() || !newCustomerData.phone.trim()) return;
    
    setIsProcessing(true);
    try {
      // TODO: Implement loyalty card creation
      console.log('Creating loyalty card:', newCustomerData);
      setShowCreateForm(false);
      setNewCustomerData({ name: '', phone: '', email: '', specialInstructions: '' });
    } catch (error) {
      console.error('Error creating loyalty card:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddStamps = async () => {
    const stamps = parseInt(stampInput);
    if (isNaN(stamps) || stamps <= 0) return;
    
    setIsProcessing(true);
    try {
      // TODO: Implement stamp management
      console.log('Adding stamps:', stamps);
      setStampInput('');
    } catch (error) {
      console.error('Error adding stamps:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRedeemStamps = async () => {
    const stamps = parseInt(stampInput);
    if (isNaN(stamps) || stamps <= 0) return;
    
    setIsProcessing(true);
    try {
      // TODO: Implement stamp redemption
      console.log('Redeeming stamps:', stamps);
      setStampInput('');
    } catch (error) {
      console.error('Error redeeming stamps:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReorder = (order: any) => {
    // TODO: Implement reorder functionality
    console.log('Reordering:', order);
    if (onClose) onClose();
  };

  if (!scannedCustomer) {
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
            onClick={() => setIsScannerOpen(true)} 
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
              onChange={(e) => setSearchPhone(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearchByPhone()}
            />
            <Button 
              onClick={handleSearchByPhone}
              disabled={isSearching || !searchPhone.trim()}
              size="sm"
            >
              <Search className="w-4 h-4" />
            </Button>
          </div>

          <Button 
            onClick={() => setShowCreateForm(true)}
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
                onChange={(e) => setNewCustomerData(prev => ({ ...prev, name: e.target.value }))}
              />
              <Input
                placeholder="Phone Number *"
                value={newCustomerData.phone}
                onChange={(e) => setNewCustomerData(prev => ({ ...prev, phone: e.target.value }))}
              />
              <Input
                placeholder="Email (optional)"
                value={newCustomerData.email}
                onChange={(e) => setNewCustomerData(prev => ({ ...prev, email: e.target.value }))}
              />
              <Input
                placeholder="Special Instructions (optional)"
                value={newCustomerData.specialInstructions}
                onChange={(e) => setNewCustomerData(prev => ({ ...prev, specialInstructions: e.target.value }))}
              />
              <div className="flex gap-2">
                <Button 
                  onClick={handleCreateLoyaltyCard}
                  disabled={isProcessing || !newCustomerData.name.trim() || !newCustomerData.phone.trim()}
                  className="flex-1"
                >
                  Create Card
                </Button>
                <Button 
                  onClick={() => setShowCreateForm(false)}
                  variant="line"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <LoyaltyCardScanner
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          onCardFound={handleScanCard}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Customer Information */}
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
              <p className="font-medium">{scannedCustomer.name}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Phone:</span>
              <p className="font-medium">{scannedCustomer.phone}</p>
            </div>
            {scannedCustomer.email && (
              <div className="col-span-2">
                <span className="text-muted-foreground">Email:</span>
                <p className="font-medium">{scannedCustomer.email}</p>
              </div>
            )}
            {scannedCustomer.specialInstructions && (
              <div className="col-span-2">
                <span className="text-muted-foreground">Special Instructions:</span>
                <p className="font-medium">{scannedCustomer.specialInstructions}</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="text-center">
              <span className="text-muted-foreground">Orders</span>
              <p className="font-medium">{scannedCustomer.totalOrders || 0}</p>
            </div>
            <div className="text-center">
              <span className="text-muted-foreground">Total Spent</span>
              <p className="font-medium">{formatCurrency(scannedCustomer.totalSpent || 0)}</p>
            </div>
            <div className="text-center">
              <span className="text-muted-foreground">Member Since</span>
              <p className="font-medium">{scannedCustomer.memberSince ? formatDate(scannedCustomer.memberSince) : 'N/A'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loyalty Stamps */}
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
              <p className="text-2xl font-bold text-primary">{scannedCustomer.currentStamps || 0}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-sm">Total Stamps</span>
              <p className="text-2xl font-bold">{scannedCustomer.totalStamps || 0}</p>
            </div>
          </div>

          {mode === 'cart' && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Number of stamps"
                  value={stampInput}
                  onChange={(e) => setStampInput(e.target.value)}
                  type="number"
                  min="1"
                />
                <Button 
                  onClick={handleAddStamps}
                  disabled={isProcessing || !stampInput || parseInt(stampInput) <= 0}
                  size="sm"
                >
                  <Plus className="w-4 h-4" />
                </Button>
                <Button 
                  onClick={handleRedeemStamps}
                  disabled={isProcessing || !stampInput || parseInt(stampInput) <= 0 || (scannedCustomer.currentStamps || 0) < parseInt(stampInput)}
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

      {/* Order History */}
      {scannedCustomer.orderHistory && scannedCustomer.orderHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <History className="w-4 h-4" />
              Recent Orders ({scannedCustomer.orderHistory.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {scannedCustomer.orderHistory.slice(0, 5).map((order) => (
              <div 
                key={order.id}
                className="flex items-center justify-between p-2 border rounded-lg hover:bg-muted/50 cursor-pointer"
                onClick={() => scannedCustomer.orderHistory && handleReorder(scannedCustomer.orderHistory.find((o: any) => o.id === order.id)!)}
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
            {scannedCustomer.orderHistory.length > 5 && (
              <p className="text-xs text-muted-foreground text-center">
                Showing 5 of {scannedCustomer.orderHistory.length} orders
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      {mode === 'cart' && (
        <div className="space-y-2">
          <Button 
            onClick={() => setIsScannerOpen(true)}
            className="w-full"
            variant="line"
            size="sm"
          >
            <QrCode className="w-4 h-4 mr-2" />
            Scan Different Card
          </Button>
          <Button 
            onClick={clearScannedCustomer}
            className="w-full"
            variant="line"
            size="sm"
          >
            Clear Customer Data
          </Button>
        </div>
      )}

      <LoyaltyCardScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onCardFound={handleScanCard}
      />
    </div>
  );
};

export default LoyaltyIntegration;
