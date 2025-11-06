import { create } from "zustand";

export const useShortcutStore = create((set) => ({
  shortcuts: [],
  initialized: false,

  // 初始化，从 electron-store 加载
  initShortcuts: async () => {
    const data = await window.electronAPI.getShortcuts?.();
    set({ shortcuts: data || [], initialized: true });
  },

  // 新增
  addShortcut: async (item) => {
    const updated = await window.electronAPI.addShortcut(item);
    set({ shortcuts: updated });
  },

  // 更新
  updateShortcut: async (newItem) => {
    const updated = await window.electronAPI.updateShortcut(newItem);
    set({ shortcuts: updated });
  },

  // 删除
  deleteShortcut: async (id) => {
    const updated = await window.electronAPI.removeShortcut(id);
    set({ shortcuts: updated });
  },
}));
