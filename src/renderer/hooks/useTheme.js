import { useEffect } from "react";
import { useThemeStore } from "../store/useThemeStore";

const useTheme = () => {
  const { theme, setTheme } = useThemeStore();

  useEffect(() => {
    // 初始化时从主进程读取一次主题
    window.electronAPI.getTheme().then((savedTheme) => {
      if (savedTheme) setTheme(savedTheme);
    });

    // 监听主进程发来的主题变更事件
    const offThemeChanged = window.electronAPI.onThemeChanged((newTheme) => {
      // 防止 undefined 或空值
      if (newTheme && newTheme !== theme) {
        console.log("[Renderer] Theme changed from main:", newTheme);
        setTheme(newTheme);
      }
    });

    return () => {
      if (typeof offThemeChanged === "function") offThemeChanged();
    };
  }, [setTheme, theme]);

  // 根据主题设置 DOM 属性
  useEffect(() => {
    if (!theme) return;

    const darkModeQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const applyTheme = (targetTheme) => {
      document.documentElement.setAttribute("data-theme", targetTheme);
      console.log("[Renderer] Set theme:", targetTheme);
    };

    if (theme === "auto") {
      // 初始化时根据系统主题设置
      applyTheme(darkModeQuery.matches ? "dark" : "light");

      // 监听系统主题变化（仅 auto 时）
      const handleSystemThemeChange = (e) => {
        applyTheme(e.matches ? "dark" : "light");
      };
      darkModeQuery.addEventListener("change", handleSystemThemeChange);

      return () => {
        darkModeQuery.removeEventListener("change", handleSystemThemeChange);
      };
    } else {
      // 用户指定 light/dark
      applyTheme(theme);
    }
  }, [theme]);

  return { theme };
};

export default useTheme;
