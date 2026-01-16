'use client';

import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MenuBubble from './MenuBubble';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { useSyncStatusStore } from '@/lib/services/syncService';
import { useAuthStore } from '@/lib/store/auth';
import { useBranchConfigStore } from '@/lib/store/branchConfig';

export interface HeaderProps {
  triggerFlash?: (color: string) => void;
  isCartOpen?: boolean;
}

const Header = React.forwardRef<{ triggerFlash: (color: string) => void }, HeaderProps>(({ 
  isCartOpen = false
}, ref) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [flashColor, setFlashColor] = useState<string | undefined>(undefined);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  // Sync status for logo button border animation
  const { isOnline, isSyncing, pendingCount } = useSyncStatusStore();
  const user = useAuthStore(state => state.user);
  const branchConfig = useBranchConfigStore(state => state.config);

  // Get branch name from multiple sources (with priority fallback)
  // Priority: 1. user.branchName, 2. branchConfig.branchName, 3. fallback
  const branchName = user?.branchName || branchConfig?.branchName || "Restaurant Name";
  const cashierName = user?.name || "Cashier";

  // Debug logging
  useEffect(() => {
    console.log('🏢 [HEADER] Branch name sources:', {
      userBranchName: user?.branchName,
      branchConfigName: branchConfig?.branchName,
      finalBranchName: branchName,
      userName: user?.name,
    });
  }, [user?.branchName, branchConfig?.branchName, branchName, user?.name]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };


  const handleNotificationClick = () => {
    setIsNotificationOpen(!isNotificationOpen);
    console.log("Notification clicked");
  };

  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleMenuClose = () => {
    setIsMenuOpen(false);
  };

  const handleFlash = () => {
    setFlashColor(undefined);
  };

  const triggerFlash = (color: string) => {
    setFlashColor(color);
  };

  // Expose triggerFlash through ref
  React.useImperativeHandle(ref, () => ({
    triggerFlash
  }));

  return (
    <header 
      className={`fixed top-0 w-full px-5 py-2 flex items-center justify-between bg-background transition-all duration-300 z-30`}
    >
      {/* Left Section - Title and Date */}
      <div className="flex flex-col">
        <h1 className="text-2xl font-semibold text-text-primary leading-tight">
          {branchName} • {cashierName}
        </h1>
        <div className="flex items-center">
          <p className="text-base text-text-secondary">
            {formatTime(currentTime)} {formatDate(currentTime)}
          </p>
        </div>
      </div>

      {/* Right Section - Menu Bubble and Notifications */}
      <div className="flex items-center space-x-3">
        {/* Notifications Button */}
        <Button
          variant="icon-line"
          size="notification"
          onClick={handleNotificationClick}
          className="!w-6 !h-6 !p-0 hover:bg-transparent bg-secondary"
        >
          <Bell className="w-3 h-3 text-text-primary hover:text-text-primary transition-colors" />
        </Button>

        {/* Menu Bubble */}
        <div className="relative">
          <Button
            variant="icon"
            size="icon"
            onClick={handleMenuToggle}
            className={`w-[70px] h-[70px] bg-secondary rounded-full hover:bg-button-hover transition-all duration-200 ${
              // Sync status border animation - matches MenuBubble priority
              // Priority: Syncing > Offline > Pending Orders > All Synced
              isSyncing
                ? 'ring-4 ring-blue-500 animate-pulse'
                : !isOnline
                  ? 'ring-4 ring-red-500 animate-pulse'
                  : pendingCount > 0
                    ? 'ring-4 ring-blue-400'
                    : 'ring-4 ring-green-500'
            }`}
            style={{
              boxShadow: isSyncing
                ? '0 0 15px rgba(59, 130, 246, 0.5)' // Blue glow (syncing)
                : !isOnline
                  ? '0 0 15px rgba(239, 68, 68, 0.5)' // Red glow (offline)
                  : pendingCount > 0
                    ? '0 0 15px rgba(96, 165, 250, 0.5)' // Blue glow (pending orders)
                    : '0 0 10px rgba(34, 197, 94, 0.3)', // Green glow (all synced)
            }}
            aria-label="Menu"
          >
            <OptimizedImage
              src="/Logo/d1ab35.svg"
              alt="Logo"
              className="w-8 h-8"
              width={32}
              height={32}
            />
          </Button>

          {/* Menu Bubble */}
          <MenuBubble 
            isOpen={isMenuOpen}
            onClose={handleMenuClose}
            flashColor={flashColor}
            onFlash={handleFlash}
            isCartOpen={isCartOpen}
          />
        </div>
      </div>
    </header>
  );
});

Header.displayName = 'Header';
export default Header;
