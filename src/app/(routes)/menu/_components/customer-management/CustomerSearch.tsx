import React, { useState } from 'react';
import { Search, User, Phone, Mail } from 'lucide-react';
import { CustomerInfo } from '@/types/pos';

interface CustomerSearchProps {
  searchQuery: string;
  searchResults: CustomerInfo[];
  isSearching: boolean;
  onSearchInputChange: (value: string) => void;
  onCustomerSelect: (customer: CustomerInfo) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const CustomerSearch: React.FC<CustomerSearchProps> = React.memo(({
  searchQuery,
  searchResults,
  isSearching,
  onSearchInputChange,
  onCustomerSelect,
  placeholder = "Search by name, phone, or email...",
  disabled = false
}) => {
  const [showResults, setShowResults] = useState(false);

  const handleInputChange = (value: string) => {
    onSearchInputChange(value);
    setShowResults(value.length > 0);
  };

  const handleCustomerSelect = (customer: CustomerInfo) => {
    onCustomerSelect(customer);
    setShowResults(false);
  };

  const getCustomerIcon = (customer: CustomerInfo) => {
    if (customer.phone) return <Phone className="w-4 h-4" />;
    if (customer.email) return <Mail className="w-4 h-4" />;
    return <User className="w-4 h-4" />;
  };

  return (
    <div className="relative">
      {/* Search Input */}
      <div className="flex space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-secondary" />
          <input
            type="text"
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => handleInputChange(e.target.value)}
            disabled={disabled}
            className="w-full pl-10 pr-4 py-2 bg-input-bg border border-border rounded text-text-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      {/* Search Results */}
      {showResults && (
        <div className="absolute top-full left-0 right-0 mt-2 border border-border rounded-lg bg-white dark:bg-gray-800 max-h-64 overflow-y-auto z-10 shadow-lg">
          {isSearching && (
            <div className="p-4 text-center text-sm text-text-secondary">
              Searching...
            </div>
          )}
          
          {!isSearching && searchResults.length === 0 && searchQuery.length > 0 && (
            <div className="p-4 text-center text-sm text-text-secondary">
              No customers found
            </div>
          )}
          
          {searchResults.map((customer, index) => (
            <div
              key={customer.id || index}
              onClick={() => handleCustomerSelect(customer)}
              className="p-3 hover:bg-muted/50 cursor-pointer border-b border-border last:border-b-0 transition-colors"
            >
              <div className="flex items-center space-x-3">
                {getCustomerIcon(customer)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">
                    {customer.name || 'Unknown Customer'}
                  </p>
                  {customer.phone && (
                    <p className="text-xs text-text-secondary truncate">
                      {customer.phone}
                    </p>
                  )}
                  {customer.email && (
                    <p className="text-xs text-text-secondary truncate">
                      {customer.email}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

CustomerSearch.displayName = 'CustomerSearch';
