import React, { useEffect, useState, useRef, useMemo } from "react";
import { ConfigProvider, theme as antdTheme } from "antd";
import Header from "./components/Header";
import SettingMenu from "./components/SettingMenu";
import MainPage from "./pages/main";
import HomePage from "./pages/HomePage";
import { handleNewTab, handleUpdateTab } from "./services/browserViewService";
import useTheme from "./hooks/useTheme"; // 引入自定义 Hook

// 判断当前窗口类型
const query = new URLSearchParams(window.location.search);
const isSettingsWindow = query.get("window") === "settings";
const isHome = query.get("window") === "home";

const App = () => {
  const [showSettings, setShowSettings] = useState(false);
  const [scale, setScale] = useState(1.0);
  const settingsRef = useRef(null);
  const [currentKey, setCurrentKey] = useState(false);

  // 🎨 从 Hook 获取主题状态和更新逻辑
  const { theme } = useTheme();

  // 初始化设置
  const initSettings = async () => {
    const [auto, op, sc, key] = await Promise.all([
      window.electronAPI.getAutoHide?.(),
      window.electronAPI.getOpacity?.(),
      window.electronAPI.getScale?.(),
      window.electronAPI.getActiveKey?.(),
    ]);
    if (auto !== undefined) window.electronAPI?.setAutoHide?.(auto);
    if (op !== undefined) window.electronAPI?.setOpacity?.(op);
    if (sc !== undefined) {
      setScale(sc);
      window.electronAPI?.setScale?.(sc);
    }
    if (key !== undefined) setCurrentKey(key);
  };

  useEffect(() => {
    initSettings();
  }, []);

  // 点击外部关闭设置菜单
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showSettings &&
        settingsRef.current &&
        !settingsRef.current.contains(event.target)
      ) {
        setShowSettings(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSettings]);

  const toggleSettings = () => {
    window.electronAPI.openSettingsWindow();
  };

  // 根据窗口类型渲染
  const getDom = () => {
    if (isSettingsWindow) return <SettingMenu />;
    if (isHome)
      return (
        <HomePage
          onNewTab={handleNewTab}
          onUpdateTab={handleUpdateTab}
          currentKey={currentKey}
        />
      );
    return (
      <>
        <Header onOpenSettings={toggleSettings} showSettings={showSettings} />
        <div className="content-container">
          <MainPage />
        </div>
      </>
    );
  };

  // 动态控制 antd 主题：根据当前主题切换 light/dark algorithm
  const antdConfig = useMemo(() => {
    console.log('\n\ntheme', theme)
    return theme === 'dark'
      ? { algorithm: antdTheme.darkAlgorithm }
      : { algorithm: antdTheme.defaultAlgorithm };
  }, [theme]);

  return (
    <ConfigProvider
      theme={{
        ...antdConfig,
        token: {
          colorPrimary: "#4caf50",
          colorBgBase: theme === "dark" ? "#000" : "#fff",
        },
      }}
    >
      <div className="app-container">{getDom()}</div>
    </ConfigProvider>
  );
};

export default App;
