import React, { useEffect, useState } from "react";
import { ConfigProvider } from "antd";
import Header from "./components/Header";
import SettingMenu from "./components/SettingMenu";

const App = () => {
  const [showSettings, setShowSettings] = useState(false);

  // 初始化设置
  const initSettings = async () => {
    // 从store中获取
    const [auto, op, sc] = await Promise.all([
      window.electronAPI.getAutoHide?.(),
      window.electronAPI.getOpacity?.(),
      window.electronAPI.getScale?.(),
    ]);
    console.log(auto, op, sc, '-----store')
    if (auto !== undefined) {
      window.electronAPI?.setAutoHide?.(auto);
    };
    if (op !== undefined) {
      window.electronAPI?.setOpacity?.(op);
    };
    if (sc !== undefined) {
      window.electronAPI?.setScale?.(sc);
    };
  }

  // 初始化时从 store 获取状态并且应用设置
  useEffect(() => {
    initSettings();
  }, []);

  // 全局快捷键 Alt+F 在主进程已注册，这里不需要
  // 这里只管理设置菜单展示和页面嵌入 iframe

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#4caf50',
        },
      }}
    >
      <div className="app-container">
        <Header onOpenSettings={() => setShowSettings(true)} />
        {showSettings && (
          <SettingMenu onClose={() => setShowSettings(false)} />
        )}
      </div>
    </ConfigProvider>
  );
};

export default App;