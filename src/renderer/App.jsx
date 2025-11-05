import React, { useEffect, useState, useRef } from "react";
import { ConfigProvider } from "antd";
import Header from "./components/Header";
import SettingMenu from "./components/SettingMenu";
import MainPage from "./pages/main";
import HomePage from "./pages/HomePage";

import { handleNewTab, handleUpdateTab } from "./services/browserViewService";

// 通过electron BrowserWindow 创建的窗口，通过 query 参数判断是否为设置窗口
const query = new URLSearchParams(window.location.search);
const isSettingsWindow = query.get("window") === "settings";
const isHome = query.get("window") === "home";

const App = () => {
  const [showSettings, setShowSettings] = useState(false);
  const [scale, setScale] = useState(1.0); // 添加缩放状态
  const settingsRef = useRef(null);
  const [currentKey, setCurrentKey] = useState(false);

  // 初始化设置
  const initSettings = async () => {
    // 从store中获取
    const [auto, op, sc, key] = await Promise.all([
      window.electronAPI.getAutoHide?.(),
      window.electronAPI.getOpacity?.(),
      window.electronAPI.getScale?.(),
      window.electronAPI.getActiveKey?.(),
    ]);
    console.log(auto, op, sc, "-----store");
    if (auto !== undefined) {
      window.electronAPI?.setAutoHide?.(auto);
    }
    if (op !== undefined) {
      window.electronAPI?.setOpacity?.(op);
    }
    if (sc !== undefined) {
      // window.electronAPI?.setScale?.(sc);
      setScale(sc); // 设置初始缩放级别
    }
    if (key !== undefined) {
      setCurrentKey(key);
    }
  };

  // 初始化时从 store 获取状态并且应用设置
  useEffect(() => {
    initSettings();
  }, []);

  // 处理点击外部区域关闭设置菜单
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

  // 控制设置菜单显示/隐藏的函数
  const toggleSettings = () => {
    window.electronAPI.openSettingsWindow();
  };

  // 处理缩放变化
  const handleScaleChange = (newScale) => {
    setScale(newScale);
  };

  // 条件渲染
  const getDom = () => {
    if (isSettingsWindow) {
      // 仅返回设置菜单
      return <SettingMenu />;
    } else if (isHome) {
      // 仅返回主页内容（不包含header）
      return (
        <HomePage
          onNewTab={handleNewTab}
          onUpdateTab={handleUpdateTab}
          currentKey={currentKey}
        />
      );
    } else {
      // 默认情况下 返回整个完整布局的dom
      return (
        <>
          <Header onOpenSettings={toggleSettings} showSettings={showSettings} />
          <div className="content-container">
            <MainPage />
          </div>
        </>
      );
    }
  };

  return (
    <ConfigProvider theme={{ token: { colorPrimary: "#4caf50" } }}>
      <div className="app-container">{getDom()}</div>
    </ConfigProvider>
  );
};

export default App;
