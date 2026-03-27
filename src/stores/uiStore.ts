import { create } from "zustand";

export type ModalKey =
  | "walletSelection"
  | "addWallet"
  | "deleteWallet"
  | "addTransaction"
  | "passwordReset"
  | "editName";

interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant?: "error" | "success" | "info";
}

interface UIState {
  activeTab: number;
  modals: Record<ModalKey, boolean>;
  toasts: ToastItem[];
  setActiveTab: (index: number) => void;
  openModal: (key: ModalKey) => void;
  closeModal: (key: ModalKey) => void;
  pushToast: (toast: Omit<ToastItem, "id">) => void;
  removeToast: (id: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeTab: 0,
  modals: {
    walletSelection: false,
    addWallet: false,
    deleteWallet: false,
    addTransaction: false,
    passwordReset: false,
    editName: false,
  },
  toasts: [],
  setActiveTab: (index) => set({ activeTab: index }),
  openModal: (key) =>
    set((state) => ({ modals: { ...state.modals, [key]: true } })),
  closeModal: (key) =>
    set((state) => ({ modals: { ...state.modals, [key]: false } })),
  pushToast: (toast) =>
    set((state) => ({
      toasts: [
        ...state.toasts,
        { id: `${Date.now()}-${Math.random()}`, ...toast },
      ],
    })),
  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((item) => item.id !== id) })),
}));
