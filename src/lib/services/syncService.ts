/**
 * PRODUCTION SYNC SERVICE - OFFLINE-FIRST ARCHITECTURE
 *
 * This service handles syncing order overlays with your backend
 * when the app comes back online. Features:
 * - Reactive sync status via Zustand store
 * - Automatic online/offline detection
 * - Background sync every 30 seconds when online
 * - Retry failed syncs with exponential backoff
 */

import { create } from 'zustand';
import { useOrderOverlayStore } from '@/lib/store/order-overlay';
import { getCurrentDeviceId } from '@/lib/utils/posUtils';
import { logger } from '@/lib/utils/logger';

interface SyncConfig {
  apiBaseUrl: string;
  maxRetries: number;
  retryDelay: number; // milliseconds
  authTokenKey?: string; // localStorage key for auth token
}

// Sync status store for reactive UI updates
interface SyncStatusStore {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  syncingCount: number;
  failedCount: number;
  lastSyncTime: Date | null;

  setOnline: (online: boolean) => void;
  setSyncing: (syncing: boolean) => void;
  updateCounts: (pending: number, syncing: number, failed: number) => void;
  setLastSyncTime: (time: Date) => void;
}

// Create reactive sync status store
export const useSyncStatusStore = create<SyncStatusStore>((set) => ({
  isOnline: typeof window !== 'undefined' ? navigator.onLine : true,
  isSyncing: false,
  pendingCount: 0,
  syncingCount: 0,
  failedCount: 0,
  lastSyncTime: null,

  setOnline: (online) => set({ isOnline: online }),
  setSyncing: (syncing) => set({ isSyncing: syncing }),
  updateCounts: (pending, syncing, failed) =>
    set({ pendingCount: pending, syncingCount: syncing, failedCount: failed }),
  setLastSyncTime: (time) => set({ lastSyncTime: time })
}));

class POSSyncService {
  private config: SyncConfig;
  private syncInProgress = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private onlineListener: (() => void) | null = null;
  private offlineListener: (() => void) | null = null;

  constructor(config: SyncConfig) {
    this.config = config;
  }

  /**
   * Main sync function - call this when app comes online
   * Syncs all pending orders with your backend
   */
  async syncPendingOrders(): Promise<{ success: number; failed: number }> {
    if (this.syncInProgress) {
      console.log('🔄 [SYNC] Sync already in progress, skipping');
      return { success: 0, failed: 0 };
    }

    this.syncInProgress = true;
    const syncStatus = useSyncStatusStore.getState();
    syncStatus.setSyncing(true);

    console.log('🚀 [SYNC] Starting sync of pending orders...');

    try {
      const overlayStore = useOrderOverlayStore.getState();
      const pendingOrders = await overlayStore.getPendingSyncOrders();

      if (pendingOrders.length === 0) {
        console.log('✅ [SYNC] No pending orders to sync');
        syncStatus.setSyncing(false);
        return { success: 0, failed: 0 };
      }

      console.log(`📤 [SYNC] Found ${pendingOrders.length} orders to sync`);

      let successCount = 0;
      let failedCount = 0;

      // Sync orders one by one to prevent overwhelming the backend
      for (const order of pendingOrders) {
        try {
          const success = await this.syncSingleOrder(order);
          if (success) {
            await overlayStore.markOrderSynced(order.id);
            successCount++;
          } else {
            const attempts = (order.syncAttempts || 0) + 1;
            await overlayStore.markOrderSyncFailed(order.id, attempts);
            failedCount++;
          }
        } catch (error) {
          console.error(`❌ [SYNC] Error syncing order ${order.id}:`, error);
          const attempts = (order.syncAttempts || 0) + 1;
          await overlayStore.markOrderSyncFailed(order.id, attempts);
          failedCount++;
        }

        // Small delay between requests to be nice to your backend
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log(`✅ [SYNC] Sync complete: ${successCount} success, ${failedCount} failed`);
      syncStatus.setLastSyncTime(new Date());
      await this.updateSyncCounts();

      return { success: successCount, failed: failedCount };

    } finally {
      this.syncInProgress = false;
      syncStatus.setSyncing(false);
    }
  }

  /**
   * Update sync counts in status store
   * Call this whenever orders are created/paid to keep UI in sync
   */
  async updateSyncCounts(): Promise<void> {
    const overlayStore = useOrderOverlayStore.getState();
    const pending = await overlayStore.getPendingSyncOrders();

    const pendingCount = pending.filter(o => o.syncStatus === 'pending').length;
    const syncingCount = pending.filter(o => o.syncStatus === 'syncing').length;
    const failedCount = pending.filter(o => o.syncStatus === 'failed').length;

    useSyncStatusStore.getState().updateCounts(pendingCount, syncingCount, failedCount);
  }

  /**
   * Get authentication token from localStorage
   */
  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;

    try {
      const tokenKey = this.config.authTokenKey || 'pos-auth-token';
      return localStorage.getItem(tokenKey);
    } catch (error) {
      logger.error('Failed to get auth token', error);
      return null;
    }
  }

