'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { ManagerPinModal } from '@/components/pos/ManagerPinModal';

interface ManagerPinContextType {
  requestManagerAuth: (onSuccess: () => void) => void;
}

const ManagerPinContext = createContext<ManagerPinContextType | undefined>(undefined);

export const useManagerPin = () => {
  const context = useContext(ManagerPinContext);
  if (!context) {
    throw new Error('useManagerPin must be used within a ManagerPinProvider');
  }
  return context;
};

interface ManagerPinProviderProps {
  children: React.ReactNode;
}

export const ManagerPinProvider: React.FC<ManagerPinProviderProps> = ({ children }) => {
  const [showModal, setShowModal] = useState(false);
  const [pinValue, setPinValue] = useState('');
  const [pinError, setPinError] = useState('');
  const [onSuccessCallback, setOnSuccessCallback] = useState<(() => void) | null>(null);

  const requestManagerAuth = useCallback((onSuccess: () => void) => {
    setOnSuccessCallback(() => onSuccess);
    setShowModal(true);
    setPinValue('');
    setPinError('');
  }, []);

  const handlePinInput = (digit: string) => {
    if (pinValue.length < 4) {
      setPinValue(prev => prev + digit);
      setPinError('');
    }
  };

  const handlePinClear = () => {
    setPinValue('');
    setPinError('');
  };

  const handlePinBackspace = () => {
    setPinValue(prev => prev.slice(0, -1));
    setPinError('');
  };

  const handlePinSubmit = () => {
    // Simple PIN verification (in production, this would be more secure)
    const MANAGER_PIN = '1234'; // In production, this would come from settings/server

    if (pinValue === MANAGER_PIN) {
      console.log('✅ [MANAGER PIN] Authentication successful');
      setPinError('');
      setPinValue('');
      setShowModal(false);
      if (onSuccessCallback) {
        onSuccessCallback();
        setOnSuccessCallback(null);
      }
    } else {
      console.log('❌ [MANAGER PIN] Authentication failed');
      setPinError('Invalid PIN. Please try again.');
      setPinValue('');
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setPinValue('');
    setPinError('');
    setOnSuccessCallback(null);
  };

  return (
    <ManagerPinContext.Provider value={{ requestManagerAuth }}>
      {children}
      <ManagerPinModal
        isOpen={showModal}
        onClose={handleModalClose}
        pinValue={pinValue}
        pinError={pinError}
        onPinInput={handlePinInput}
        onPinClear={handlePinClear}
        onPinBackspace={handlePinBackspace}
        onPinSubmit={handlePinSubmit}
      />
    </ManagerPinContext.Provider>
  );
};