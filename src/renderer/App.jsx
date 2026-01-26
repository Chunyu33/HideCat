import React, { useEffect, useState, useRef, useMemo } from "react";
import { ConfigProvider, theme as antdTheme } from "antd";
import Header from "./components/Header";
import SettingMenu from "./components/SettingMenu";
import MainPage from "./pages/main";
import HomePageOnly from "./pages/HomePageOnly";
import { handleUpdateTab } from "./services/browserViewService";
import useTheme from "./hooks/useTheme"; // 引入自定义 Hook
import AnimatedBackground from "./components/AnimatedBackground"; // 动态背景

// 判断当前窗口类型
const query = new URLSearchParams(window.location.search);
const isSettingsWindow = query.get("window") === "settings";
const isHome = query.get("window") === "home";

const App = () => {
  const [scale, setScale] = useState(1.0);
  const [currentKey, setCurrentKey] = useState(false);
  const tabRef = useRef(null);

  const [headerVisible, setHeaderVisible] = useState(false);

  // 控制header显示
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (e.clientY <= 10) {
        // 鼠标在顶部xpx范围内
        setHeaderVisible(true);
        // console.log("显示");
      }
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

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

    // macOs 红绿灯
    // 设置 tab 栏位,兼容 macOS 红绿灯组件
    tabRef.current = document.querySelector('div[role="tablist"]');
    if(tabRef.current) {
      tabRef.current.style.paddingLeft = "70px";
    }
  };

  useEffect(() => {
    initSettings();
  }, []);

  const toggleSettings = () => {
    window.electronAPI.openSettingsWindow();
  };

  // 计算实际生效的主题（处理 auto 模式）
  const effectiveTheme = useMemo(() => {
    if (theme === "auto") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    return theme;
  }, [theme]);

  // 动态控制 antd 主题：根据实际主题切换 light/dark algorithm
  const antdConfig = useMemo(() => {
    return effectiveTheme === "dark"
      ? { algorithm: antdTheme.darkAlgorithm }
      : { algorithm: antdTheme.defaultAlgorithm };
  }, [effectiveTheme]);

  // 根据窗口类型渲染
  const getDom = () => {
    if (isSettingsWindow) return <SettingMenu />;
    if (isHome)
      return (
        <HomePageOnly onUpdateTab={handleUpdateTab} currentKey={currentKey} />
      );
    return (
      <>
        <Header
          onOpenSettings={toggleSettings}
          headerVisible={headerVisible}
          onRequestHide={() => setHeaderVisible(false)}
        />
        <div className="content-container">
          <MainPage />
        </div>
      </>
    );
  };

  const appDom = () => {
    if (isSettingsWindow) {
      // 设置页面有自己的ConfigProvider
      return <SettingMenu />;
    } else {
      return (
        <ConfigProvider
          theme={{
            ...antdConfig,
            token: {
              colorPrimary: "#4caf50",
              colorBgBase: effectiveTheme === "dark" ? "#000" : "#fff",
            },
          }}
        >
          <div className="app-container">
            <AnimatedBackground theme={theme} />
            {getDom()}
          </div>
        </ConfigProvider>
      );
    }
  };

  return appDom();
};

export default App;
