import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import api from '@services/api';

const initialState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  mfaRequired: false,
  mfaUserId: null,
  permissions: [],
  roles: [],
};

export const useAuthStore = create(
  persist(
    (set, get) => ({
      ...initialState,

      // ── Initialize auth from storage ──────────────────────────────────────
      initAuth: () => {
        const { token, user } = get();
        if (token && user) {
          // Token exists in storage — mark authenticated
          set({ isAuthenticated: true });
          // Set the token in API headers
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          if (user.tenantId) {
            api.defaults.headers.common['X-Tenant-ID'] = user.tenantId;
          }
        }
      },

      // ── Login (step 1: credentials) ───────────────────────────────────────
      login: async ({ email, password, tenantId }) => {
        set({ isLoading: true });
        try {
          const res = await api.post('/api/auth/login', { email, password }, {
            headers: { 'X-Tenant-ID': tenantId },
          });

          const { data } = res.data;

          // MFA required
          if (data.mfaRequired) {
            set({ isLoading: false, mfaRequired: true, mfaUserId: data.userId });
            return { mfaRequired: true };
          }

          // Full login success
          const { user, accessToken, refreshToken, permissions, roles } = data;
          api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
          api.defaults.headers.common['X-Tenant-ID'] = tenantId;

          set({
            isLoading: false,
            isAuthenticated: true,
            user: { ...user, tenantId },
            token: accessToken,
            refreshToken,
            permissions: permissions || [],
            roles: roles || [],
            mfaRequired: false,
            mfaUserId: null,
          });

          return { success: true };
        } catch (err) {
          set({ isLoading: false });
          const message = err.response?.data?.message || 'Login failed';
          throw new Error(message);
        }
      },

      // ── Login (step 2: MFA verification) ─────────────────────────────────
      verifyMFA: async ({ token: mfaToken, isBackupCode = false }) => {
        const { mfaUserId } = get();
        set({ isLoading: true });
        try {
          const res = await api.post('/api/auth/mfa/verify', {
            userId: mfaUserId,
            token: mfaToken,
            isBackupCode,
          });

          const { user, accessToken, refreshToken, permissions, roles } = res.data.data;
          api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
          if (user.tenantId) {
            api.defaults.headers.common['X-Tenant-ID'] = user.tenantId;
          }

          set({
            isLoading: false,
            isAuthenticated: true,
            user,
            token: accessToken,
            refreshToken,
            permissions: permissions || [],
            roles: roles || [],
            mfaRequired: false,
            mfaUserId: null,
          });

          return { success: true };
        } catch (err) {
          set({ isLoading: false });
          const message = err.response?.data?.message || 'MFA verification failed';
          throw new Error(message);
        }
      },

      // ── Refresh access token ──────────────────────────────────────────────
      refreshAccessToken: async () => {
        const { refreshToken } = get();
        if (!refreshToken) throw new Error('No refresh token');

        const res = await api.post('/api/auth/refresh', { refreshToken });
        const { accessToken, refreshToken: newRefreshToken } = res.data.data;

        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        set({ token: accessToken, refreshToken: newRefreshToken });

        return accessToken;
      },

      // ── Logout ────────────────────────────────────────────────────────────
      logout: async () => {
        const { token } = get();
        try {
          if (token) {
            await api.post('/api/auth/logout');
          }
        } catch (_) {
          // Ignore logout API errors
        } finally {
          delete api.defaults.headers.common['Authorization'];
          delete api.defaults.headers.common['X-Tenant-ID'];
          set({ ...initialState });
        }
      },

      // ── Enable MFA ────────────────────────────────────────────────────────
      setupMFA: async () => {
        const res = await api.post('/api/auth/mfa/setup');
        return res.data.data; // { secret, qrCodeUrl, backupCodes }
      },

      enableMFA: async ({ secret, token: mfaToken }) => {
        const res = await api.post('/api/auth/mfa/enable', { secret, token: mfaToken });
        set((state) => ({
          user: { ...state.user, mfa_enabled: true },
        }));
        return res.data;
      },

      disableMFA: async ({ token: mfaToken }) => {
        const res = await api.post('/api/auth/mfa/disable', { token: mfaToken });
        set((state) => ({
          user: { ...state.user, mfa_enabled: false },
        }));
        return res.data;
      },

      // ── Change password ───────────────────────────────────────────────────
      changePassword: async ({ currentPassword, newPassword }) => {
        const res = await api.post('/api/auth/change-password', { currentPassword, newPassword });
        return res.data;
      },

      // ── Permission helpers ────────────────────────────────────────────────
      hasPermission: (permission) => {
        const { permissions } = get();
        return permissions.includes(permission) || permissions.includes('*');
      },

      hasRole: (role) => {
        const { roles } = get();
        return roles.includes(role) || roles.includes('admin');
      },

      hasAnyRole: (...roleList) => {
        const { roles } = get();
        if (roles.includes('admin')) return true;
        return roleList.some((r) => roles.includes(r));
      },

      // ── Update user profile locally ────────────────────────────────────────
      updateUser: (updates) => {
        set((state) => ({
          user: { ...state.user, ...updates },
        }));
      },
    }),
    {
      name: 'fact-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        permissions: state.permissions,
        roles: state.roles,
      }),
    }
  )
);
