/**
 * SettingsContent Component
 * 
 * PURPOSE: Main content component for the settings page that handles settings management,
 * navigation, and display. Separated from page wrapper for better organization
 * following the professional refactoring pattern.
 * 
 * LINKS WITH:
 * - SettingItem: Individual setting item component
 * - useSettingsStore: Settings state management
 * - useSession: Session management for logout
 * - generateSettingsData: Settings data generation utility
 * 
 * WHY: Follows the same pattern as other pages. Separates business logic
 * from page routing, making the code more maintainable and testable.
 */

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Save, RefreshCw, LogOut } from 'lucide-react';
import { useSettingsStore } from '@/lib/store/settings';
import { TileSize, AnimationLevel } from '@/lib/store/settings';
import { SettingSection } from '@/types/settings';
import { generateSettingsData } from '@/lib/utils/settings';
import { SettingItem } from './setting-item';
import { useAuthStore } from '@/lib/store/auth';
import { useTillStore } from '@/lib/store/till';
import { useBranchConfigStore } from '@/lib/store/branchConfig';
import { TillModal } from '@/components/till/TillModal';
import { ThemeToggle } from './theme-toggle';

export const SettingsContent = () => {
  const [settings, setSettings] = useState<SettingSection[]>([]);
  const [activeSection, setActiveSection] = useState<string>('general');
  const [isLoading, setIsLoading] = useState(true);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [expectedTillAmount, setExpectedTillAmount] = useState(0);
  const [pendingOrderCount, setPendingOrderCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  const headerRef = useRef<{ triggerFlash: (color: string) => void }>(null);
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);
  const tillStore = useTillStore();
  const currentSession = tillStore.currentSession;

  // Branch config store (read-only - for display only)
  const branchConfig = useBranchConfigStore(state => state.config);

  // Settings store
  const {
    tiles: tileSettings,
    animations: animationSettings,
    updateTileSize,
    updateDragMode,
    updateShowImages,
    updateHoldDuration,
    updateAnimationLevel,
    updateTouchFeedback,
    updateTransitions,
    updateAnimations,
    updateReduceMotion,
    updateHoverEffects,
    resetToDefaults
  } = useSettingsStore();

  useEffect(() => {
    // Only generate settings data if all required settings are available
    if (tileSettings && animationSettings) {
      setSettings(generateSettingsData(tileSettings, animationSettings, branchConfig));
      setIsLoading(false);
    }
  }, [tileSettings, animationSettings, branchConfig]);

  // Load active till session from IndexedDB
  useEffect(() => {
    if (user && user.posId) {
      tillStore.loadActiveTill(user.posId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.posId]); // Only depend on posId, not the entire tillStore object

  // Calculate expected till amount (opening + cash sales)
  useEffect(() => {
    const calculateExpectedAmount = async () => {
      if (currentSession && currentSession.status === 'open') {
        const expected = await tillStore.getExpectedTillAmount();
        setExpectedTillAmount(expected);
        console.log('💰 [SETTINGS] Expected till amount:', {
          openingAmount: currentSession.openingAmount,
          expectedTotal: expected,
          cashSales: expected - currentSession.openingAmount
        });
      }
    };

    calculateExpectedAmount();
  }, [currentSession, tillStore]);

  // Count pending paid orders that need syncing
  useEffect(() => {
    const countPendingOrders = async () => {
      const { useOrderOverlayStore } = await import('@/lib/store/order-overlay');
      const overlayStore = useOrderOverlayStore.getState();

      // Load all orders
      await overlayStore.loadAll?.();
      const allOrders = Object.values(overlayStore.overlays);

      // Count orders with: paymentStatus='paid' AND syncStatus='pending'
      const pendingPaidOrders = allOrders.filter(
        order => order.paymentStatus === 'paid' && order.syncStatus === 'pending'
      );

      setPendingOrderCount(pendingPaidOrders.length);
      console.log('📊 [SETTINGS] Pending paid orders to sync:', pendingPaidOrders.length);
    };

    countPendingOrders();

    // Refresh count every 5 seconds
    const interval = setInterval(countPendingOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSyncOrders = async () => {
    setIsSyncing(true);

    try {
      console.log('🔄 [SETTINGS] Starting manual order sync...');

      const { syncService } = await import('@/lib/services/syncService');
      const result = await syncService.syncPendingOrders();

      console.log('✅ [SETTINGS] Sync completed:', result);

      // Refresh pending count
      const { useOrderOverlayStore } = await import('@/lib/store/order-overlay');
      const overlayStore = useOrderOverlayStore.getState();
      await overlayStore.loadAll?.();
      const allOrders = Object.values(overlayStore.overlays);
      const stillPending = allOrders.filter(
        order => order.paymentStatus === 'paid' && order.syncStatus === 'pending'
      );
      setPendingOrderCount(stillPending.length);

      // Show success message
      if (result.success > 0) {
        alert(`✓ Successfully synced ${result.success} order(s)`);
      } else if (result.failed > 0) {
        alert(`⚠ Failed to sync ${result.failed} order(s). Please try again.`);
      } else {
        alert('ℹ No orders to sync');
      }

    } catch (error) {
      console.error('❌ [SETTINGS] Sync failed:', error);
      alert(`❌ Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSettingChange = async (
    sectionId: string,
    itemId: string,
    value: string | number | boolean
  ) => {
    // Update the specific setting based on section and item
    switch (sectionId) {
      case 'branch':
        // Branch config is READ ONLY - no updates allowed from cashier
        console.warn('⚠️ [SETTINGS] Branch config is read-only and cannot be modified from cashier');
        return;
      case 'appearance':
        switch (itemId) {
          case 'tileSize':
            updateTileSize(value as TileSize);
            break;
          case 'dragMode':
            updateDragMode(value ? 'enabled' : 'disabled');
            break;
          case 'showImages':
            updateShowImages(value as boolean);
            break;
          case 'holdDuration':
            updateHoldDuration(value as number);
            break;
          case 'animationLevel':
            updateAnimationLevel(value as AnimationLevel);
            break;
          case 'touchFeedback':
            updateTouchFeedback(value as boolean);
            break;
          case 'transitions':
            updateTransitions(value as boolean);
            break;
          case 'animations':
            updateAnimations(value as boolean);
            break;
          case 'reduceMotion':
            updateReduceMotion(value as boolean);
            break;
          case 'hoverEffects':
            updateHoverEffects(value as boolean);
            break;
        }
        break;
    }
  };

  const handleExportData = () => {
    // Export settings data
    const dataToExport = {
      tiles: tileSettings,
      animations: animationSettings,
      timestamp: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
      type: 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pos-settings-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleLogout = async () => {
    // Button is disabled if there are pending orders, so this should never be called with pending orders
    // But keep the check as safety measure
    if (pendingOrderCount > 0) {
      console.warn('⚠️ [SETTINGS] Logout blocked - pending orders exist');
      return;
    }

    // Reload till session to ensure we have latest data
    if (user && user.posId) {
      await tillStore.loadActiveTill(user.posId);
    }

    const latestSession = tillStore.currentSession;

    // If till is open, show close modal
    if (latestSession && latestSession.status === 'open') {
      console.log('🏦 [SETTINGS] Current till session:', {
        id: latestSession.id,
        openingAmount: latestSession.openingAmount,
        openedAt: latestSession.openedAt
      });

      // Recalculate expected amount from synced paid orders
      const expected = await tillStore.getExpectedTillAmount();
      setExpectedTillAmount(expected);
      console.log('💰 [SETTINGS] Expected till amount for close:', expected);
      setShowCloseModal(true);
    } else {
      // No open till, logout directly
      console.log('ℹ️ [SETTINGS] No active till, logging out directly');
      performLogout();
    }
  };

  const performLogout = async () => {
    // Just logout - SPA architecture will handle showing login automatically
    // No need to navigate, app.tsx will detect no auth and show LoginPage
    await logout();
    console.log('✅ [SETTINGS] Logout complete - SPA will reset to login state');
  };

  const handleTillCloseSuccess = async () => {
    console.log('✅ [SETTINGS] Till closed successfully via TillModal');
    console.log('🏦 [SETTINGS] ===== CLOSE TILL PROCESS END =====');
    console.log('⏳ [SETTINGS] WAITING 2 SECONDS BEFORE LOGOUT (to allow log inspection)...');

    // Close modal
    setShowCloseModal(false);

    // ⚠️ IMPORTANT: Wait 2 seconds before logout to allow console logs to be visible
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('🚪 [SETTINGS] Now performing logout...');

    // Perform logout (will redirect to login)
    await performLogout();
  };



  // Ref for the navigation container
  const navRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ top: 0, height: 0 });

  // Update indicator position when active section changes
  useEffect(() => {
    if (navRef.current) {
      const activeElement = navRef.current.querySelector(`[data-section="${activeSection}"]`) as HTMLElement;
      if (activeElement) {
        setIndicatorStyle({
          top: activeElement.offsetTop,
          height: activeElement.offsetHeight
        });
      }
    }
  }, [activeSection, settings]);

  if (isLoading) {
    return (
      <div className="h-full w-full bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-background flex flex-col overflow-hidden scrollbar-hide">
      {/* Main Content - Scrollable without scrollbar */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-5 py-6 scrollbar-hide">
        <div className="w-full space-y-6">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
              <p className="text-text-secondary">Configure your POS system preferences</p>
            </div>
            <div className="flex gap-2">
              <ThemeToggle />
              <Button
                variant="line"
                size="sm"
                onClick={resetToDefaults}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset
              </Button>
              <Button
                className="bg-primary hover:bg-primary/90"
                onClick={() => {
                  // Save settings (they're already saved in the store)
                  if (headerRef.current) {
                    headerRef.current.triggerFlash('green');
                  }
                }}
              >
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
              {currentSession?.status === 'open' && (
                <Button
                  variant="line"
                  size="sm"
                  onClick={handleSyncOrders}
                  disabled={isSyncing || pendingOrderCount === 0}
                  className={`${pendingOrderCount > 0
                    ? 'bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200'
                    : 'bg-gray-50 text-gray-400 border-gray-200'
                    }`}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing ? 'Syncing...' : `Sync Orders${pendingOrderCount > 0 ? ` (${pendingOrderCount})` : ''}`}
                </Button>
              )}
              <Button
                variant="line"
                size="sm"
                onClick={handleLogout}
                disabled={pendingOrderCount > 0}
                className={`${pendingOrderCount > 0
                  ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
                  : 'bg-red-50 hover:bg-red-100 text-red-600 border-red-200'
                  }`}
              >
                <LogOut className="w-4 h-4 mr-2" />
                {currentSession?.status === 'open' ? 'Close Till & Logout' : 'Logout'}
              </Button>
            </div>
          </div>

          {/* Settings Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar Navigation - Custom Design */}
            <div className="lg:col-span-1">
              <div
                ref={navRef}
                className="bg-white dark:bg-[#1C1C1E] rounded-xl relative overflow-hidden text-neutral-900 dark:text-neutral-200 shadow-sm border border-gray-100 dark:border-0"
              >
                {/* Sliding Slab Indicator */}
                <div
                  className="absolute right-0 w-1 bg-black dark:bg-white rounded-l-md transition-all duration-300 ease-[cubic-bezier(0,0,0,0)]"
                  style={{
                    top: `${indicatorStyle.top + 20}px`, // Add some offset for padding
                    height: `${indicatorStyle.height - 40}px` // Subtract padding
                  }}
                />

                <nav className="space-y-1 relative z-10">
                  {settings.map((section) => (
                    <button
                      key={section.id}
                      data-section={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full text-left px-4 py-4 rounded-xl transition-all duration-300 flex items-center gap-4 group ${activeSection === section.id
                        ? 'bg-black/5 dark:bg-white/5'
                        : 'hover:bg-black/5 dark:hover:bg-white/5'
                        }`}
                    >
                      <div className={`p-2 rounded-full transition-colors ${activeSection === section.id ? 'text-black dark:text-white' : 'text-neutral-500 group-hover:text-neutral-700 dark:group-hover:text-neutral-300'
                        }`}>
                        {section.icon && <section.icon size={20} strokeWidth={1.5} />}
                      </div>
                      <div className="flex flex-col">
                        <span className={`text-base font-medium transition-colors ${activeSection === section.id ? 'text-black dark:text-white' : 'text-neutral-600 group-hover:text-neutral-900 dark:text-neutral-400 dark:group-hover:text-white'
                          }`}>
                          {section.title}
                        </span>
                        {section.description && (
                          <span className="text-xs text-neutral-400 dark:text-neutral-500 font-normal line-clamp-1">
                            {section.description}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Settings Content */}
            <div className="lg:col-span-3">
              {settings.map((section) => (
                <Card key={section.id} className={activeSection === section.id ? 'block border-0 shadow-sm' : 'hidden'}>
                  <CardHeader>
                    <CardTitle className="text-2xl">{section.title}</CardTitle>
                    {section.description && (
                      <p className="text-text-secondary">{section.description}</p>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {section.items.map((item) => (
                      <SettingItem
                        key={item.id}
                        item={item}
                        sectionId={section.id}
                        handleSettingChange={handleSettingChange}
                        handleExportData={handleExportData}
                        showPassword={false}
                      />
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Till Close Modal - Premium Design */}
      <TillModal
        isOpen={showCloseModal}
        onClose={() => {
          // Allow closing the modal (user can cancel logout)
          setShowCloseModal(false);
        }}
        onSuccess={handleTillCloseSuccess}
        mode="close"
        systemAmount={expectedTillAmount}
      />
    </div>
  );
};
