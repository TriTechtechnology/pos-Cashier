import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { loginWithPin, loginWithPinMock, logout as apiLogout, setAuthToken, getCurrentUser } from '@/lib/api/auth';
import { useBranchConfigStore } from '@/lib/store/branchConfig';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'cashier' | 'manager' | 'waiter' | 'admin';
  permissions: string[];
  branchId?: string; // Optional: provided by backend for till management
  branchName?: string; // Optional: provided by backend from branchConfig
  tenantId?: string; // Optional: provided by backend for tenant context
  posId?: string; // Optional: provided by backend for terminal identification
}

export interface AuthStore {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  token: string | null;

  // Actions
  login: (credentials: { email: string; password: string }) => Promise<void>;
  loginWithPin: (employeeId: string, pin: string, role: 'cashier' | 'manager' | 'waiter') => Promise<void>;
  refreshUser: () => Promise<void>; // Fetch fresh user data from ME API
  logout: () => void;
  clearError: () => void;
  setUser: (user: User) => void;
  updateUser: (updates: Partial<User>) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      token: null,

      // Actions
      login: async (credentials) => {
        set({ isLoading: true, error: null });

        try {
          // TODO: Replace with actual API call
          const mockUser: User = {
            id: '1',
            name: 'John Doe',
            email: credentials.email,
            role: 'cashier',
            permissions: ['pos.access', 'orders.create', 'orders.view']
          };

          set({
            user: mockUser,
            isAuthenticated: true,
            isLoading: false
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Login failed',
            isLoading: false
          });
        }
      },

      loginWithPin: async (employeeId: string, pin: string, role: 'cashier' | 'manager' | 'waiter') => {
        set({ isLoading: true, error: null });

        try {
          // Check if mock mode is enabled (only for development)
          const enableMock = process.env.NEXT_PUBLIC_ENABLE_MOCK_DATA === 'true';

          console.log('🔐 [AUTH STORE] Starting PIN login...', { employeeId, role, enableMock });

          // ALWAYS use real API - mock only for development testing
          const response = enableMock
            ? await loginWithPinMock(employeeId, pin, role)
            : await loginWithPin(employeeId, pin, role);

          // STRICT VALIDATION: Must have success, user, AND token from API
          if (!response.success) {
            console.error('❌ [AUTH STORE] Login failed - API returned error:', response.error);
            set({
              error: response.error || response.message || 'Authentication failed',
              isLoading: false,
              user: null,
              token: null,
              isAuthenticated: false,
            });
            return;
          }

          if (!response.token || !response.user) {
            console.error('❌ [AUTH STORE] Login failed - Missing token or user data');
            set({
              error: 'Invalid API response - missing authentication data',
              isLoading: false,
              user: null,
              token: null,
              isAuthenticated: false,
            });
            return;
          }

          // Validate token format (basic check)
          if (response.token.length < 10) {
            console.error('❌ [AUTH STORE] Login failed - Invalid token format');
            set({
              error: 'Invalid authentication token received',
              isLoading: false,
              user: null,
              token: null,
              isAuthenticated: false,
            });
            return;
          }

          // ALL CHECKS PASSED - Store token and user
          setAuthToken(response.token);

          console.log('✅ [AUTH STORE] Login successful - Valid token received:', {
            userId: response.user.id,
            role: response.user.role,
            tokenLength: response.token.length,
            tokenPreview: response.token.substring(0, 30) + '...',
          });

          // Verify token was actually stored
          const storedToken = localStorage.getItem('auth-token');
          console.log('✅ [AUTH STORE] Token stored in localStorage:', !!storedToken);

          // Store partial branch config from login, then fetch complete config
          let branchName: string | undefined;
          if (response.branchConfig) {
            console.log('📦 [AUTH STORE] Partial branch config from login:', response.branchConfig);
            branchName = response.branchConfig.branchName;

            // Fetch COMPLETE config from dedicated endpoint (has timezone + orderPrefix)
            try {
              console.log('🔄 [AUTH STORE] Fetching complete branch config...');
              await useBranchConfigStore.getState().fetchConfig(
                response.user.branchId,
                response.user.tenantSlug
              );
              console.log('✅ [AUTH STORE] Complete branch config fetched successfully');
            } catch (configError) {
              console.error('⚠️ [AUTH STORE] Failed to fetch complete config, using partial:', configError);
              // Fallback: use partial config from login
              useBranchConfigStore.getState().setConfig(response.branchConfig);
            }
          }

          set({
            user: {
              ...response.user,
              branchName, // Include branch name in user object from branchConfig
            },
            token: response.token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          console.error('❌ [AUTH STORE] Login error:', error);
          set({
            error: error instanceof Error ? error.message : 'Login failed',
            isLoading: false,
            user: null,
            token: null,
            isAuthenticated: false,
          });
        }
      },

      refreshUser: async () => {
        console.log('🔄 [AUTH STORE] Refreshing user data from ME API...');

        try {
          const response = await getCurrentUser();

          if (!response.success || !response.user) {
            console.error('❌ [AUTH STORE] Failed to refresh user:', response.error);
            // Don't clear auth on refresh failure - user might be offline
            return;
          }

          // Store partial branch config from ME API, then fetch complete config
          let branchName: string | undefined;
          if (response.branchConfig) {
            console.log('📦 [AUTH STORE] Partial branch config from ME API:', response.branchConfig);
            branchName = response.branchConfig.branchName;

            // Fetch COMPLETE config from dedicated endpoint (has timezone + orderPrefix)
            try {
              console.log('🔄 [AUTH STORE] Fetching complete branch config...');
              await useBranchConfigStore.getState().fetchConfig(
                response.user.branchId,
                response.user.tenantSlug
              );
              console.log('✅ [AUTH STORE] Complete branch config fetched successfully');
            } catch (configError) {
              console.error('⚠️ [AUTH STORE] Failed to fetch complete config, using partial:', configError);
              // Fallback: use partial config from ME API
              useBranchConfigStore.getState().setConfig(response.branchConfig);
            }
          }

          // Update user with fresh data
          set({
            user: {
              ...response.user,
              branchName, // Include branch name from branchConfig
            },
            isAuthenticated: true,
            error: null,
          });

          console.log('✅ [AUTH STORE] User refreshed successfully:', {
            userId: response.user.id,
            userName: response.user.name,
            branchName,
          });
        } catch (error) {
          console.error('❌ [AUTH STORE] Refresh user error:', error);
          // Don't throw - just log the error
        }
      },

      logout: async () => {
        console.log('🚪 [AUTH STORE] Logging out...');

        // Call API logout to clear tokens
        await apiLogout();

        // Clear branch configuration
        useBranchConfigStore.getState().clearConfig();

        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });

        console.log('✅ [AUTH STORE] Logout complete');
      },

      clearError: () => {
        set({ error: null });
      },

      setUser: (user) => {
        set({ user, isAuthenticated: true });
      },

      updateUser: (updates) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, ...updates } });
        }
      }
    }),
    {
      name: 'pos-auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
