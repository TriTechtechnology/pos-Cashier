'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface BusinessConfig {
  id: string;
  name: string;
  type: 'restaurant' | 'cafe' | 'retail' | 'service';
  currency: string;
  currencySymbol: string;
  taxRates: {
    salesTax: number;
    serviceFee: number;
    deliveryFee: number;
  };
  features: {
    loyalty: boolean;
    delivery: boolean;
    takeaway: boolean;
    dineIn: boolean;
    reservations: boolean;
  };
  apiEndpoints: {
    base: string;
    categories: string;
    orders: string;
    loyalty: string;
    customers: string;
  };
}

interface BusinessContextType {
  currentBusiness: BusinessConfig | null;
  setBusiness: (business: BusinessConfig) => void;
  clearBusiness: () => void;
  isLoading: boolean;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export const useBusinessContext = () => {
  const context = useContext(BusinessContext);
  if (!context) {
    throw new Error('useBusinessContext must be used within a BusinessProvider');
  }
  return context;
};

interface BusinessProviderProps {
  children: ReactNode;
}

export const BusinessProvider: React.FC<BusinessProviderProps> = ({ children }) => {
  const [currentBusiness, setCurrentBusiness] = useState<BusinessConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load business configuration from localStorage or environment
    const loadBusinessConfig = () => {
      try {
        // Check for business ID in URL or localStorage
        const urlParams = new URLSearchParams(window.location.search);
        const businessId = urlParams.get('business') || localStorage.getItem('currentBusinessId');
        
        if (businessId) {
          // Load business-specific configuration
          const businessConfig = getBusinessConfig(businessId);
          if (businessConfig) {
            setCurrentBusiness(businessConfig);
            localStorage.setItem('currentBusinessId', businessId);
          }
        } else {
          // Default to demo business for development
          const demoBusiness = getBusinessConfig('demo');
          if (demoBusiness) {
            setCurrentBusiness(demoBusiness);
          }
        }
      } catch (error) {
        console.error('Failed to load business configuration:', error);
        // Fallback to demo business
        const demoBusiness = getBusinessConfig('demo');
        if (demoBusiness) {
          setCurrentBusiness(demoBusiness);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadBusinessConfig();
  }, []);

  const setBusiness = (business: BusinessConfig) => {
    setCurrentBusiness(business);
    localStorage.setItem('currentBusinessId', business.id);
    
    // Update environment variables for API calls
    if (typeof window !== 'undefined') {
      (window as any).NEXT_PUBLIC_API_BASE_URL = business.apiEndpoints.base;
    }
  };

  const clearBusiness = () => {
    setCurrentBusiness(null);
    localStorage.removeItem('currentBusinessId');
  };

  return (
    <BusinessContext.Provider value={{
      currentBusiness,
      setBusiness,
      clearBusiness,
      isLoading
    }}>
      {children}
    </BusinessContext.Provider>
  );
};

// Business configuration presets for different business types
const getBusinessConfig = (businessId: string): BusinessConfig | null => {
  const businessConfigs: Record<string, BusinessConfig> = {
    demo: {
      id: 'demo',
      name: 'Demo Restaurant',
      type: 'restaurant',
      currency: 'PKR',
      currencySymbol: 'Rs.',
      taxRates: {
        salesTax: 0.15,
        serviceFee: 0.05,
        deliveryFee: 0
      },
      features: {
        loyalty: true,
        delivery: true,
        takeaway: true,
        dineIn: true,
        reservations: false
      },
      apiEndpoints: {
        base: 'http://localhost:8000',
        categories: '/api/categories',
        orders: '/api/orders',
        loyalty: '/api/loyalty',
        customers: '/api/customers'
      }
    }
  };

  return businessConfigs[businessId] || businessConfigs.demo;
};

export default BusinessContext;