  /**
   * Exponential backoff delay for retries
   */
  private async exponentialBackoff(attempt: number): Promise<void> {
    const delay = Math.min(1000 * Math.pow(2, attempt), 30000); // Max 30 seconds
    logger.debug(`Retrying after ${delay}ms (attempt ${attempt})`);
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Sync a single order with your backend
   * Includes retry logic, authentication, and conflict resolution
   */
  private async syncSingleOrder(order: any): Promise<boolean> {
    // Check if backend URL is configured
    if (!this.config.apiBaseUrl || this.config.apiBaseUrl.includes('your-backend.com')) {
      // MOCK MODE - No backend configured yet
      logger.debug(`Simulating sync for order ${order.id} (no backend configured)`);
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      return true; // Pretend it synced successfully
    }

    // REAL MODE - Actual backend API call with retry logic
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        logger.debug(`Syncing order ${order.id} (attempt ${attempt}/${this.config.maxRetries})`);

        const authToken = this.getAuthToken();
        const deviceId = getCurrentDeviceId();

        // 🔄 Use Next.js API proxy to avoid CORS issues
        // Frontend calls /api/pos/orders → Proxy forwards to backend /t/pos/orders
        const response = await fetch('/api/pos/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-tenant-id': process.env.NEXT_PUBLIC_TENANT_ID || 'extraction-testing',
            ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
            'X-Device-ID': deviceId,
            'X-App-Version': '1.0.0',
            'X-Timestamp': new Date().toISOString()
          },
          body: JSON.stringify({
            // 🎯 Backend API format (matches Postman collection)
            // branchId comes from order (stored from login response)
            branchId: order.branchId,
            posId: order.posId,
            tillSessionId: order.tillSessionId,
            customerName: order.customer?.name || 'Walk-in',
            notes: order.specialInstructions || order.customer?.specialInstructions,
            items: order.items?.map((item: any) => ({
              menuItemId: item.id,
              quantity: item.quantity,
              notes: [
                item.modifiers?.specialInstructions,
                item.modifiers?.notes,
                item.modifiers?.variations?.map((v: any) => v.name).join(', '),
                item.modifiers?.addOns?.map((a: any) => a.name).join(', ')
              ].filter(Boolean).join(' | ') || undefined
            })) || []
          })
        });

        // Success
        if (response.ok) {
          logger.info(`Successfully synced order ${order.id}`);
          return true;
        }

        // Handle conflict (409 Conflict)
        if (response.status === 409) {
          logger.warn(`Conflict detected for order ${order.id}`);
          try {
            const serverData = await response.json();
            const resolved = await this.resolveConflict(order, serverData);
            if (resolved) {
              logger.info(`Conflict resolved for order ${order.id}`);
              return true;
            }
          } catch (conflictError) {
            logger.error('Failed to resolve conflict', conflictError);
          }
          // If conflict resolution failed, treat as failure
          return false;
        }

        // Handle authentication errors (401/403)
        if (response.status === 401 || response.status === 403) {
          logger.error(`Authentication failed for order ${order.id}: ${response.status}`);
          // Don't retry auth errors
          return false;
        }

        // Handle client errors (4xx) - don't retry
        if (response.status >= 400 && response.status < 500) {
          logger.error(`Client error syncing order ${order.id}: ${response.status}`);
          const errorText = await response.text().catch(() => 'Unknown error');
          logger.error('Error details:', errorText);
          return false;
        }

        // Handle server errors (5xx) - retry
        if (response.status >= 500) {
          logger.warn(`Server error syncing order ${order.id}: ${response.status}`);

          if (attempt < this.config.maxRetries) {
            await this.exponentialBackoff(attempt);
            continue; // Retry
          }

          logger.error(`Max retries reached for order ${order.id}`);
          return false;
        }

