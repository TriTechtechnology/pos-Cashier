/**
 * ROOT PAGE - SINGLE-PAGE ARCHITECTURE (SPA)
 *
 * PURPOSE: PWA-first architecture with instant navigation via state changes
 * - NO URL dependencies - navigation via Zustand store
 * - Instant page transitions - just state updates
 * - Offline-perfect - everything in memory
 * - Native app feel - like iOS apps, not websites
 *
 * WHY SPA FOR THIS POS:
 * 1. Offline-first: No router overhead, no URL parsing
 * 2. iPad PWA: No URL bar visible, URLs don't matter
 * 3. Hardware integration: State updates work with all devices
 * 4. Instant navigation: State change = instant render
 * 5. Simple debugging: No URL-related bugs, no searchParams issues
 *
 * ARCHITECTURE:
 * - Navigation store controls which page renders
 * - Two types of pages:
 *   1. Auth pages (login, splash, etc.) - NO header/footer
 *   2. App pages (home, menu, etc.) - WITH header/footer layout
 * - All existing functionality preserved - just different navigation mechanism
 */

"use client";

import { Suspense, useEffect, useState } from 'react';
import { Loading } from '@/components/loading';
import { useCurrentPage } from '@/lib/store/navigation';
import { useUnifiedSlotStore } from '@/lib/store/unified-slots';
import { useAuthStore } from '@/lib/store/auth';
import { getAuthToken } from '@/lib/api/auth';

// Lazy imports for code splitting (still get Next.js optimization benefits)
import { HomePageContent } from './(routes)/home/_components';
import { MenuPageContent } from './(routes)/menu/_components';
import { useSlotManagement } from './(routes)/home/_hooks';
import { LoginContent } from './(routes)/login/_components';
import { OrdersPageContent } from './(routes)/orders/_components/orders-page-content';
import { SettingsContent } from './(routes)/settings/_components';

// Layout components
import Header from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import LoyaltyCardModal from '@/components/pos/LoyaltyCardModal';
import QRScanner from '@/components/pos/QRScanner';
import { TillModal } from '@/components/till/TillModal';
import { useModalManagement } from '@/lib/hooks/useModalManagement';
import { useOrderOverlayStore } from '@/lib/store/order-overlay';
import { useTillStore } from '@/lib/store/till';

export default function POSApp() {
  const currentPage = useCurrentPage();
  const [mounted, setMounted] = useState(false);
  const user = useAuthStore(state => state.user);
  const token = useAuthStore(state => state.token);
  const logout = useAuthStore(state => state.logout);
  const refreshUser = useAuthStore(state => state.refreshUser);

  useEffect(() => {
    setMounted(true);

    // 🔒 SECURITY: Validate token on app initialization
    // If user exists in state but no valid token, force logout
    if (user && !getAuthToken()) {
      console.warn('⚠️ [AUTH GUARD] User exists but no valid token found - forcing logout');
      logout();
      return;
    }

    // 🔄 REFRESH: If user and token exist, refresh user data from ME API
    // This ensures we have latest branchConfig and user info
    if (user && getAuthToken()) {
      console.log('🔄 [APP INIT] Refreshing user data from ME API...');
      refreshUser();
    }
  }, []); // Run only once on mount

  // Show loading during hydration
  if (!mounted) {
    return <Loading />;
  }

  // 🔐 AUTH GUARD: Require BOTH user AND token for access
  // This prevents access even if user data exists in localStorage without a valid token
  const isAuthenticated = user && (token || getAuthToken());

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // 🏠 APP PAGES (with header/footer): Show main app with layout
  return <AppWithLayout currentPage={currentPage} />;
}

