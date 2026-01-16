/**
 * TILL MANAGEMENT STORE - Offline-First Till Session Management
 *
 * ARCHITECTURE:
 * - Stores till sessions in IndexedDB for offline capability
 * - Syncs with backend when online
 * - One active till per POS terminal
 * - Tracks cash counts and amounts
 *
 * TILL LIFECYCLE:
 * 1. Closed: No active till session
 * 2. Open: Active till with opening amount recorded
 * 3. Synced: Till operations synced to backend
 *
 * INTEGRATION:
 * - Clock In: Opens till with cash counting
 * - Clock Out/Logout: Closes till with cash reconciliation
 * - Auth Store: Tracks current POS terminal
 */

import { create } from 'zustand';
import Dexie, { Table } from 'dexie';
import type { TillSession, CashCounts, TillStatus } from '@/types/pos';

class TillDB extends Dexie {
  sessions!: Table<TillSession, string>;

  constructor() {
    super('TillDB');
    this.version(1).stores({
      sessions: 'id, posId, userId, status, syncStatus, openedAt'
    });
  }
}

// Initialize DB only on client-side
let db: TillDB | null = null;

const getDB = (): TillDB | null => {
  if (typeof window === 'undefined') return null;
  if (!db) {
    db = new TillDB();
  }
  return db;
};

// IndexedDB Operations
async function saveTillToDB(session: TillSession): Promise<void> {
  const database = getDB();
  if (!database) return;

  try {
    await database.sessions.put(session);
    console.log('✅ [TILL DB] Saved till session:', session.id);
  } catch (error) {
    console.error('❌ [TILL DB] Failed to save till session:', error);
  }
}

async function getActiveTillFromDB(posId: string): Promise<TillSession | null> {
  const database = getDB();
  if (!database) return null;

  try {
    const session = await database.sessions
      .where('posId')
      .equals(posId)
      .and(s => s.status === 'open')
      .first();
    return session || null;
  } catch (error) {
    console.error('❌ [TILL DB] Failed to get active till:', error);
    return null;
  }
}

async function closeTillInDB(sessionId: string, closeData: {
  declaredClosingAmount: number;
  systemClosingAmount: number;
  closingCashCounts?: CashCounts;
  closingNotes?: string;
}): Promise<void> {
  const database = getDB();
  if (!database) return;

  try {
    const session = await database.sessions.get(sessionId);
    if (session) {
      session.status = 'closed';
      session.declaredClosingAmount = closeData.declaredClosingAmount;
      session.systemClosingAmount = closeData.systemClosingAmount;
      session.closingCashCounts = closeData.closingCashCounts;
      session.closingNotes = closeData.closingNotes;
      session.closedAt = new Date();
      session.updatedAt = new Date();
      session.syncStatus = 'pending'; // Mark for sync

      await database.sessions.put(session);
      console.log('✅ [TILL DB] Closed till session:', sessionId);
    }
  } catch (error) {
    console.error('❌ [TILL DB] Failed to close till:', error);
  }
}

async function getPendingSyncSessions(): Promise<TillSession[]> {
  const database = getDB();
  if (!database) return [];

  try {
    return await database.sessions
      .where('syncStatus')
      .equals('pending')
      .toArray();
  } catch (error) {
    console.error('❌ [TILL DB] Failed to get pending sessions:', error);
    return [];
  }
}

// Zustand Store
interface TillStore {
  // Current active till session
  currentSession: TillSession | null;

  // Loading states
  isLoading: boolean;
  isOpening: boolean;
  isClosing: boolean;

  // Actions
  openTill: (params: {
    posId: string;
    branchId: string;
    userId: string;
    openingAmount: number;
    openingCashCounts?: CashCounts;
    openingNotes?: string;
    tillSessionId?: string; // Optional: Use backend tillSessionId if available
  }) => Promise<void>;

  closeTill: (params: {
    declaredClosingAmount: number;
    systemClosingAmount: number;
    closingCashCounts?: CashCounts;
    closingNotes?: string;
  }) => Promise<void>;

  loadActiveTill: (posId: string) => Promise<void>;

  syncTillFromBackend: (user: { posId: string; branchId: string; id: string }) => Promise<boolean>;

  getTillStatus: () => TillStatus;

  getExpectedTillAmount: () => Promise<number>;

  syncPendingSessions: () => Promise<void>;

