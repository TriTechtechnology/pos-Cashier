"use client";

import { useState, useCallback } from 'react';
import { QRCodeData, LoyaltyCard, LoyaltyReward } from '@/types/pos';

export const useModalManagement = () => {
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [isLoyaltyModalOpen, setIsLoyaltyModalOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [currentLoyaltyCard, setCurrentLoyaltyCard] = useState<LoyaltyCard | null>(null);

  // QR Scanner handlers
  const handleQRScan = useCallback(() => {
    setIsQRScannerOpen(true);
  }, []);

  const handleQRScanClose = useCallback(() => {
    setIsQRScannerOpen(false);
  }, []);

  const handleQRScanSuccess = useCallback((qrData: QRCodeData) => {
    if (qrData.type === 'loyalty') {
      const loyaltyCard = qrData.data as LoyaltyCard;
      setCurrentLoyaltyCard(loyaltyCard);
      setIsLoyaltyModalOpen(true);
      
      // Example: Show available rewards
      const availableRewards = loyaltyCard.rewards.filter(reward => !reward.isRedeemed);
      console.log('Available rewards:', availableRewards);
      
    } else if (qrData.type === 'order') {
      const order = qrData.data;
      
      // TODO: Load previous order
      console.log('Previous order loaded:', order);
    }
  }, []);

  // Loyalty Modal handlers
  const handleLoyaltyModalClose = useCallback(() => {
    setIsLoyaltyModalOpen(false);
    setCurrentLoyaltyCard(null);
  }, []);

  const handleRedeemReward = useCallback((reward: LoyaltyReward) => {
    // TODO: Implement reward redemption logic
    console.log('Redeeming reward:', reward);
  }, []);

  const handleApplyToOrder = useCallback(() => {
    // TODO: Apply loyalty benefits to current order
    console.log('Applying loyalty benefits to order');
  }, []);

  // Notification handlers
  const handleNotificationClick = useCallback(() => {
    setIsNotificationOpen(!isNotificationOpen);
    // TODO: Open notification overlay
    console.log('Notification clicked');
  }, [isNotificationOpen]);

  return {
    // QR Scanner state
    isQRScannerOpen,
    handleQRScan,
    handleQRScanClose,
    handleQRScanSuccess,
    
    // Loyalty Modal state
    isLoyaltyModalOpen,
    currentLoyaltyCard,
    handleLoyaltyModalClose,
    handleRedeemReward,
    handleApplyToOrder,
    
    // Notification state
    isNotificationOpen,
    handleNotificationClick
  };
};