        // Unexpected status code
        logger.error(`Unexpected status ${response.status} for order ${order.id}`);
        return false;

      } catch (error) {
        // Network error or fetch exception
        logger.error(`Network error syncing order ${order.id} (attempt ${attempt})`, error);

        if (attempt < this.config.maxRetries) {
          await this.exponentialBackoff(attempt);
          continue; // Retry
        }

        logger.error(`Max retries reached for order ${order.id} after network errors`);
        return false;
      }
    }

    return false;
  }

  /**
   * Resolve conflicts when server has different data
   * Strategy: Last-write-wins based on updatedAt timestamp
   */
  private async resolveConflict(localOrder: any, serverData: any): Promise<boolean> {
    try {
      logger.warn('Resolving order conflict', {
        localOrderId: localOrder.id,
        serverOrderId: serverData.orderId
      });

      // If server order is newer, accept it (server wins)
      const localTime = new Date(localOrder.updatedAt).getTime();
      const serverTime = new Date(serverData.updatedAt).getTime();

      if (serverTime > localTime) {
        logger.info('Server version is newer - accepting server data');
        // Update local order with server data
        const overlayStore = useOrderOverlayStore.getState();
        await overlayStore.updateOverlay(localOrder.id, {
          ...serverData,
          syncStatus: 'synced'
        });
        return true;
      }

      // If local order is newer, try to force update server
      logger.info('Local version is newer - attempting force update');
      const deviceId = getCurrentDeviceId();
      const authToken = this.getAuthToken();

      // 🔄 Use Next.js API proxy to avoid CORS issues
      // Note: This is a conflict resolution endpoint - may not be implemented yet
      const response = await fetch(`/api/pos/orders/${localOrder.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': process.env.NEXT_PUBLIC_TENANT_ID || 'extraction-testing',
          ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
          'X-Device-ID': deviceId,
          'X-Force-Update': 'true' // Signal to backend this is intentional
        },
        body: JSON.stringify(localOrder)
      });

      if (response.ok) {
        logger.info('Successfully forced update on server');
        return true;
      }

      logger.error('Failed to resolve conflict - manual intervention may be needed');
      return false;

    } catch (error) {
      logger.error('Error resolving conflict', error);
      return false;
    }
  }

  /**
   * Daily cleanup - removes old synced orders
   * Call this at app startup or daily
   */
  async performDailyCleanup(): Promise<void> {
    try {
      const overlayStore = useOrderOverlayStore.getState();

      // Remove orders older than 7 days (adjust as needed)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const cleanupDate = sevenDaysAgo.toISOString().split('T')[0];

      await overlayStore.clearOldOrders(cleanupDate);
      console.log(`🗑️ [CLEANUP] Daily cleanup completed, removed orders older than ${cleanupDate}`);
    } catch (error) {
      console.error('❌ [CLEANUP] Error during daily cleanup:', error);
    }
  }

  /**
   * Check if device is online
   */
  isOnline(): boolean {
    return navigator.onLine;
  }

  /**
   * Start automatic sync when device comes online
   */
  startAutoSync(): void {
    // Prevent multiple instances
    if (this.syncInterval) {
      console.warn('⚠️ [SYNC] Auto-sync already running');
      return;
    }

    // Listen to online events
    this.onlineListener = () => {
      console.log('🌐 [SYNC] Device came online, starting sync...');
      useSyncStatusStore.getState().setOnline(true);
      this.syncPendingOrders();
    };
    window.addEventListener('online', this.onlineListener);

    // Listen to offline events
    this.offlineListener = () => {
      console.log('📡 [SYNC] Device went offline');
      useSyncStatusStore.getState().setOnline(false);
    };
    window.addEventListener('offline', this.offlineListener);

    // Periodic sync every 30 seconds when online
    this.syncInterval = setInterval(() => {
      if (this.isOnline() && !this.syncInProgress) {
        this.syncPendingOrders();
      }
    }, 30000);

    // Initial counts update
    this.updateSyncCounts();

    // Also sync immediately if already online
    if (this.isOnline()) {
      setTimeout(() => this.syncPendingOrders(), 1000);
    }

    console.log('✅ [SYNC] Auto-sync started');
  }

  /**
   * Stop automatic sync (for cleanup)
   * CRITICAL: Call this when app unmounts to prevent memory leaks
   */
  stopAutoSync(): void {
    // Clear interval
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    // Remove event listeners
    if (this.onlineListener) {
      window.removeEventListener('online', this.onlineListener);
      this.onlineListener = null;
    }

    if (this.offlineListener) {
      window.removeEventListener('offline', this.offlineListener);
      this.offlineListener = null;
    }

    console.log('✅ [SYNC] Auto-sync stopped');
  }
}

// Create singleton instance for your app
export const syncService = new POSSyncService({
  apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.tritechtechnologyllc.com',
  maxRetries: 3,
  retryDelay: 5000,
  authTokenKey: 'auth-token' // Match auth.ts - localStorage key for JWT token
});

// Export for use in components
export default syncService;