import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import api from '@services/api';

export const useTenantStore = create(
  persist(
    (set, get) => ({
      tenant: null,
      tenantId: null,
      isLoading: false,

      // ── Set tenant from login ─────────────────────────────────────────────
      setTenant: (tenant) => {
        set({ tenant, tenantId: tenant?.id || null });
        if (tenant?.id) {
          api.defaults.headers.common['X-Tenant-ID'] = tenant.id;
        }
      },

      // ── Fetch tenant details ──────────────────────────────────────────────
      fetchTenant: async (tenantId) => {
        set({ isLoading: true });
        try {
          const res = await api.get(`/api/admin/tenant/${tenantId}`);
          const tenant = res.data.data;
          set({ tenant, tenantId: tenant.id, isLoading: false });
          return tenant;
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      // ── Clear tenant on logout ────────────────────────────────────────────
      clearTenant: () => {
        set({ tenant: null, tenantId: null });
        delete api.defaults.headers.common['X-Tenant-ID'];
      },

      // ── Helpers ───────────────────────────────────────────────────────────
      getTenantName: () => get().tenant?.name || 'FACT FinOS',
      getTenantCurrency: () => get().tenant?.currency || 'INR',
      getTenantGSTIN: () => get().tenant?.gstin || '',
      isGSTRegistered: () => Boolean(get().tenant?.gstin),
    }),
    {
      name: 'fact-tenant',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        tenant: state.tenant,
        tenantId: state.tenantId,
      }),
    }
  )
);
