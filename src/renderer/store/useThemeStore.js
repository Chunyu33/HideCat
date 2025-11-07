import { create } from "zustand";

export const useThemeStore = create((set) => ({
  theme: "light",
  initialized: false,

  initTheme: async () => {
    const _theme = await window.electronAPI.getTheme?.();
    set({ theme: _theme || "light", initialized: true });
  },

  setTheme: async (newTheme) => {
    set({ theme: newTheme }); // 更新 Zustand 状态
  },
}));
