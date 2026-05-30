import { create } from 'zustand';
import api from '@services/api';

export const useModuleStore = create((set, get) => ({
  modules: [],        // Full module list with status
  enabledIds: new Set(), // Set of enabled module IDs for O(1) lookup
  isLoading: false,
  lastFetched: null,

  // ── Fetch enabled modules for current tenant ─────────────────────────────
  fetchModules: async () => {
    // Avoid re-fetch if fetched in last 5 minutes
    const { lastFetched } = get();
    if (lastFetched && Date.now() - lastFetched < 5 * 60 * 1000) return;

    set({ isLoading: true });
    try {
      const res = await api.get('/api/admin/modules');
      const modules = res.data.data || [];
      const enabledIds = new Set(
        modules.filter((m) => m.isEnabled).map((m) => m.id)
      );
      set({ modules, enabledIds, isLoading: false, lastFetched: Date.now() });
    } catch (err) {
      set({ isLoading: false });
      // Don't throw — modules fetch failure should not crash the app
      console.error('Failed to fetch modules:', err);
    }
  },

  // ── Check if a module is enabled ──────────────────────────────────────────
  isModuleEnabled: (moduleId) => {
    if (!moduleId) return true;
    const { enabledIds, lastFetched, isLoading } = get();
    // Treat as enabled while modules are still being fetched (optimistic)
    if (!lastFetched && !isLoading) return true;
    if (isLoading) return true;
    return enabledIds.has(moduleId);
  },

  // ── Get module metadata ───────────────────────────────────────────────────
  getModule: (moduleId) => {
    return get().modules.find((m) => m.id === moduleId) || null;
  },

  // ── Get modules by category ───────────────────────────────────────────────
  getModulesByCategory: (category) => {
    return get().modules.filter((m) => m.category === category && m.isEnabled);
  },

  // ── Enable a module (admin action) ────────────────────────────────────────
  enableModule: async (moduleId) => {
    await api.post(`/api/admin/modules/${moduleId}/enable`);
    set((state) => {
      const enabledIds = new Set(state.enabledIds);
      enabledIds.add(moduleId);
      const modules = state.modules.map((m) =>
        m.id === moduleId ? { ...m, isEnabled: true } : m
      );
      return { modules, enabledIds };
    });
  },

  // ── Disable a module (admin action) ───────────────────────────────────────
  disableModule: async (moduleId) => {
    await api.post(`/api/admin/modules/${moduleId}/disable`);
    set((state) => {
      const enabledIds = new Set(state.enabledIds);
      enabledIds.delete(moduleId);
      const modules = state.modules.map((m) =>
        m.id === moduleId ? { ...m, isEnabled: false } : m
      );
      return { modules, enabledIds };
    });
  },

  // ── Force refresh ─────────────────────────────────────────────────────────
  invalidate: () => set({ lastFetched: null }),

  // ── Clear on logout ───────────────────────────────────────────────────────
  clear: () => set({ modules: [], enabledIds: new Set(), isLoading: false, lastFetched: null }),
}));
