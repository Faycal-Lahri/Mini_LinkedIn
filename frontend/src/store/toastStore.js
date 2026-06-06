import { create } from 'zustand';

const useToastStore = create((set) => ({
  toasts: [],
  addToast: (message, type = 'info') => {
    const id = Date.now() + Math.random().toString(36).substring(7);
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 4000); // 4 seconds duration
  },
  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter(t => t.id !== id) }))
}));

export default useToastStore;
