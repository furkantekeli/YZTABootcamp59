import { create } from 'zustand';

let toastIdCounter = 0;

export const useUiStore = create((set, get) => ({
  sidebarOpen: window.innerWidth > 768,
  toasts: [],
  activeNotifications: [],
  searchQuery: '',

  toggleSidebar: () =>
    set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  setSidebarOpen: (open) =>
    set({ sidebarOpen: open }),

  setSearchQuery: (query) =>
    set({ searchQuery: query }),

  addToast: (toast) => {
    const id = ++toastIdCounter;
    const newToast = {
      id,
      type: toast.type || 'info',
      title: toast.title || '',
      message: toast.message || '',
      duration: toast.duration || 5000,
    };

    set((state) => ({
      toasts: [...state.toasts, newToast],
    }));

    // Auto-dismiss
    if (newToast.duration > 0) {
      setTimeout(() => {
        get().removeToast(id);
      }, newToast.duration);
    }

    return id;
  },

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  clearToasts: () =>
    set({ toasts: [] }),

  addNotification: (notification) =>
    set((state) => ({
      activeNotifications: [notification, ...state.activeNotifications].slice(0, 20),
    })),

  clearNotifications: () =>
    set({ activeNotifications: [] }),
}));

export default useUiStore;