// App Layout with Header/Footer (for authenticated pages)
function AppWithLayout({ currentPage }: { currentPage: string }) {
  const user = useAuthStore(state => state.user);
  const tillStore = useTillStore();

  const [showTillModal, setShowTillModal] = useState(false);

  const {
    isQRScannerOpen,
    isLoyaltyModalOpen,
    currentLoyaltyCard,
    handleQRScanClose,
    handleQRScanSuccess,
    handleLoyaltyModalClose,
    handleRedeemReward,
    handleApplyToOrder,
  } = useModalManagement();

  // Load overlays on mount for draft detection
  useEffect(() => {
    // Load all overlays into memory immediately for draft detection
    const loadOverlays = async () => {
      console.log('🚀 [APP INIT] Loading overlays for draft detection...');
      await useOrderOverlayStore.getState().loadAll?.();
      console.log('✅ [APP INIT] Overlays loaded');
    };

    loadOverlays();
  }, []);

  // 🎯 TILL SESSION CHECK: Sync from backend on login, only show modal if no till exists
  // This prevents "already open" errors and maintains accuracy across reloads
  useEffect(() => {
    const checkTillSession = async () => {
      if (!user?.posId || !user?.branchId || !user?.id) return;

      console.log('🏦 [APP] Checking till session for user:', user.id);

      // Step 1: Try to load from IndexedDB first (instant)
      await tillStore.loadActiveTill(user.posId);
      const localSession = tillStore.currentSession;

      if (localSession && localSession.status === 'open') {
        console.log('✅ [APP] Found local till session:', localSession.id);
        return;
      }

      // Step 2: No local session - check backend for existing till
      console.log('🔍 [APP] No local till, checking backend...');
      const synced = await tillStore.syncTillFromBackend({
        posId: user.posId,
        branchId: user.branchId,
        id: user.id
      });

      if (synced) {
        console.log('✅ [APP] Synced existing till from backend');
        return;
      }

      // Step 3: No till anywhere - show till modal to open new session
      console.log('ℹ️ [APP] No active till found, showing clock-in modal');
      setShowTillModal(true);
    };

    checkTillSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]); // Only depend on user.id to detect user change

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header />
      <main className="flex-1 overflow-hidden pt-[5.5rem]">
        {/* Home Page */}
        {currentPage === 'home' && <HomePage />}

        {/* Menu Page */}
        {currentPage === 'menu' && <MenuPage />}

        {/* Orders Page */}
        {currentPage === 'orders' && (
          <Suspense fallback={<Loading />}>
            <OrdersPage />
          </Suspense>
        )}

        {/* Inventory Page */}
        {currentPage === 'inventory' && (
          <Suspense fallback={<Loading />}>
            <InventoryPage />
          </Suspense>
        )}

        {/* Settings Page */}
        {currentPage === 'settings' && (
          <Suspense fallback={<Loading />}>
            <SettingsPage />
          </Suspense>
        )}
      </main>
      <Footer />

      {/* QR Scanner Modal */}
      <QRScanner
        isOpen={isQRScannerOpen}
        onClose={handleQRScanClose}
        onScan={handleQRScanSuccess}
      />

      {/* Loyalty Card Modal */}
      <LoyaltyCardModal
        isOpen={isLoyaltyModalOpen}
        onClose={handleLoyaltyModalClose}
        loyaltyCard={currentLoyaltyCard}
        onRedeemReward={handleRedeemReward}
        onApplyToOrder={handleApplyToOrder}
      />

      {/* Till Clock-In Modal - Auto-shows when till is not open */}
      <TillModal
        isOpen={showTillModal}
        onClose={() => {
          // Don't allow closing until till is opened
          console.log('🚫 [APP] Clock-in modal close prevented - till must be opened first');
        }}
        onSuccess={() => {
          console.log('✅ [APP] Till opened successfully via modal');
          setShowTillModal(false);
        }}
        mode="open"
      />
    </div>
  );
}

// Login Page Component (no layout)
function LoginPage() {
  return <LoginContent />;
}

// Home Page Component (with existing loading logic)
function HomePage() {
  const { loading } = useSlotManagement();
  const [mounted, setMounted] = useState(false);
  const initialized = useUnifiedSlotStore(state => state.initialized);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Show loading until mounted AND initialized
  if (!mounted || loading || !initialized) {
    return <Loading />;
  }

  return <HomePageContent />;
}

// Menu Page Component (with existing suspense)
function MenuPage() {
  return (
    <Suspense fallback={<Loading />}>
      <MenuPageContent />
    </Suspense>
  );
}

// Orders Page Component (has OrdersPageContent component)
function OrdersPage() {
  return <OrdersPageContent />;
}

// Inventory Page Component (placeholder - in development)
function InventoryPage() {
  return (
    <div className="h-full w-full bg-background flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-text-primary mb-2">Inventory</h1>
        <p className="text-text-secondary">Page under development</p>
      </div>
    </div>
  );
}

// Settings Page Component (has SettingsContent component)
function SettingsPage() {
  return <SettingsContent />;
}
