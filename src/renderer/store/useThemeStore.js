import { create } from "zustand";

export const useThemeStore = create((set) => ({
  theme: "light",
  initialized: false,

  initTheme: async () => {
    const _theme = await window.electronAPI.getTheme?.();
    set({ theme: _theme || "light", initialized: true });
  },

  setTheme: async (newTheme) => {
    const updatedTheme = await window.electronAPI.setTheme(newTheme);
    set({ theme: updatedTheme }); // 更新 Zustand 状态
  },
}));