  // Internal
  setCurrentSession: (session: TillSession | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useTillStore = create<TillStore>((set, get) => ({
  currentSession: null,
  isLoading: false,
  isOpening: false,
  isClosing: false,

  setCurrentSession: (session) => set({ currentSession: session }),
  setLoading: (loading) => set({ isLoading: loading }),

  getTillStatus: () => {
    const { currentSession } = get();
    return currentSession?.status === 'open' ? 'open' : 'closed';
  },

  getExpectedTillAmount: async () => {
    const { currentSession } = get();
    if (!currentSession || currentSession.status !== 'open') {
      console.warn('⚠️ [TILL] No active till session for amount calculation');
      return 0;
    }

    console.log('💰 [TILL] Calculating expected amount for session:', currentSession.id);

    // Import order overlay store dynamically to avoid circular deps
    const { useOrderOverlayStore } = await import('./order-overlay');
    const overlayStore = useOrderOverlayStore.getState();

    // Load all overlays into memory
    await overlayStore.loadAll?.();

    // Get overlays from state (it's a Record<string, OverlayOrder>, not an array)
    const overlaysMap = overlayStore.overlays;
    const allOverlays = Object.values(overlaysMap);

    console.log('📦 [TILL] Total overlays in memory:', allOverlays.length);

    // Only count SYNCED cash orders (not pending)
    // Pending orders will be synced by next cashier in their shift
    const cashOrders = allOverlays.filter(order => {
      const match = order.tillSessionId === currentSession.id &&
                    order.paymentStatus === 'paid' &&
                    order.paymentMethod === 'cash' &&
                    order.syncStatus === 'synced'; // ONLY synced orders

      if (order.paymentStatus === 'paid' && order.paymentMethod === 'cash') {
        console.log('💵 [TILL] Cash order:', {
          id: order.id,
          tillSessionId: order.tillSessionId,
          currentTillId: currentSession.id,
          syncStatus: order.syncStatus,
          matches: match,
          total: order.total || order.totalPrice
        });
      }

      return match;
    });

    console.log('💵 [TILL] Cash orders for this till:', cashOrders.length);

    // Sum up all cash order totals
    const totalCashSales = cashOrders.reduce((sum, order) => {
      const orderTotal = order.total || order.totalPrice || 0;
      return sum + orderTotal;
    }, 0);

    console.log('💰 [TILL] Calculation:', {
      openingAmount: currentSession.openingAmount,
      cashSales: totalCashSales,
      expectedTotal: currentSession.openingAmount + totalCashSales
    });

    // Expected till = opening amount + cash sales
    return currentSession.openingAmount + totalCashSales;
  },

  loadActiveTill: async (posId: string) => {
    set({ isLoading: true });
    try {
      const session = await getActiveTillFromDB(posId);
      set({ currentSession: session, isLoading: false });
      console.log('🏦 [TILL STORE] Loaded active till:', session?.id || 'none');
    } catch (error) {
      console.error('❌ [TILL STORE] Failed to load active till:', error);
      set({ isLoading: false });
    }
  },

  syncTillFromBackend: async (user) => {
    console.log('🔄 [TILL STORE] Syncing till from backend...');

    try {
      // Dynamic import to avoid circular dependencies
      const { getTillSession } = await import('../api/till');
      const result = await getTillSession();

      if (!result.success) {
        console.warn('⚠️ [TILL STORE] Failed to fetch till from backend:', result.error);
        return false;
      }

      if (!result.session) {
        console.log('ℹ️ [TILL STORE] No active till on backend');
        return false;
      }

      // Backend has an active till - sync it to IndexedDB
      const backendSession = result.session;

      console.log('✅ [TILL STORE] Found backend till session, syncing to IndexedDB...');

      const tillSession: TillSession = {
        id: backendSession.tillSessionId,
        posId: user.posId,
        branchId: user.branchId,
        userId: user.id,
        status: 'open',
        openingAmount: backendSession.openingAmount,
        openingCashCounts: backendSession.openingCashCounts,
        openingNotes: backendSession.openingNotes,
        openedAt: new Date(backendSession.openedAt),
        syncStatus: 'synced',
        createdAt: new Date(backendSession.openedAt),
        updatedAt: new Date()
      };

      await saveTillToDB(tillSession);
      set({ currentSession: tillSession });

      console.log('✅ [TILL STORE] Backend till synced to IndexedDB:', tillSession.id);
      return true;

    } catch (error) {
      console.error('❌ [TILL STORE] Error syncing from backend:', error);
      return false;
    }
  },

  openTill: async (params) => {
    set({ isOpening: true });
    try {
      // 🎯 Use backend tillSessionId if provided, otherwise generate local ID
      const tillSessionId = params.tillSessionId ||
                           `till-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const session: TillSession = {
        id: tillSessionId,
        posId: params.posId,
        branchId: params.branchId,
        userId: params.userId,
        status: 'open',
        openingAmount: params.openingAmount,
        openingCashCounts: params.openingCashCounts,
        openingNotes: params.openingNotes,
        openedAt: new Date(),
        // Mark as synced if we got ID from backend, pending otherwise
        syncStatus: params.tillSessionId ? 'synced' : 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await saveTillToDB(session);
      set({ currentSession: session, isOpening: false });
      console.log('✅ [TILL STORE] Opened till session:', session.id);
      console.log('🔑 [TILL STORE] Till ID source:', params.tillSessionId ? 'BACKEND (real)' : 'LOCAL (mock)');

      // TODO: Sync to backend when online (only if local ID)
      // if (!params.tillSessionId) get().syncPendingSessions();
    } catch (error) {
      console.error('❌ [TILL STORE] Failed to open till:', error);
      set({ isOpening: false });
      throw error;
    }
  },

  closeTill: async (params) => {
    const { currentSession } = get();
    if (!currentSession) {
      throw new Error('No active till session to close');
    }

    set({ isClosing: true });
    try {
      await closeTillInDB(currentSession.id, params);
      set({ currentSession: null, isClosing: false });
      console.log('✅ [TILL STORE] Closed till session:', currentSession.id);

      // TODO: Sync to backend when online
      // get().syncPendingSessions();
    } catch (error) {
      console.error('❌ [TILL STORE] Failed to close till:', error);
      set({ isClosing: false });
      throw error;
    }
  },

  syncPendingSessions: async () => {
    try {
      const pendingSessions = await getPendingSyncSessions();
      console.log(`🔄 [TILL STORE] Found ${pendingSessions.length} pending till sessions to sync`);

      // TODO: Implement backend sync
      // for (const session of pendingSessions) {
      //   await syncTillToBackend(session);
      // }
    } catch (error) {
      console.error('❌ [TILL STORE] Failed to sync pending sessions:', error);
    }
  }
}));
