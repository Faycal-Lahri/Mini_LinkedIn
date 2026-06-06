import { create } from 'zustand';

const useConfirmStore = create((set) => ({
    isOpen: false,
    message: '',
    onConfirm: null,
    onCancel: null,
    showConfirm: (message, onConfirm, onCancel = null) => set({
        isOpen: true,
        message,
        onConfirm: () => {
            set({ isOpen: false });
            if (onConfirm) onConfirm();
        },
        onCancel: () => {
            set({ isOpen: false });
            if (onCancel) onCancel();
        }
    }),
    closeConfirm: () => set({ isOpen: false })
}));

export default useConfirmStore;
