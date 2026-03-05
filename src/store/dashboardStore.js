import { create } from 'zustand';

export const useDashboardStore = create((set) => ({
  // Live price (WebSocket)
  livePrice: null,
  priceChange: null,
  setLivePrice: (price, change) => set({ livePrice: price, priceChange: change }),

  // Active time range for price chart
  chartRange: '30D',
  setChartRange: (range) => set({ chartRange: range }),

  // Sidebar open/close
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  // Active section (scroll-spy)
  activeSection: 's01',
  setActiveSection: (id) => set({ activeSection: id }),

  // Export status
  exporting: false,
  setExporting: (v) => set({ exporting: v }),

  // Toast messages
  toasts: [],
  addToast: (message, type = 'success') =>
    set((s) => ({
      toasts: [...s.toasts, { id: Date.now(), message, type }],
    })),
  removeToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
