import { useEffect } from 'react';
import { useThemeStore } from '../store/useThemeStore';  // 引入zustand store

// 获取当前系统的主题
const getSystemTheme = () => {
  const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
  return darkModeQuery.matches ? 'dark' : 'light';
};

const useTheme = () => {
  const { theme, setTheme } = useThemeStore(); // 从zustand获取和设置theme

  useEffect(() => {
    // 如果选择了 'auto'，根据系统的主题设置
    if (theme === 'auto') {
      const systemTheme = getSystemTheme();
      document.documentElement.setAttribute('data-theme', systemTheme);
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }

    // 监听系统主题变化，如果是 auto，实时切换
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const onThemeChange = (e) => {
      if (theme === 'auto') {
        const newTheme = e.matches ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        setTheme(newTheme);  // 更新zustand store的theme
      }
    };
    darkModeQuery.addEventListener('change', onThemeChange);

    // 清理监听器
    return () => {
      darkModeQuery.removeEventListener('change', onThemeChange);
    };
  }, [theme, setTheme]);

  const updateTheme = (newTheme) => {
    setTheme(newTheme); // 更新zustand store的主题
    if (newTheme === 'auto') {
      const systemTheme = getSystemTheme();
      document.documentElement.setAttribute('data-theme', systemTheme);
    } else {
      document.documentElement.setAttribute('data-theme', newTheme);
    }
  };

  return { theme, updateTheme };
};

export default useTheme;
