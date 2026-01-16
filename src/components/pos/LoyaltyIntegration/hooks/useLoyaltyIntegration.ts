import { useState } from 'react';
import { useCustomerStore } from '@/lib/store/customer';
import { LoyaltyCard } from '@/lib/api/loyalty';

interface UseLoyaltyIntegrationProps {
  mode: 'cart' | 'confirmation';
  onClose?: () => void;
}

export const useLoyaltyIntegration = ({ onClose }: UseLoyaltyIntegrationProps) => {
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
    console.log('Loyalty card scanned:', loyaltyCard);
    // TODO: Implement loyalty card scanning
  };

  const handleSearchByPhone = async () => {
    if (!searchPhone.trim()) return;
    
    setIsSearching(true);
    try {
      console.log('Searching by phone:', searchPhone);
      // TODO: Implement phone search
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
      console.log('Creating loyalty card:', newCustomerData);
      // TODO: Implement loyalty card creation
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
      console.log('Adding stamps:', stamps);
      // TODO: Implement stamp management
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
      console.log('Redeeming stamps:', stamps);
      // TODO: Implement stamp redemption
      setStampInput('');
    } catch (error) {
      console.error('Error redeeming stamps:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReorder = (order: any) => {
    console.log('Reordering:', order);
    // TODO: Implement reorder functionality
    if (onClose) onClose();
  };

  const formatCurrency = (amount: number) => {
    return `Rs. ${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return {
    customer: scannedCustomer,
    isScannerOpen,
    searchPhone,
    isSearching,
    stampInput,
    isProcessing,
    showCreateForm,
    newCustomerData,
    handleScanCard,
    handleSearchByPhone,
    handleCreateLoyaltyCard,
    handleAddStamps,
    handleRedeemStamps,
    handleReorder,
    formatCurrency,
    formatDate,
    setIsScannerOpen,
    setSearchPhone,
    setStampInput,
    setShowCreateForm,
    setNewCustomerData,
    clearLoyaltyData: clearScannedCustomer
  };
};
